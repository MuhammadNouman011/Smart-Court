"""Upload a PDF contract → AI returns red-flag clauses."""
from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from services.llm_service import scan_contract
from services.pdf_service import extract_text_from_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scanner", tags=["scanner"])


@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    language: str = Form("en"),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB).")

    try:
        text = extract_text_from_pdf(raw)
    except Exception as exc:
        logger.exception("PDF parse failed")
        raise HTTPException(status_code=422, detail=f"Could not parse PDF: {exc}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in the PDF.")

    try:
        analysis = await scan_contract(text, language=language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("scan_contract failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")

    return {
        "filename": file.filename,
        "char_count": len(text),
        "preview": text[:1200],
        "analysis": analysis,
    }


@router.post("/text")
async def scan_text(payload: dict):
    text = (payload or {}).get("text", "")
    language = (payload or {}).get("language", "en")
    if not text or len(text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Please provide at least 20 characters.")
    try:
        analysis = await scan_contract(text, language=language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"analysis": analysis, "char_count": len(text)}
