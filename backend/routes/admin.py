"""Admin endpoints: ingest PDFs, push law text, inspect store."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.rag_service import add_law_documents, ingest_pdf_directory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


class LawEntry(BaseModel):
    text: str = Field(..., min_length=20)
    title: str | None = None
    citation: str | None = None
    category: str | None = None
    language: str = "en"


@router.post("/ingest-pdfs")
async def ingest_pdfs():
    try:
        n = ingest_pdf_directory()
    except Exception as exc:
        logger.exception("ingest failed")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"chunks_added": n}


@router.post("/laws")
async def add_laws(entries: list[LawEntry]):
    payload = [e.model_dump() for e in entries]
    try:
        n = add_law_documents(payload)
    except Exception as exc:
        logger.exception("add_laws failed")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"added": n}
