"""Centralized configuration loaded from env."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Settings:
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "mistral:7b")

    chroma_persist_dir: str = os.getenv(
        "CHROMA_PERSIST_DIR", str(BASE_DIR / "vectorstore")
    )
    embedding_model: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )

    sqlite_path: str = os.getenv("SQLITE_PATH", str(BASE_DIR / "smartcourt.db"))
    law_pdf_dir: str = os.getenv("LAW_PDF_DIR", str(BASE_DIR / "data" / "laws"))

    whisper_model: str = os.getenv("WHISPER_MODEL", "base")


settings = Settings()
