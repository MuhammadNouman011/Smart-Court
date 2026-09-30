"""Smart Court — FastAPI entrypoint."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import asyncio
import httpx

from config import settings
from db import init_db
from routes import admin, auth, chat, courtroom, documents, inheritance, scanner, sessions, voice

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("smartcourt")

app = FastAPI(
    title="Smart Court",
    description=(
        "Pakistan's sovereign AI legal co-pilot. Free, local, bilingual (Urdu/English). "
        "Features: RAG legal Q&A (streaming), contract scanner, document drafter (PDF + Word), "
        "AI courtroom, Islamic inheritance (faraid) calculator, voice input (Whisper), "
        "user accounts (JWT), and saved conversation history."
    ),
    version="1.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    log.info("Initialising SQLite at %s", settings.sqlite_path)
    init_db()
    log.info("Smart Court ready — Ollama @ %s, model=%s", settings.ollama_base_url, settings.ollama_model)
    # Warm the LLM and the RAG store in the background so the first user query is fast.
    asyncio.create_task(_warmup())


async def _warmup() -> None:
    """Preload the embedding model, ChromaDB, and the Ollama model into memory."""
    try:
        # 1. Touch the vector store (loads embeddings + seeds Chroma on first call)
        from services.rag_service import retrieve
        retrieve("hello", k=1)
        log.info("Warmup: RAG store loaded.")
    except Exception as exc:
        log.warning("RAG warmup failed: %s", exc)

    try:
        # 2. Send a trivial prompt to Ollama so the model loads into RAM (keep_alive default 5m).
        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=5.0)) as client:
            await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": "ok",
                    "stream": False,
                    "options": {"num_predict": 1, "num_ctx": 2048},
                    "keep_alive": "30m",
                },
            )
        log.info("Warmup: Ollama model loaded into memory.")
    except Exception as exc:
        log.warning("Ollama warmup failed: %s", exc)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "Smart Court",
        "version": app.version,
        "ollama_url": settings.ollama_base_url,
        "ollama_model": settings.ollama_model,
    }


@app.get("/")
async def root():
    return {
        "service": "Smart Court",
        "tagline": "Pakistan's AI Legal Co-Pilot",
        "docs": "/api/docs",
        "health": "/health",
    }


app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(scanner.router)
app.include_router(courtroom.router)
app.include_router(voice.router)
app.include_router(inheritance.router)
app.include_router(admin.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
