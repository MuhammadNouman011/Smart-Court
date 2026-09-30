"""
Inheritance Calculator Tests

The faraid engine is the one part of the system that produces an answer without
the language model, so unlike generation it can be checked exactly. Every case
below has a known correct answer under classical Islamic inheritance law, taken
from the standard worked examples.

Three doctrines are covered specifically:

- **'Awl** - the fixed shares add up to more than the estate, so every share is
  reduced proportionally by raising the common denominator.
- **Radd** - the fixed shares add up to less than the estate and there is no
  residuary heir, so the surplus returns to the sharers in proportion.
- **'Umariyyatayn** - the two cases (spouse, mother, father) where the mother
  takes one third of the *residue* rather than one third of the estate.

Run:  python tests/test_inheritance.py
"""

import sys
import time
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.inheritance_service import calculate


RESULTS_DIR = Path(__file__).resolve().parent / 'results'
results = []


def check(name, condition, detail=''):
    results.append({'name': name, 'ok': bool(condition), 'detail': str(detail)})
    print(f'  [{"PASS" if condition else "FAIL"}] {name:52} {detail}')
    return condition


def banner(title):
    print()
    print('=' * 78)
    print(f'  {title}')
    print('=' * 78)


def shares(result):
    """Map heir name to its group fraction, as a Fraction."""
    out = {}
    for h in result['heirs']:
        out[h['heir']] = Fraction(h['group_fraction'])
    return out


def total(result):
    """Sum of all group fractions. Should be exactly 1 in a sound answer."""
    return sum(Fraction(h['group_fraction']) for h in result['heirs'])


def case(label, expected, **kwargs):
    """Run one case and check every expected share plus the total."""
    print(f'\n  {label}')
    result = calculate(**kwargs)
    actual = shares(result)

    for heir, want in expected.items():
        got = actual.get(heir)
        check(f'    {heir} = {want}', got == want,
              f'got {got if got is not None else "absent"}')

    for heir in actual:
        if heir not in expected:
            check(f'    unexpected heir: {heir}', False, actual[heir])

    check('    shares total exactly 1', total(result) == 1, str(total(result)))
    return result


# --------------------------------------------------------------------------

def test_basic_cases():
    banner("TEST 1  Basic Qur'anic shares")

    # Husband takes 1/4 with a child present (4:12) and a single daughter takes
    # 1/2 (4:11), leaving 1/4 unassigned with no residuary heir. That surplus
    # returns to the daughter by radd, so she ends on 3/4 rather than 1/2.
    case('Husband and one daughter (radd to the daughter)',
         {'Husband': Fraction(1, 4),
          'Daughter': Fraction(3, 4)},
         spouse='husband', daughters=1)

    # Wife takes 1/8 with a child present (4:12); son takes the residue (4:11).
    case('Wife and one son',
         {'Wife': Fraction(1, 8), 'Son': Fraction(7, 8)},
         spouse='wife', wives=1, sons=1)

    # Son takes twice a daughter's share (4:11). Two sons and one daughter
    # split the whole estate 2:2:1.
    case('Two sons and one daughter, no spouse',
         {'Son': Fraction(4, 5), 'Daughter': Fraction(1, 5)},
         sons=2, daughters=1)


def test_umariyyatayn():
    banner("TEST 2  'Umariyyatayn (the two Umar cases)")

    print('\n  In these two cases the mother takes one third of the residue')
    print('  after the spouse, not one third of the whole estate.')

    # Husband 1/2, then mother takes 1/3 of the remaining 1/2 = 1/6,
    # father takes what is left = 1/3.
    case('Husband, mother, father',
         {'Husband': Fraction(1, 2),
          'Mother': Fraction(1, 6),
          'Father': Fraction(1, 3)},
         spouse='husband', father=True, mother=True)

    # Wife 1/4, mother takes 1/3 of the remaining 3/4 = 1/4,
    # father takes the rest = 1/2.
    case('Wife, mother, father',
         {'Wife': Fraction(1, 4),
          'Mother': Fraction(1, 4),
          'Father': Fraction(1, 2)},
         spouse='wife', wives=1, father=True, mother=True)


def test_awl():
    banner("TEST 3  'Awl (shares exceed the estate)")

    print('\n  When the fixed shares sum to more than one, the denominator is')
    print('  raised so that every heir is reduced in proportion.')

    # Husband 1/2 + two full sisters 2/3 = 7/6. Denominator raised from 6 to 7,
    # so the husband takes 3/7 and the sisters 4/7.
    result = case('Husband and two full sisters',
                  {'Husband': Fraction(3, 7),
                   'Full sister': Fraction(4, 7)},
                  spouse='husband', full_sisters=2)

    check('    husband reduced from 1/2 to 3/7',
          shares(result)['Husband'] < Fraction(1, 2),
          f"{shares(result)['Husband']} < 1/2")


