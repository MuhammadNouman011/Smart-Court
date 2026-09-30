"""
FastAPI Endpoint Tests

Exercises the API surface with FastAPI's TestClient, which runs the app
in-process without needing a server.

Endpoints that call the LLM are checked for reachability and correct request
validation rather than answer quality - generation is slow on CPU and its
quality is measured separately in `test_rag.py`.

Run:  python tests/test_api.py
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from main import app


RESULTS_DIR = Path(__file__).resolve().parent / 'results'
client = TestClient(app)

results = []


def check(name, condition, detail=''):
    results.append({'name': name, 'ok': bool(condition), 'detail': str(detail)})
    print(f'  [{"PASS" if condition else "FAIL"}] {name:46} {detail}')
    return condition


def banner(title):
    print()
    print('=' * 72)
    print(f'  {title}')
    print('=' * 72)


# --------------------------------------------------------------------------

def test_app_boots():
    banner('App and documentation')

    r = client.get('/api/docs')
    check('OpenAPI docs served', r.status_code == 200, r.status_code)

    r = client.get('/api/openapi.json')
    ok = r.status_code == 200
    check('OpenAPI schema served', ok, r.status_code)

    if ok:
        schema = r.json()
        paths = schema.get('paths', {})
        check('Schema lists endpoints', len(paths) > 0, f'{len(paths)} paths')
        return paths
    return {}


def test_public_endpoints():
    banner('Public endpoints')

    r = client.get('/api/chat/detect', params={'text': 'my employer did not pay me'})
    if check('GET /chat/detect', r.status_code == 200, r.status_code):
        body = r.json()
        check('  detects category', body.get('category') == 'Labour',
              body.get('category'))
        check('  detects language', body.get('language') == 'en',
              body.get('language'))

    r = client.get('/api/chat/detect', params={'text': 'مالک مکان بے دخل کر رہا ہے'})
    if r.status_code == 200:
        body = r.json()
        check('  detects Urdu', body.get('language') == 'ur', body.get('language'))

    r = client.get('/api/documents/types')
    if check('GET /documents/types', r.status_code == 200, r.status_code):
        types = r.json()
        check('  returns document types', len(types) > 0, f'{len(types)} types')


def test_inheritance():
    """The faraid engine is deterministic, so it can be checked exactly."""
    banner('Inheritance calculator (deterministic)')

    # Wife plus one son: the wife takes 1/8, the son takes the residue
    payload = {'spouse': 'wife', 'wives': 1, 'sons': 1, 'estate_value': 800000}
    r = client.post('/api/inheritance/calculate', json=payload)

    if check('POST /inheritance/calculate', r.status_code == 200, r.status_code):
        body = r.json()
        shares = body.get('shares') or body.get('heirs') or body.get('distribution') or []
        check('  returns shares', len(shares) > 0, f'{len(shares)} entries')

        # Whatever the field is named, the parts must sum to the estate
        total = 0
        for s in shares:
            if isinstance(s, dict):
                for key in ('amount', 'share_amount', 'value'):
                    if key in s:
                        total += s[key] or 0
                        break
        if total:
            check('  shares sum to the estate', abs(total - 800000) < 1,
                  f'{total:,.0f} of 800,000')

        # The wife's Qur'anic share with a child present is exactly 1/8
        wife = next((s for s in shares
                     if isinstance(s, dict)
                     and 'wife' in str(s.get('heir', s.get('name', ''))).lower()), None)
        if wife:
            amount = wife.get('amount') or wife.get('share_amount') or wife.get('value')
            if amount:
                check('  wife receives 1/8 (child present)',
                      abs(amount - 100000) < 1, f'{amount:,.0f} of 100,000')

    # Same input twice must give the same answer
    r2 = client.post('/api/inheritance/calculate', json=payload)
    check('  deterministic across calls',
          r.status_code == r2.status_code and r.text == r2.text)

    # Out-of-range values are rejected by the schema
    r3 = client.post('/api/inheritance/calculate',
                     json={'spouse': 'wife', 'wives': 99})
    check('  more than 4 wives rejected', r3.status_code == 422, r3.status_code)

    r4 = client.post('/api/inheritance/calculate', json={'spouse': 'nonsense'})
    check('  invalid spouse rejected', r4.status_code in (400, 422), r4.status_code)


def test_validation():
    banner('Request validation')

    r = client.post('/api/chat', json={})
    check('Empty chat body rejected', r.status_code in (400, 422), r.status_code)

    r = client.post('/api/inheritance/calculate',
                    json={'estate_value': 'not a number'})
    check('Non-numeric estate rejected', r.status_code == 422, r.status_code)

    r = client.post('/api/auth/signup', json={'full_name': 'Test User',
                                              'email': 'not-an-email',
                                              'password': 'ValidPass123'})
    check('Invalid email rejected', r.status_code == 422, r.status_code)

    r = client.post('/api/auth/signup', json={'full_name': 'Test User',
                                              'email': 'a@b.com',
                                              'password': 'x'})
    check('Short password rejected', r.status_code == 422, r.status_code)

    r = client.post('/api/auth/signup', json={'full_name': 'Test123!!',
                                              'email': 'c@d.com',
                                              'password': 'ValidPass123'})
    check('Name with digits rejected', r.status_code == 400, r.status_code)

    r = client.get('/api/does-not-exist')
    check('Unknown route returns 404', r.status_code == 404, r.status_code)

    r = client.post('/api/scanner/text', json={})
    check('Scanner without text rejected', r.status_code in (400, 422),
          r.status_code)


def test_auth_flow():
    banner('Authentication flow')

    email = f'test_{int(time.time())}@example.com'
    password = 'TestPassword123'

    r = client.post('/api/auth/signup', json={'full_name': 'Test User',
                                              'email': email,
                                              'password': password})
    signed_up = check('POST /auth/signup', r.status_code in (200, 201),
                      r.status_code)

    token = None
    if signed_up:
        token = r.json().get('access_token') or r.json().get('token')
        check('  signup returns a token', token is not None)

    r = client.post('/api/auth/login', json={'email': email, 'password': password})
    if check('POST /auth/login', r.status_code == 200, r.status_code):
        token = r.json().get('access_token') or r.json().get('token') or token

    r = client.post('/api/auth/login', json={'email': email,
                                             'password': 'WrongPassword'})
    check('  wrong password rejected', r.status_code in (400, 401, 403),
          r.status_code)

    r = client.post('/api/auth/signup', json={'full_name': 'Test User',
                                              'email': email,
                                              'password': password})
    check('  duplicate email rejected', r.status_code == 409, r.status_code)

    if token:
        r = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        check('GET /auth/me with token', r.status_code == 200, r.status_code)

    r = client.get('/api/auth/me')
    check('  /auth/me without token rejected', r.status_code in (401, 403, 422),
          r.status_code)

    r = client.get('/api/auth/me', headers={'Authorization': 'Bearer not.a.real.token'})
    check('  invalid token rejected', r.status_code in (401, 403, 422),
          r.status_code)


def test_endpoint_coverage(paths):
    banner('Endpoint inventory')

    by_prefix = {}
    for path in paths:
        prefix = path.split('/')[2] if path.count('/') >= 2 else path
        by_prefix.setdefault(prefix, []).append(path)

    for prefix in sorted(by_prefix):
        print(f'  /{prefix:14} {len(by_prefix[prefix])} endpoint(s)')

    total = len(paths)
    check('All route groups registered', len(by_prefix) >= 8,
          f'{len(by_prefix)} groups, {total} endpoints')


def write_report():
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    passed = sum(1 for r in results if r['ok'])

    lines = ['# API Endpoint Test Report', '',
             f'Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}', '',
             f'**{passed}/{len(results)} checks passed**', '',
             '| Check | Result | Detail |', '|---|---|---|']
    for r in results:
        lines.append(f'| {r["name"]} | {"pass" if r["ok"] else "**fail**"} '
                     f'| {r["detail"]} |')

    report = RESULTS_DIR / 'api_test_report.md'
    report.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return report


def main():
    banner('Smart Court - API Endpoint Tests')

    paths = test_app_boots()
    test_public_endpoints()
    test_inheritance()
    test_validation()
    test_auth_flow()
    test_endpoint_coverage(paths)

    report = write_report()
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
