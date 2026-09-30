# ⚖️ Smart Court — Pakistan's AI Legal Co-Pilot

> Free legal guidance for every Pakistani — in Urdu and English, powered by
> open-source AI running on your own machine.

Smart Court is a complete, production-grade web app that combines RAG, NLP, and
local LLMs to deliver a full legal toolkit for free:

| Feature | What it does |
|---|---|
| **Legal Q&A** | Type or speak a problem in Urdu/English → AI retrieves the relevant Pakistani statute from ChromaDB → a local LLM (Ollama) **streams** an explanation, citations, action plan, and a calibrated 0-100 case-strength score. |
| **Contract Scanner** | Drop any PDF agreement → AI highlights dangerous and one-sided clauses with explanations grounded in Pakistani law. |
| **Document Drafter** | Generate court-ready FIR applications, legal notices, affidavits, and complaint letters → export as **PDF or editable Word (.docx)**. |
| **AI Courtroom** | Rehearse your case against a strict AI Pakistani judge. AI delivers a written verdict with strengths, weaknesses and feedback. |
| **Inheritance (Wirasat)** | Enter the surviving family → a deterministic **faraid engine** computes every heir's exact share under Islamic law (handles Awl, Radd, ʿUmariyyatayn) with an animated donut chart and Qur'anic citations. |
| **Voice Input** | Speak in Urdu or English; Whisper transcribes locally and pipes it into the Q&A engine. |

Plus, across the whole app:

- **Accounts** — signup / login with bcrypt + JWT; each user's chats are saved
- **History** — every consultation is stored and re-openable
- **Light / Dark theme** + full **Urdu ⇄ English** (RTL) toggle
- **⌘K Command Palette** — jump to any page or action from the keyboard
- **Case-strength heuristic** — grounded in the actual facts you provide, so it never freezes at one value

**Cost: ₨0.** Everything is open-source, free, and runs locally — no cloud, no API keys.

---

## ✨ Tech stack

**Backend** · Python 3.11 · FastAPI · LangChain · ChromaDB · Sentence-Transformers (`all-MiniLM-L6-v2`) · Ollama (`llama3.2:3b`, swappable to `mistral:7b`) · faster-whisper · pdfplumber · ReportLab · python-docx · bcrypt · PyJWT · SQLite

**Frontend** · React 18 · Vite · TailwindCSS · Framer Motion · Lucide React · Axios · React Router · React Markdown · Geist + Instrument Serif fonts

---

## 🚀 Quick start

### Easiest (Windows): one double-click — even on a PC with nothing installed

**Double-click `START-SMART-COURT.bat`.** That's it.

It installs whatever is missing — Python 3.11, Node.js, Ollama, the
`llama3.2:3b` model, all Python and npm packages — then starts the app and opens
it in your browser. No admin rights or manual steps are needed (Windows may show
one "Yes/No" prompt for the Visual C++ runtime; click **Yes**).

- First run: 20–40 min and ~6 GB download. Keep the window open.
- Later runs: 1–2 min, everything already installed is skipped.
- If Windows says "Windows protected your PC", click **More info → Run anyway**.
- If anything fails (e.g. internet dropped), just double-click it again — it resumes.
  Details are written to `setup-log.txt`.
- To stop the app: double-click `stop.bat`.

Needs Windows 10/11 (64-bit), internet on first run, 8 GB RAM recommended.

### Manual

### 1. Install Ollama and pull the model

