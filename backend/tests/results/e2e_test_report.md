# End-to-End Test Report

Generated: 2026-08-26 10:25:19

Ollama model: `llama3.2:3b`  
Embedding model: `sentence-transformers/all-MiniLM-L6-v2`

**34/34 checks passed**

| Check | Result | Detail |
|---|---|---|
| detect: My employer has not paid my salary.. | pass | Labour/en |
| detect: My landlord is evicting me without.. | pass | Tenant/en |
| detect: میرے آجر نے تنخواہ نہیں دی | pass | Labour/ur |
| GET /documents/types | pass | 200 |
|   document type has id and label | pass | ['id', 'label'] |
| POST /inheritance/calculate | pass | 200 |
|   returns shares for the donut chart | pass | 2 entries |
| GET /chat/detect | pass | 200 |
|   returns category and language | pass | ['language', 'category'] |
| POST /api/chat returns 200 | pass | 200 in 48.5s |
|   response is JSON object | pass | 9 keys |
|   has session_id | pass | e80058b5c32b46348396169a74749b83 |
|   has category | pass | Labour |
|   has language | pass | en |
|   has answer | pass | The employee has grounds for filing a grieva |
|   has citations | pass | ['Industrial Relations Act 2012', 'Industria |
|   has action_plan | pass | ['File a grievance petition with the Labour  |
|   has case_strength | pass | 53 |
|   has warning | pass | Please consult with a lawyer before taking a |
|   has sources | pass | [{'text': 'A workman whose services have bee |
|   case_strength within 0-100 | pass | 53 |
|   citations is a non-empty list | pass | 2 citations |
|   action_plan has steps | pass | 3 steps |
|   answered within 180s | pass | 48.5s |
| stream returns 200 | pass | 200 |
|   content-type is event-stream | pass | text/event-stream; charset=utf-8 |
|   frames parsed | pass | 264 events |
|   emits chunk events | pass | 261 chunks |
|   emits a final event | pass | final |
|   streamed text is non-empty | pass | 1268 chars |
|   chunk payload is under "data" | pass | matches frontend evt.data |
| retrieval returns passages | pass | 5 |
|   top passage has citation | pass | Code of Criminal Procedure 1898, Section 154 |
|   answer references the retrieved law | pass | looked for "code of criminal procedure 1898" |
