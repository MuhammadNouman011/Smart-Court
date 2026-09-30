"""
End-to-End Integration Test

Exercises the full path a real question takes: HTTP request in, category and
language detection, ChromaDB retrieval, Ollama generation, structured response
out — including the Server-Sent-Events stream the React frontend consumes.

Unlike `test_rag.py` (retrieval only) and `test_api.py` (validation only), this
suite requires **Ollama to be running**, because generation is the part being
verified. It skips gracefully if Ollama is unreachable.

Run:  python tests/test_e2e.py
"""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from fastapi.testclient import TestClient

from config import settings
from main import app


RESULTS_DIR = Path(__file__).resolve().parent / 'results'
client = TestClient(app)

results = []

# A small set, because each one runs a real generation on CPU
E2E_QUERIES = [
    ("My employer has not paid my salary for three months", "Labour", "en"),
    ("My landlord is evicting me without notice", "Tenant", "en"),
    ("میرے آجر نے تنخواہ نہیں دی", "Labour", "ur"),
]


def check(name, condition, detail=''):
    results.append({'name': name, 'ok': bool(condition), 'detail': str(detail)})
    print(f'  [{"PASS" if condition else "FAIL"}] {name:48} {detail}')
    return condition


def banner(title):
    print()
    print('=' * 74)
    print(f'  {title}')
    print('=' * 74)


def ollama_available():
    """True when the Ollama server responds and has at least one model."""
    try:
        r = httpx.get(f'{settings.ollama_base_url}/api/tags', timeout=5)
        return r.status_code == 200 and bool(r.json().get('models'))
    except Exception:
        return False


def installed_models():
    try:
        r = httpx.get(f'{settings.ollama_base_url}/api/tags', timeout=5)
        return [m['name'] for m in r.json().get('models', [])]
    except Exception:
        return []


# --------------------------------------------------------------------------

def test_non_generative_path():
    """The parts of the pipeline that work without the LLM."""
    banner('Pipeline without generation')

    for query, expected_cat, expected_lang in E2E_QUERIES:
        r = client.get('/api/chat/detect', params={'text': query})
        if r.status_code == 200:
            body = r.json()
            display = query[:34] + ('..' if len(query) > 34 else '')
            check(f'detect: {display}',
                  body.get('category') == expected_cat
                  and body.get('language') == expected_lang,
                  f'{body.get("category")}/{body.get("language")}')


def test_full_answer(model):
    """A complete non-streaming answer, end to end."""
    banner('Full answer (POST /api/chat)')

    query, expected_cat, _ = E2E_QUERIES[0]
    print(f'  Query: {query}')
    print(f'  Model: {model}  (generation on CPU — this takes a while)')
    print()

    start = time.time()
    r = client.post('/api/chat', json={'message': query})
    elapsed = time.time() - start

    if not check('POST /api/chat returns 200', r.status_code == 200,
                 f'{r.status_code} in {elapsed:.1f}s'):
        print(f'    body: {r.text[:300]}')
        return None

    body = r.json()

    check('  response is JSON object', isinstance(body, dict),
          f'{len(body)} keys')

    # The schema the frontend renders, as declared by ChatResponse
    for field in ('session_id', 'category', 'language', 'answer',
                  'citations', 'action_plan', 'case_strength',
                  'warning', 'sources'):
        present = field in body and body[field] not in (None, '', [])
        check(f'  has {field}', present,
              str(body.get(field))[:44] if present else 'missing')

    if isinstance(body.get('case_strength'), (int, float)):
        score = body['case_strength']
        check('  case_strength within 0-100', 0 <= score <= 100, score)

    if isinstance(body.get('citations'), list):
        check('  citations is a non-empty list', len(body['citations']) > 0,
              f'{len(body["citations"])} citations')

    if isinstance(body.get('action_plan'), list):
        check('  action_plan has steps', len(body['action_plan']) > 0,
              f'{len(body["action_plan"])} steps')

    check('  answered within 180s', elapsed < 180, f'{elapsed:.1f}s')
    return body


def test_streaming():
    """
    The SSE stream the React frontend consumes.

    The frontend parses frames split on a blank line, each carrying a
    `data: {...}` payload with a `type` field. If those event names or the
    frame format change, the interface silently stops updating — so this test
    checks the contract, not just that bytes arrive.
    """
    banner('Streaming (POST /api/chat/stream)')

    query = E2E_QUERIES[0][0]
    print(f'  Query: {query}')
    print()

    start = time.time()
    first_chunk_at = None
    event_types = []
    text = ''

    with client.stream('POST', '/api/chat/stream',
                       json={'message': query}) as response:

        if not check('stream returns 200', response.status_code == 200,
                     response.status_code):
            return

        content_type = response.headers.get('content-type', '')
        check('  content-type is event-stream',
              'event-stream' in content_type, content_type)

        buffer = ''
        for raw in response.iter_text():
            buffer += raw
            frames = buffer.split('\n\n')
            buffer = frames.pop()

            for frame in frames:
                line = next((l for l in frame.split('\n')
                             if l.startswith('data: ')), None)
                if not line:
                    continue
                try:
                    event = json.loads(line[6:])
                except json.JSONDecodeError:
                    continue

                event_types.append(event.get('type'))

                # The backend sends the payload under `data`, and
                # frontend/src/lib/api.js reads `evt.data` — this assertion
                # pins that contract on both sides.
                if event.get('type') == 'chunk':
                    if first_chunk_at is None:
                        first_chunk_at = time.time() - start
                    piece = event.get('data')
                    if isinstance(piece, str):
                        text += piece

    elapsed = time.time() - start

    check('  frames parsed', len(event_types) > 0, f'{len(event_types)} events')

    unique = []
    for t in event_types:
        if t not in unique:
            unique.append(t)
    print(f'    event types seen: {unique}')

    check('  emits chunk events', 'chunk' in event_types,
          f'{event_types.count("chunk")} chunks')
    check('  emits a final event',
          'final' in event_types or 'done' in event_types,
          'final' if 'final' in event_types else 'done' if 'done' in event_types else 'neither')
    check('  streamed text is non-empty', len(text) > 0, f'{len(text)} chars')

    check('  chunk payload is under "data"', len(text) > 0,
          'matches frontend evt.data')

    if first_chunk_at is not None:
        # Streaming exists so the user sees progress quickly. TestClient
        # buffers the response rather than delivering frames as they arrive,
        # so first-chunk timing is not measurable here — it is reported for
        # information rather than asserted.
        print(f'    first chunk at {first_chunk_at:.1f}s of {elapsed:.1f}s '
              f'(TestClient buffers; not a latency measurement)')


