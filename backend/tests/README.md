# Smart Court — Test Suite

```bash
python tests/test_rag.py     # retrieval, classification, embeddings
python tests/test_api.py     # FastAPI endpoints
python tests/test_e2e.py     # full flow, needs Ollama running
```

Reports are written to `tests/results/`.

The three suites are separate because their cost differs by two orders of
magnitude. `test_rag.py` and `test_api.py` finish in seconds and need neither
Ollama nor a running server, so they can run on every change. `test_e2e.py`
performs real generation — a single query takes around 90 seconds on CPU — so
it runs before a milestone, not on every edit. Folded into one suite, the fast
checks would inherit the slow one's cost and stop being run.

## test_rag.py

Runs 15 sample legal queries — 13 English, 2 Urdu — across all five law
categories, each with the statute it should retrieve.

Retrieval is scored two ways because they answer different questions:

- **Hit rate @5** — was the correct statute retrieved at all? This determines
  whether a correct answer is *possible*.
- **Top-1 accuracy** — was it ranked first? This matters more here, because the
  prompt passes only the top passage to the model.

Also checks embedding dimension and normalisation, that embeddings are
deterministic, that a paraphrase scores above unrelated text, and that every
retrieved passage carries a citation — without which RAG loses its advantage
over fine-tuning.

## test_api.py

Uses FastAPI's `TestClient`, so no server needs to be running. Covers the
OpenAPI schema, public endpoints, the deterministic inheritance calculator,
request validation, and the full auth flow including rejection paths.

LLM-backed endpoints are checked for reachability and validation rather than
answer quality — generation is slow on CPU, and answer quality is measured in
`test_rag.py` instead.

## test_e2e.py

Exercises the whole path: HTTP request, category and language detection,
ChromaDB retrieval, Ollama generation, structured response — plus the
Server-Sent-Events stream the React frontend consumes.

Two checks matter most:

**Grounding.** It retrieves for a query, notes the top passage's citation, then
sends the same query through `/api/chat` and asserts that statute appears in the
answer's citations or sources. This is the automated proof that RAG is doing its
job — that the model is answering from retrieved law rather than from memory.

**The SSE contract.** The backend sends each chunk's payload under `data`, and
`frontend/src/lib/api.js` reads `evt.data`. If either side renamed that field,
both would still pass their own tests while the interface silently rendered
nothing. This test pins the contract across the boundary.

Skips generation gracefully when Ollama is unreachable, running the retrieval
and contract checks anyway.

**Last run:** 34/34 — full answer in 89s with all nine response fields, 264 SSE
events (261 chunks, 1268 characters), grounding confirmed.

## Two bugs these tests found

**1. The retrieval fallback never fired.** `retrieve()` caught an exception to
fall back to unfiltered search, but ChromaDB does not raise for a category that
matches nothing — it returns an empty list. A mis-detected category therefore
returned zero passages instead of degrading gracefully. Fixed by treating an
empty result the same as a failure.

**2. Category detection missed inflected words.** The keyword list held
`"harassment"`, so "I was **harassed** by my colleague" fell through to
`General`. Matching is substring-based, so the fix was to store stems
(`"harass"`) rather than full words.


## Two mistakes in the tests themselves

Worth recording, because the fix was in the test both times, not the code.

**Reading the wrong field.** The streaming test summed `event['text']`, but the
backend sends `data`. 261 chunk events arrived and the assembled text was empty.
The frontend reads `evt.data` too, so the code was correct on both sides — only
the test was wrong. Changing the backend to match the test would have broken the
interface.

**Asserting something unmeasurable.** A check required the first chunk to arrive
before 80% of total elapsed time. It always failed, because FastAPI's
`TestClient` buffers the response rather than delivering frames as they arrive,
so first-chunk latency cannot be measured there at all. Streaming works
correctly in a real browser. The assertion was replaced with an informational
print and a comment explaining why — a test that cannot pass in its own
environment teaches people to ignore failures.
