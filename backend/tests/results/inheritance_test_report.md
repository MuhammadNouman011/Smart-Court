# Inheritance Calculator Test Report

Generated: 2026-08-26 21:58:03

**31/31 checks passed**

Every case has a known correct answer under classical Islamic
inheritance law, so the engine can be checked exactly rather than
judged by inspection.

| Check | Result | Detail |
|---|---|---|
| Husband = 1/4 | pass | got 1/4 |
| Daughter = 3/4 | pass | got 3/4 |
| shares total exactly 1 | pass | 1 |
| Wife = 1/8 | pass | got 1/8 |
| Son = 7/8 | pass | got 7/8 |
| shares total exactly 1 | pass | 1 |
| Son = 4/5 | pass | got 4/5 |
| Daughter = 1/5 | pass | got 1/5 |
| shares total exactly 1 | pass | 1 |
| Husband = 1/2 | pass | got 1/2 |
| Mother = 1/6 | pass | got 1/6 |
| Father = 1/3 | pass | got 1/3 |
| shares total exactly 1 | pass | 1 |
| Wife = 1/4 | pass | got 1/4 |
| Mother = 1/4 | pass | got 1/4 |
| Father = 1/2 | pass | got 1/2 |
| shares total exactly 1 | pass | 1 |
| Husband = 3/7 | pass | got 3/7 |
| Full sister = 4/7 | pass | got 4/7 |
| shares total exactly 1 | pass | 1 |
| husband reduced from 1/2 to 3/7 | pass | 3/7 < 1/2 |
| total is exactly 1 after radd | pass | 1 |
| son excludes full brothers | pass | ['Son'] |
| son excludes full sisters | pass | ['Son'] |
| son takes the whole estate | pass | 1 |
| father excludes full brothers | pass | ['Father'] |
| every heir has an amount | pass | 2 of 2 |
| amounts sum to the estate | pass | 800,000 of 800,000 |
| wife receives 1/8 of the estate | pass | 100,000 of 100,000 |
| same input gives the same answer | pass |  |
| every share states its basis | pass | 5 heirs |