def test_retrieval_reaches_generation():
    """Confirm the answer is actually grounded in a retrieved statute."""
    banner('Grounding: retrieval feeds generation')

    from services import rag_service

    query = 'The police are refusing to register my FIR'
    passages = rag_service.retrieve(query, category='Criminal', k=5)

    check('retrieval returns passages', len(passages) > 0, f'{len(passages)}')
    if not passages:
        return

    top = passages[0]
    print(f'    top citation: {top["citation"]}')
    check('  top passage has citation', bool(top.get('citation')),
          top.get('citation'))

    r = client.post('/api/chat', json={'message': query})
    if r.status_code != 200:
        check('  chat answered', False, r.status_code)
        return

    body = r.json()
    cited = ' '.join(str(c) for c in (body.get('citations') or [])).lower()
    sources = json.dumps(body.get('sources', '')).lower()

    # The retrieved statute should appear either in the citations the model
    # produced or in the sources returned alongside the answer.
    key = (top['citation'] or '').split(',')[0].strip().lower()
    grounded = key and (key in cited or key in sources)

    check('  answer references the retrieved law', bool(grounded),
          f'looked for "{key}"')


def test_frontend_contract():
    """
    Fields the React components read must exist in the API response.

    A rename on the backend breaks the interface with no error anywhere —
    this pins the contract.
    """
    banner('Frontend contract')

    r = client.get('/api/documents/types')
    if check('GET /documents/types', r.status_code == 200, r.status_code):
        types = r.json()
        if isinstance(types, list) and types:
            first = types[0]
            if isinstance(first, dict):
                check('  document type has id and label',
                      'id' in first or 'value' in first or 'type' in first,
                      list(first.keys())[:4])

    r = client.post('/api/inheritance/calculate',
                    json={'spouse': 'wife', 'wives': 1, 'sons': 1,
                          'estate_value': 800000})
    if check('POST /inheritance/calculate', r.status_code == 200, r.status_code):
        body = r.json()
        shares = body.get('shares') or body.get('heirs') or []
        check('  returns shares for the donut chart', len(shares) > 0,
              f'{len(shares)} entries')

    r = client.get('/api/chat/detect', params={'text': 'test'})
    if check('GET /chat/detect', r.status_code == 200, r.status_code):
        body = r.json()
        check('  returns category and language',
              'category' in body and 'language' in body,
              list(body.keys()))


def write_report(model, skipped):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    passed = sum(1 for r in results if r['ok'])

    lines = ['# End-to-End Test Report', '',
             f'Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}', '',
             f'Ollama model: `{model or "not available"}`  ',
             f'Embedding model: `{settings.embedding_model}`', '']

    if skipped:
        lines += ['> Generation tests were skipped because Ollama was not '
                  'reachable. Retrieval and contract tests still ran.', '']

    lines += [f'**{passed}/{len(results)} checks passed**', '',
              '| Check | Result | Detail |', '|---|---|---|']
    for r in results:
        lines.append(f'| {r["name"]} | {"pass" if r["ok"] else "**fail**"} '
                     f'| {r["detail"]} |')

    report = RESULTS_DIR / 'e2e_test_report.md'
    report.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return report


def main():
    banner('Smart Court - End-to-End Integration Tests')

    available = ollama_available()
    models = installed_models()
    model = settings.ollama_model

    print(f'Configured model : {model}')
    print(f'Ollama reachable : {available}')
    if models:
        print(f'Installed models : {", ".join(models)}')
        if model not in models:
            print(f'\n  NOTE: configured model "{model}" is not installed.')
            print(f'        Using "{models[0]}" for these tests instead.')
            model = models[0]
            settings.__dict__['ollama_model'] = model

    test_non_generative_path()
    test_frontend_contract()

    if available:
        test_full_answer(model)
        test_streaming()
        test_retrieval_reaches_generation()
    else:
        banner('Generation tests SKIPPED')
        print('  Ollama is not reachable at '
              f'{settings.ollama_base_url}')
        print('  Start it with:  ollama serve')
        print('  Retrieval and contract tests above still ran.')

    report = write_report(model, skipped=not available)
    passed = sum(1 for r in results if r['ok'])

    banner('Summary')
    print(f'{passed}/{len(results)} checks passed')
    failed = [r for r in results if not r['ok']]
    if failed:
        print('\nFailed:')
        for r in failed:
            print(f'  - {r["name"]}  ({r["detail"]})')
    print(f'\nReport: {report}')


if __name__ == '__main__':
    main()