[Download Ollama](https://ollama.com) for your OS, then in a terminal:

```bash
ollama pull llama3.2:3b    # fast on CPU; or `ollama pull mistral:7b` for higher quality
ollama serve               # leave this running in its own terminal
```

Ollama exposes its API at `http://localhost:11434` by default. The model is set
in `backend/.env` via `OLLAMA_MODEL`.

### 2. Run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
copy .env.example .env          # (or cp on macOS/Linux)

uvicorn main:app --reload --port 8000
```

The first call will download the embedding model (~80 MB) and seed
ChromaDB with the built-in sample Pakistan law corpus. Subsequent boots
are instant.

Open <http://localhost:8000/api/docs> for the interactive API docs.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The Vite dev server proxies `/api` → `http://localhost:8000`, so no CORS
configuration is needed in development.

---

## 📚 Loading real Pakistani law PDFs

Drop PDFs into `backend/data/laws/` — e.g.:

```
backend/data/laws/
├── pakistan_penal_code.pdf
├── crpc_1898.pdf
├── constitution_of_pakistan.pdf
├── muslim_family_laws_ordinance_1961.pdf
├── industrial_relations_act_2012.pdf
└── west_pakistan_urban_rent_restriction_ordinance_1959.pdf
```

Then call:

```bash
curl -X POST http://localhost:8000/api/admin/ingest-pdfs
```

This parses every PDF, splits it into ~1000-token chunks, embeds them,
and stores them in ChromaDB. From then on, the Q&A pipeline retrieves
from your real corpus rather than the sample seeds.

Tip: PDFs from FBR, ECP and the Federation's "Pakistan Code" website
(`pakistancode.gov.pk`) are public and free to use.

---

## 🧠 How it works

```
┌────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Frontend   │ →  │  FastAPI router  │ →  │ LLM services    │
│ (React)    │    │  /api/chat etc.  │    │ legal_answer()  │
└────────────┘    └──────────────────┘    │ scan_contract() │
       ↑                  │                │ draft_document()│
       │                  ↓                │ judge_turn()    │
       │            ┌──────────────┐       └─────────────────┘
       │            │ rag_service  │              │
       │            │ (ChromaDB +  │              ↓
       │            │  HF embed.)  │      ┌──────────────────┐
       │            └──────────────┘      │ Ollama / Mistral │
       │                                  └──────────────────┘
       │                                          │
       └───────────── JSON answer ←───────────────┘
```

1. User asks a question (text or voice).
2. Backend detects language (`langdetect`) and category (keyword heuristic).
3. ChromaDB returns the top-k most relevant law passages (optionally filtered
   by category).
4. Mistral 7B is prompted with the user's question + retrieved passages and
   asked to respond in strict JSON: explanation, citations, action plan,
   case strength, warning.
5. The response is shown in the React chat UI with citations, an animated
   case-strength meter, and a side panel of source passages.

---

## 🛠 Architecture

```
smart-court/
├── backend/
│   ├── main.py                       FastAPI entrypoint
│   ├── config.py                     env-loaded settings
│   ├── db.py                         SQLite sessions + chat history
│   ├── routes/
│   │   ├── chat.py                   /api/chat
│   │   ├── documents.py              /api/documents
│   │   ├── scanner.py                /api/scanner
│   │   ├── courtroom.py              /api/courtroom
│   │   ├── voice.py                  /api/voice
│   │   └── admin.py                  /api/admin (ingest PDFs etc.)
│   ├── services/
│   │   ├── rag_service.py            ChromaDB retrieval + seeding
│   │   ├── llm_service.py            Mistral wrappers for every feature
│   │   ├── pdf_service.py            PDF parsing + PDF export
│   │   └── voice_service.py          Whisper transcription
│   ├── data/
│   │   ├── sample_laws.py            built-in Pakistani law seed corpus
│   │   └── laws/                     drop real PDFs here
│   ├── vectorstore/                  ChromaDB persistent storage (created on first run)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx                   layout + router
    │   ├── main.jsx
    │   ├── index.css                 design tokens, glass utility classes
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── LanguageToggle.jsx
    │   │   ├── ChatInterface.jsx     full chat with side-panel insights
    │   │   ├── CaseStrengthMeter.jsx animated SVG ring
    │   │   ├── ContractScanner.jsx   drag/drop + scanning animation
    │   │   ├── DocumentDrafter.jsx   form + live preview + PDF export
    │   │   ├── CourtroomMode.jsx     dramatic dark courtroom UI
    │   │   ├── VoiceInput.jsx        mic + upload, calls Whisper backend
    │   │   └── TypingDots.jsx
    │   ├── hooks/
    │   │   ├── useLanguage.jsx       Urdu/English context + i18n strings
    │   │   └── useToast.jsx          framer-motion toast notifications
    │   ├── lib/
    │   │   └── api.js                axios client + typed helpers
    │   └── pages/
    │       ├── Home.jsx
    │       ├── Chat.jsx
    │       ├── Scanner.jsx
    │       ├── Drafter.jsx
    │       └── Courtroom.jsx
    ├── tailwind.config.js            navy/gold palette, custom animations
    ├── postcss.config.js
    ├── vite.config.js                proxies /api → localhost:8000
    └── package.json
```

---

## 🔌 API quick reference

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/health`                              | health probe |
| `GET`  | `/api/docs`                            | Swagger UI |
| `POST` | `/api/auth/signup`                     | create account → JWT |
| `POST` | `/api/auth/login`                      | login → JWT |
| `GET`  | `/api/auth/me`                         | current user (Bearer token) |
| `POST` | `/api/chat`                            | legal Q&A |
| `POST` | `/api/chat/stream`                     | legal Q&A as Server-Sent Events (streaming) |
| `GET`  | `/api/chat/history/{session_id}`       | conversation history |
| `GET`  | `/api/chat/detect?text=...`            | language + category detection |
| `GET`  | `/api/sessions`                        | list signed-in user's conversations |
| `GET`  | `/api/sessions/{id}`                   | one conversation's messages |
| `DELETE`| `/api/sessions/{id}`                  | delete a conversation |
| `GET`  | `/api/documents/types`                 | supported draft types |
| `POST` | `/api/documents/draft`                 | generate a draft |
| `POST` | `/api/documents/pdf`                   | export `{title, body}` → PDF |
| `POST` | `/api/documents/docx`                  | export `{title, body}` → editable Word |
| `POST` | `/api/scanner/upload` (multipart)      | scan PDF contract |
| `POST` | `/api/scanner/text`                    | scan raw text |
| `POST` | `/api/courtroom/start`                 | open hearing |
| `POST` | `/api/courtroom/respond`               | one judge-turn |
| `POST` | `/api/courtroom/verdict`               | final verdict |
| `GET`  | `/api/courtroom/transcript/{sid}`      | full transcript |
| `POST` | `/api/inheritance/calculate`           | faraid share calculation |
| `POST` | `/api/voice/transcribe` (multipart)    | Whisper STT |
| `POST` | `/api/voice/ask` (multipart)           | STT → legal answer |
| `POST` | `/api/admin/ingest-pdfs`               | ingest PDFs from `data/laws/` |
| `POST` | `/api/admin/laws`                      | manually add law entries |

---

## ⚙️ Configuration

All knobs live in `backend/.env`:

```ini
HOST=0.0.0.0
PORT=8000

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

CHROMA_PERSIST_DIR=./vectorstore
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

SQLITE_PATH=./smartcourt.db
LAW_PDF_DIR=./data/laws

WHISPER_MODEL=base
```

Use a smaller Whisper model (`tiny`) for older CPUs, or a larger one
(`small`, `medium`) for better Urdu accuracy.

---

## 🌐 Language support

* **English** — default.
* **اردو (Urdu)** — language toggle in the header switches the entire UI,
  Urdu Naskh fonts, RTL layout for Urdu blocks, and tells the LLM to reply
  in Urdu.

Whisper auto-detects spoken language; you can also force it via the
language hint sent from the frontend.

---

## 🛡 Disclaimer

Smart Court provides *informational guidance* generated by an AI. It is not
legal advice and is no substitute for a licensed Pakistani advocate. Always
consult a qualified lawyer before initiating or defending litigation.

---

## 📦 Production tips

* Pin Mistral with `ollama pull mistral:7b-instruct-v0.3-q4_K_M` for the
  best quality/RAM trade-off on a 16 GB laptop.
* Run `uvicorn main:app --workers 2` behind a reverse proxy for shared
  deployments; ChromaDB and SQLite both handle concurrent reads fine.
* For frontend production build:
  ```bash
  cd frontend && npm run build
  ```
  Then serve `frontend/dist/` from any static host and set
  `VITE_API_URL` to your backend URL.

---

## 👨‍💻 Author

**Developed by [Muhammad Nouman](https://github.com/MuhammadNouman011)**

Designed and built end-to-end — backend (FastAPI + RAG pipeline), frontend (React), and AI integration (Ollama + ChromaDB + Sentence-Transformers).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
Free to use, modify, and distribute.

---

**Built for every Pakistani who deserves to understand their rights.**