def test_radd():
    banner('TEST 4  Radd (shares fall short of the estate)')

    print('\n  When the fixed shares sum to less than one and there is no')
    print('  residuary heir, the surplus returns to the sharers.')

    # Mother 1/6 + one daughter 1/2 = 2/3. The remaining 1/3 is returned
    # to both in proportion, so the reported shares must still total 1.
    result = calculate(mother=True, daughters=1)
    check('total is exactly 1 after radd', total(result) == 1, str(total(result)))

    names = [h['heir'] for h in result['heirs']]
    print(f'    heirs returned: {", ".join(names)}')


def test_exclusion():
    banner('TEST 5  Exclusion rules')

    # A male descendant excludes siblings entirely.
    result = calculate(sons=1, full_brothers=2, full_sisters=2)
    heirs = [h['heir'] for h in result['heirs']]
    check('son excludes full brothers', 'Full brother' not in heirs, str(heirs))
    check('son excludes full sisters', 'Full sister' not in heirs, str(heirs))
    check('son takes the whole estate',
          shares(result).get('Son') == Fraction(1, 1),
          str(shares(result).get('Son')))

    # The father also excludes siblings.
    result = calculate(father=True, full_brothers=1)
    heirs = [h['heir'] for h in result['heirs']]
    check('father excludes full brothers', 'Full brother' not in heirs, str(heirs))


def test_amounts_and_determinism():
    banner('TEST 6  Money amounts and determinism')

    estate = 800000
    result = calculate(spouse='wife', wives=1, sons=1, estate_value=estate)

    amounts = [h['group_amount'] for h in result['heirs']
               if h['group_amount'] is not None]
    check('every heir has an amount', len(amounts) == len(result['heirs']),
          f'{len(amounts)} of {len(result["heirs"])}')
    check('amounts sum to the estate', abs(sum(amounts) - estate) < 1,
          f'{sum(amounts):,.0f} of {estate:,}')

    wife = next(h for h in result['heirs'] if h['heir'] == 'Wife')
    check('wife receives 1/8 of the estate',
          abs(wife['group_amount'] - estate / 8) < 1,
          f"{wife['group_amount']:,.0f} of {estate / 8:,.0f}")

    # A rule engine must return the same answer every time it is asked.
    again = calculate(spouse='wife', wives=1, sons=1, estate_value=estate)
    check('same input gives the same answer', result == again)


def test_citations():
    banner('TEST 7  Qur\'anic basis')

    result = calculate(spouse='wife', wives=1, sons=2, daughters=1,
                       father=True, mother=True)

    missing = [h['heir'] for h in result['heirs'] if not h.get('basis')]
    check('every share states its basis', not missing,
          f'{len(result["heirs"])} heirs' if not missing else f'missing: {missing}')

    for h in result['heirs']:
        print(f"    {h['heir']:14} {h['group_fraction']:>6}   {h['basis'][:52]}")


def write_report():
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    passed = sum(1 for r in results if r['ok'])

    lines = ['# Inheritance Calculator Test Report', '',
             f'Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}', '',
             f'**{passed}/{len(results)} checks passed**', '',
             'Every case has a known correct answer under classical Islamic',
             'inheritance law, so the engine can be checked exactly rather than',
             'judged by inspection.', '',
             '| Check | Result | Detail |', '|---|---|---|']
    for r in results:
        name = r['name'].strip()
        lines.append(f'| {name} | {"pass" if r["ok"] else "**fail**"} '
                     f'| {r["detail"]} |')

    report = RESULTS_DIR / 'inheritance_test_report.md'
    report.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return report


def main():
    banner('Smart Court - Inheritance Calculator Tests')

    test_basic_cases()
    test_umariyyatayn()
    test_awl()
    test_radd()
    test_exclusion()
    test_amounts_and_determinism()
    test_citations()

    report = write_report()
    passed = sum(1 for r in results if r['ok'])

    banner('Summary')
    print(f'{passed}/{len(results)} checks passed')
    failed = [r for r in results if not r['ok']]
    if failed:
        print('\nFailed:')
        for r in failed:
            print(f'  - {r["name"].strip()}  ({r["detail"]})')
    print(f'\nReport: {report}')


if __name__ == '__main__':
    main()
