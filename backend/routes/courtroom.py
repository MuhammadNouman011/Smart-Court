"""Mock courtroom: AI plays a strict Pakistani judge."""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db import add_message, create_session, ensure_session, get_history, get_conn
from services.auth_service import optional_user
from services.llm_service import judge_turn, judge_verdict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/courtroom", tags=["courtroom"])


class StartRequest(BaseModel):
    case_summary: str = Field(..., min_length=10)
    language: str = "en"


class StartResponse(BaseModel):
    session_id: str
    opening: str


class TurnRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1)
    language: str = "en"


class TurnResponse(BaseModel):
    session_id: str
    judge: str


class VerdictRequest(BaseModel):
    session_id: str
    language: str = "en"


def _save_meta(session_id: str, case_summary: str, language: str) -> None:
    meta = json.dumps({"case_summary": case_summary, "language": language})
    with get_conn() as conn:
        conn.execute("UPDATE sessions SET meta = ? WHERE id = ?", (meta, session_id))


def _load_meta(session_id: str) -> dict:
    with get_conn() as conn:
        row = conn.execute("SELECT meta FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if not row or not row["meta"]:
        return {}
    try:
        return json.loads(row["meta"])
    except Exception:
        return {}


@router.post("/start", response_model=StartResponse)
async def start(req: StartRequest, user: dict | None = Depends(optional_user)):
    sid = create_session(kind="courtroom", user_id=user["id"] if user else None)
    _save_meta(sid, req.case_summary, req.language)
    add_message(sid, "system", req.case_summary, language=req.language)

    opening_en = (
        "The Court is now in session. Counsel, you may present the facts of your "
        "case. State the parties, the cause of action, and the relief you seek."
    )
    opening_ur = (
        "عدالت کا اجلاس شروع ہوتا ہے۔ وکیلِ مدعی، اپنے مقدمے کے حقائق پیش کیجیے۔ "
        "فریقین، وجہ دعوی اور مطلوبہ ریلیف بیان کریں۔"
    )
    opening = opening_ur if req.language == "ur" else opening_en
    add_message(sid, "assistant", opening, language=req.language)
    return StartResponse(session_id=sid, opening=opening)


@router.post("/respond", response_model=TurnResponse)
async def respond(req: TurnRequest):
    sid = ensure_session(req.session_id, kind="courtroom")
    meta = _load_meta(sid)
    case_summary = meta.get("case_summary", "(no summary)")

    add_message(sid, "user", req.message, language=req.language)
    history = get_history(sid)

    try:
        reply = await judge_turn(case_summary, history, req.message, language=req.language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("judge_turn failed")
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")

    add_message(sid, "assistant", reply, language=req.language)
    return TurnResponse(session_id=sid, judge=reply)


@router.post("/verdict")
async def verdict(req: VerdictRequest):
    meta = _load_meta(req.session_id)
    case_summary = meta.get("case_summary", "(no summary)")
    history = get_history(req.session_id, limit=200)
    try:
        v = await judge_verdict(case_summary, history, language=req.language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("judge_verdict failed")
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")
    return {"session_id": req.session_id, **v}


@router.get("/transcript/{session_id}")
async def transcript(session_id: str):
    return {"session_id": session_id, "messages": get_history(session_id, limit=500)}
