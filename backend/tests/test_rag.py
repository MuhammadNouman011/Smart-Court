"""
RAG Pipeline Test Suite

Measures the retrieval and classification layers against sample legal queries
with known expected outcomes.

Retrieval is scored two ways, because they answer different questions:

- **Hit rate** - was the correct statute retrieved anywhere in the top-k? This
  is what determines whether a correct answer is *possible*.
- **Top-1 accuracy** - was it ranked first? This matters more than hit rate
  here, because the prompt passes only the top passage to the model.

Run:  python tests/test_rag.py
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import settings
from services import rag_service
from services.llm_service import detect_category, detect_language


RESULTS_DIR = Path(__file__).resolve().parent / 'results'


# --------------------------------------------------------------------------
# Test data - queries with the category and statute they should retrieve
# --------------------------------------------------------------------------

# (query, expected_category, keyword that must appear in the retrieved citation
#  or title for the retrieval to count as correct)
QUERIES = [
    # Labour
    ("My employer has not paid my salary for three months",
     "Labour", ["wage", "payment", "labour", "employ"]),
    ("I was fired without any notice from the factory",
     "Labour", ["termination", "labour", "employ", "standing order"]),
    ("Am I entitled to overtime pay for extra hours?",
     "Labour", ["overtime", "hour", "labour", "factories"]),

    # Tenant
    ("My landlord is evicting me without proper notice",
     "Tenant", ["rent", "tenant", "eviction", "premises"]),
    ("The house owner refuses to return my security deposit",
     "Tenant", ["rent", "deposit", "tenant"]),

    # Family
    ("How do I file for khula from my husband?",
     "Family", ["family", "dissolution", "muslim", "marriage", "khula"]),
    ("My husband is not paying maintenance for our children",
     "Family", ["maintenance", "family", "muslim", "nafaqa"]),
    ("What are my rights regarding haq mehr after divorce?",
     "Family", ["dower", "mehr", "muslim", "family"]),

    # Criminal
    ("The police are refusing to register my FIR",
     "Criminal", ["154", "criminal procedure", "fir", "information"]),
    ("Someone is sending me threatening messages",
     "Criminal", ["intimidation", "penal", "threat", "506"]),
    ("I was harassed by my colleague at work",
     "Criminal", ["harassment", "penal", "354", "509"]),

    # Consumer
    ("The shop refuses to refund my defective phone",
     "Consumer", ["consumer", "defective", "refund", "protection"]),
    ("I received a fake product from an online order",
     "Consumer", ["consumer", "protection", "fake", "goods"]),

    # Urdu
    ("میرے آجر نے تین ماہ سے تنخواہ نہیں دی",
     "Labour", ["wage", "payment", "labour", "employ"]),
    ("مالک مکان مجھے بے دخل کر رہا ہے",
     "Tenant", ["rent", "tenant", "eviction", "premises"]),
]

# Queries whose language should be detected as Urdu
URDU_QUERIES = [q for q, _, _ in QUERIES if any('؀' <= c <= 'ۿ' for c in q)]


def banner(title):
    print()
    print('=' * 72)
    print(f'  {title}')
    print('=' * 72)


def matches(retrieved, keywords):
    """True when any expected keyword appears in the citation or title."""
    haystack = f"{retrieved.get('citation') or ''} {retrieved.get('title') or ''}".lower()
    return any(kw.lower() in haystack for kw in keywords)


# --------------------------------------------------------------------------
# Test 1 - category detection
# --------------------------------------------------------------------------

def test_category_detection():
    banner('TEST 1  Category detection')

    print(f'{"query":52} {"expected":10} {"got":10} {"ok":>4}')
    print('-' * 72)

    rows = []
    for query, expected, _ in QUERIES:
        got = detect_category(query)
        ok = got == expected
        rows.append({'query': query, 'expected': expected, 'got': got, 'ok': ok})

        display = query[:50] + ('..' if len(query) > 50 else '')
        print(f'{display:52} {expected:10} {got:10} {"yes" if ok else "NO":>4}')

    correct = sum(1 for r in rows if r['ok'])
    print('-' * 72)
    print(f'{correct}/{len(rows)} correct ({correct / len(rows) * 100:.0f}%)')
    return rows


# --------------------------------------------------------------------------
# Test 2 - language detection
# --------------------------------------------------------------------------

def test_language_detection():
    banner('TEST 2  Language detection')

    rows = []
    for query, _, _ in QUERIES:
        expected = 'ur' if query in URDU_QUERIES else 'en'
        got = detect_language(query)
        ok = got == expected
        rows.append({'query': query, 'expected': expected, 'got': got, 'ok': ok})

        display = query[:50] + ('..' if len(query) > 50 else '')
        print(f'{display:52} {expected:>4} -> {got:>4}  {"ok" if ok else "MISMATCH"}')

    correct = sum(1 for r in rows if r['ok'])
    print('-' * 72)
    print(f'{correct}/{len(rows)} correct')
    return rows


# --------------------------------------------------------------------------
# Test 3 - retrieval quality
# --------------------------------------------------------------------------

def test_retrieval():
    banner('TEST 3  Retrieval quality (k=5)')

    print(f'{"query":44} {"top-1":>6} {"hit@5":>6} {"rank":>5} {"time":>7}')
    print('-' * 72)

    rows = []
    for query, expected_cat, keywords in QUERIES:
        start = time.time()
        results = rag_service.retrieve(query, category=expected_cat, k=5)
        elapsed = time.time() - start

        rank = None
        for i, r in enumerate(results, start=1):
            if matches(r, keywords):
                rank = i
                break

        top1 = rank == 1
        hit = rank is not None

        rows.append({
            'query': query,
            'category': expected_cat,
            'top1': top1,
            'hit': hit,
            'rank': rank,
            'seconds': round(elapsed, 3),
            'top_citation': results[0]['citation'] if results else None,
            'returned': len(results),
        })

        display = query[:42] + ('..' if len(query) > 42 else '')
        print(f'{display:44} {"yes" if top1 else "no":>6} '
              f'{"yes" if hit else "NO":>6} {str(rank or "-"):>5} {elapsed:>6.3f}s')

    top1 = sum(1 for r in rows if r['top1'])
    hits = sum(1 for r in rows if r['hit'])
    avg = sum(r['seconds'] for r in rows) / len(rows)

    print('-' * 72)
    print(f'Top-1 accuracy : {top1}/{len(rows)} ({top1 / len(rows) * 100:.0f}%)')
    print(f'Hit rate @5    : {hits}/{len(rows)} ({hits / len(rows) * 100:.0f}%)')
    print(f'Mean latency   : {avg * 1000:.0f} ms')
    return rows


# --------------------------------------------------------------------------
# Test 4 - the category-filter fallback
# --------------------------------------------------------------------------

def test_fallback():
    banner('TEST 4  Category filter fallback')

    print('A wrong category must degrade the answer, never block it.')
    print()

    checks = []

    # Deliberately wrong category for a labour question
    wrong = rag_service.retrieve(
        "My employer has not paid my salary for three months",
        category="Consumer", k=5)
    checks.append(('Wrong category still returns results',
                   len(wrong) > 0, f'{len(wrong)} passages'))

    # A category that does not exist at all
    nonsense = rag_service.retrieve("test query", category="NotACategory", k=5)
    checks.append(('Unknown category falls back',
                   len(nonsense) > 0, f'{len(nonsense)} passages'))

    # "General" is treated as no filter
    general = rag_service.retrieve("legal rights", category="General", k=5)
    checks.append(('General category searches everything',
                   len(general) > 0, f'{len(general)} passages'))

    # No category at all
    unfiltered = rag_service.retrieve("legal rights", k=5)
    checks.append(('No category works',
                   len(unfiltered) > 0, f'{len(unfiltered)} passages'))

    # Correct category should be at least as precise as no filter
    right = rag_service.retrieve(
        "My employer has not paid my salary for three months",
        category="Labour", k=5)
    checks.append(('Correct category returns results',
                   len(right) > 0, f'{len(right)} passages'))

    for name, ok, detail in checks:
        print(f'  [{"PASS" if ok else "FAIL"}] {name:42} {detail}')

    passed = sum(1 for _, ok, _ in checks if ok)
    print('-' * 72)
    print(f'{passed}/{len(checks)} passed')
    return checks


# --------------------------------------------------------------------------
# Test 5 - embedding and store integrity
# --------------------------------------------------------------------------

def test_embeddings():
    banner('TEST 5  Embedding pipeline and vector store')

    checks = []

    embeddings = rag_service._get_embeddings()
    vector = embeddings.embed_query("test legal question")

    checks.append(('Embedding produced', vector is not None, ''))
    checks.append(('Dimension is 384', len(vector) == 384, f'{len(vector)}'))

    # normalize_embeddings=True means the vector should be unit length
    magnitude = sum(v * v for v in vector) ** 0.5
    checks.append(('Vector is normalised', abs(magnitude - 1.0) < 0.01,
                   f'|v| = {magnitude:.4f}'))

    # The same text must always embed identically, or retrieval is not stable
    again = embeddings.embed_query("test legal question")
    identical = all(abs(a - b) < 1e-9 for a, b in zip(vector, again))
    checks.append(('Embedding is deterministic', identical, ''))

    # Semantically close texts should be closer than unrelated ones
    a = embeddings.embed_query("my employer did not pay my wages")
    b = embeddings.embed_query("the boss withheld my salary")
    c = embeddings.embed_query("landlord eviction notice property")
    sim_ab = sum(x * y for x, y in zip(a, b))
    sim_ac = sum(x * y for x, y in zip(a, c))
    checks.append(('Paraphrase scores above unrelated text',
                   sim_ab > sim_ac, f'{sim_ab:.3f} vs {sim_ac:.3f}'))

    store = rag_service._get_vectorstore()
    count = store._collection.count()
    checks.append(('Vector store populated', count > 0, f'{count} documents'))

    # Every retrieved passage must carry a citation - without it the whole
    # point of using RAG over fine-tuning is lost
    results = rag_service.retrieve("employment rights", k=5)
    all_cited = all(r.get('citation') for r in results)
    checks.append(('Every passage carries a citation', all_cited,
                   f'{len(results)} checked'))

    for name, ok, detail in checks:
        print(f'  [{"PASS" if ok else "FAIL"}] {name:44} {detail}')

    passed = sum(1 for _, ok, _ in checks if ok)
    print('-' * 72)
    print(f'{passed}/{len(checks)} passed')
    return checks


# --------------------------------------------------------------------------

def write_report(cat_rows, lang_rows, ret_rows, fallback, embed):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    cat_ok = sum(1 for r in cat_rows if r['ok'])
    lang_ok = sum(1 for r in lang_rows if r['ok'])
    top1 = sum(1 for r in ret_rows if r['top1'])
    hits = sum(1 for r in ret_rows if r['hit'])
    avg_ms = sum(r['seconds'] for r in ret_rows) / len(ret_rows) * 1000

    lines = [
        '# RAG Pipeline Test Report', '',
        f'Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}', '',
        f'Embedding model: `{settings.embedding_model}`  ',
        f'Vector store: ChromaDB at `{settings.chroma_persist_dir}`  ',
        f'Corpus: {rag_service._get_vectorstore()._collection.count()} documents',
        '',
        '## Summary', '',
        '| Metric | Result |',
        '|---|---|',
        f'| Category detection | {cat_ok}/{len(cat_rows)} ({cat_ok / len(cat_rows) * 100:.0f}%) |',
        f'| Language detection | {lang_ok}/{len(lang_rows)} ({lang_ok / len(lang_rows) * 100:.0f}%) |',
        f'| Retrieval top-1 | {top1}/{len(ret_rows)} ({top1 / len(ret_rows) * 100:.0f}%) |',
        f'| Retrieval hit@5 | {hits}/{len(ret_rows)} ({hits / len(ret_rows) * 100:.0f}%) |',
        f'| Mean retrieval latency | {avg_ms:.0f} ms |',
        f'| Fallback checks | {sum(1 for _, ok, _ in fallback if ok)}/{len(fallback)} |',
        f'| Embedding checks | {sum(1 for _, ok, _ in embed if ok)}/{len(embed)} |',
        '',
        '## Retrieval detail', '',
        '| Query | Category | Top-1 | Hit@5 | Rank | Top citation |',
        '|---|---|---|---|---|---|',
    ]

    for r in ret_rows:
        q = r['query'][:46] + ('…' if len(r['query']) > 46 else '')
        lines.append(f'| {q} | {r["category"]} | '
                     f'{"yes" if r["top1"] else "no"} | '
                     f'{"yes" if r["hit"] else "no"} | '
                     f'{r["rank"] or "-"} | {r["top_citation"] or "-"} |')

    lines += ['', '## Category detection detail', '',
              '| Query | Expected | Detected | Correct |', '|---|---|---|---|']
    for r in cat_rows:
        q = r['query'][:46] + ('…' if len(r['query']) > 46 else '')
        lines.append(f'| {q} | {r["expected"]} | {r["got"]} | '
                     f'{"yes" if r["ok"] else "**no**"} |')

    lines += ['', '## Fallback behaviour', '',
              'A wrong or unknown category must degrade the answer, never block it.',
              '']
    for name, ok, detail in fallback:
        lines.append(f'- [{"x" if ok else " "}] {name}' + (f' — {detail}' if detail else ''))

    lines += ['', '## Embedding pipeline', '']
    for name, ok, detail in embed:
        lines.append(f'- [{"x" if ok else " "}] {name}' + (f' — {detail}' if detail else ''))

    report = RESULTS_DIR / 'rag_test_report.md'
    report.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return report


def main():
    banner('Smart Court - RAG Pipeline Tests')
    print(f'Embedding model : {settings.embedding_model}')
    print(f'Vector store    : {settings.chroma_persist_dir}')
    print(f'Ollama model    : {settings.ollama_model}')

    start = time.time()
    print('\nLoading embedding model and vector store...')
    count = rag_service._get_vectorstore()._collection.count()
    print(f'Loaded in {time.time() - start:.1f}s - {count} documents in store')

    cat_rows = test_category_detection()
    lang_rows = test_language_detection()
    ret_rows = test_retrieval()
    fallback = test_fallback()
    embed = test_embeddings()

    report = write_report(cat_rows, lang_rows, ret_rows, fallback, embed)

    banner('Summary')
    cat_ok = sum(1 for r in cat_rows if r['ok'])
    lang_ok = sum(1 for r in lang_rows if r['ok'])
    top1 = sum(1 for r in ret_rows if r['top1'])
    hits = sum(1 for r in ret_rows if r['hit'])

    print(f'Category detection : {cat_ok}/{len(cat_rows)}')
    print(f'Language detection : {lang_ok}/{len(lang_rows)}')
    print(f'Retrieval top-1    : {top1}/{len(ret_rows)}')
    print(f'Retrieval hit@5    : {hits}/{len(ret_rows)}')
    print(f'Fallback           : {sum(1 for _, ok, _ in fallback if ok)}/{len(fallback)}')
    print(f'Embeddings         : {sum(1 for _, ok, _ in embed if ok)}/{len(embed)}')
    print(f'\nReport: {report}')


if __name__ == '__main__':
    main()
