# Setup

This is a source copy. `backend/.venv` and `frontend/node_modules` are not
included — they are dependencies, rebuilt from `requirements.txt` and
`package.json`. That is why this folder is 2.8 MB rather than 1.7 GB.

The ChromaDB vector store **is** included and already populated with 24 laws,
so retrieval works immediately without re-embedding.

## 1. Ollama

```bash
# Install from https://ollama.com, then:
ollama pull llama3.2:3b       # or mistral:7b on 16GB RAM (then set OLLAMA_MODEL in backend/.env)
ollama serve
```

Verify: `curl http://localhost:11434/api/tags`

## 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate           # Windows
source .venv/bin/activate        # macOS / Linux

pip install -r requirements.txt
cp .env.example .env             # edit if your model differs

python main.py
```

Backend runs on <http://localhost:8000>, API docs at
<http://localhost:8000/api/docs>.

First start downloads the embedding model (~80 MB) once.

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on <http://localhost:5173>.

## 4. Windows one-click

Double-click `START-SMART-COURT.bat` in the project root. It installs anything
missing (Python, Node.js, Ollama, the model, all packages), does all of the
above and opens the browser. `stop.bat` shuts it down.

## Tests

```bash
cd backend
python tests/test_rag.py     # retrieval, classification, embeddings
python tests/test_api.py     # FastAPI endpoints
```

Neither needs Ollama running — they test retrieval and the API surface, not
generation.

Last run: category detection 15/15, language detection 15/15, retrieval hit@5
15/15, top-1 12/15, fallback 5/5, embeddings 7/7, API 30/30.
