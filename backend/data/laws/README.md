# Drop Pakistani law PDFs here

Place any PDF copies of Pakistani statutes, ordinances, or constitutional
texts (e.g. PPC, CrPC, MFLA 1961, Constitution, Labour Code, Rent Acts,
Consumer Protection Acts) into **this folder**.

Then call the admin endpoint:

```
POST /api/admin/ingest-pdfs
```

The server will parse, chunk, embed and store every PDF into ChromaDB so the
Legal Q&A pipeline can retrieve relevant sections.

Until you add real PDFs the app boots with a small built-in seed corpus
(see `backend/data/sample_laws.py`) so the demo works immediately.
