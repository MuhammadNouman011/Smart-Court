# API Endpoint Test Report

Generated: 2026-08-26 10:30:18

**30/30 checks passed**

| Check | Result | Detail |
|---|---|---|
| OpenAPI docs served | pass | 200 |
| OpenAPI schema served | pass | 200 |
| Schema lists endpoints | pass | 26 paths |
| GET /chat/detect | pass | 200 |
|   detects category | pass | Labour |
|   detects language | pass | en |
|   detects Urdu | pass | ur |
| GET /documents/types | pass | 200 |
|   returns document types | pass | 4 types |
| POST /inheritance/calculate | pass | 200 |
|   returns shares | pass | 2 entries |
|   deterministic across calls | pass |  |
|   more than 4 wives rejected | pass | 422 |
|   invalid spouse rejected | pass | 400 |
| Empty chat body rejected | pass | 422 |
| Non-numeric estate rejected | pass | 422 |
| Invalid email rejected | pass | 422 |
| Short password rejected | pass | 422 |
| Name with digits rejected | pass | 400 |
| Unknown route returns 404 | pass | 404 |
| Scanner without text rejected | pass | 400 |
| POST /auth/signup | pass | 200 |
|   signup returns a token | pass |  |
| POST /auth/login | pass | 200 |
|   wrong password rejected | pass | 401 |
|   duplicate email rejected | pass | 409 |
| GET /auth/me with token | pass | 200 |
|   /auth/me without token rejected | pass | 401 |
|   invalid token rejected | pass | 401 |
| All route groups registered | pass | 11 groups, 26 endpoints |
