"""Voice → text via Whisper, optionally piped into the legal Q&A engine."""
from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from db import add_message, ensure_session
from services.llm_service import legal_answer
from services.voice_service import transcribe

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/transcribe")
async def voice_transcribe(
    file: UploadFile = File(...),
    language: str | None = Form(None),
):
    audio = await file.read()
    if not audio:
        raise HTTPException(status_code=400, detail="Empty audio upload.")
    if len(audio) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio too large (max 25MB).")
    try:
        result = transcribe(audio, filename=file.filename or "audio.wav", language_hint=language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("transcribe failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")
    return result


@router.post("/ask")
async def voice_ask(
    file: UploadFile = File(...),
    language: str | None = Form(None),
    session_id: str | None = Form(None),
):
    """Transcribe audio AND immediately run it through the legal Q&A pipeline."""
    audio = await file.read()
    if not audio:
        raise HTTPException(status_code=400, detail="Empty audio upload.")

    try:
        tr = transcribe(audio, filename=file.filename or "audio.wav", language_hint=language)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")

    if not tr["text"]:
        raise HTTPException(status_code=422, detail="Could not understand the audio.")

    sid = ensure_session(session_id, kind="chat")
    add_message(sid, "user", tr["text"], language=tr["language"])

    try:
        answer = await legal_answer(tr["text"], language=tr["language"])
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    add_message(sid, "assistant", answer["answer"], language=answer["language"])
    return {"session_id": sid, "transcription": tr, **answer}
