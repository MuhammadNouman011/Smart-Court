"""Legal Q&A chat endpoints."""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from db import add_message, ensure_session, get_history
from services.auth_service import optional_user
from services.llm_service import (
    detect_category, detect_language, legal_answer, legal_answer_stream,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: str | None = None
    language: str | None = None  # 'en' | 'ur' | None (auto)
    category: str | None = None  # optional override


class Citation(BaseModel):
    text: str
    citation: str | None = None
    title: str | None = None
    score: float | None = None


class ChatResponse(BaseModel):
    session_id: str
    category: str
    language: str
    answer: str
    citations: list[str]
    action_plan: list[str]
    case_strength: int
    warning: str
    sources: list[dict]


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, user: dict | None = Depends(optional_user)):
    sid = ensure_session(req.session_id, kind="chat", user_id=user["id"] if user else None)
    add_message(sid, "user", req.message, language=req.language)

    try:
        result = await legal_answer(
            req.message,
            category=req.category,
            language=req.language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("legal_answer failed")
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")

    add_message(sid, "assistant", result["answer"], language=result["language"])
    return ChatResponse(session_id=sid, **result)


@router.post("/stream")
async def chat_stream(req: ChatRequest, user: dict | None = Depends(optional_user)):
    """Server-Sent Events stream of the legal answer."""
    sid = ensure_session(req.session_id, kind="chat", user_id=user["id"] if user else None)
    add_message(sid, "user", req.message, language=req.language)

    async def event_gen():
        # Tell client which session we're in.
        yield f"data: {json.dumps({'type':'session','session_id':sid})}\n\n"

        final_payload: dict | None = None
        try:
            async for ev_type, payload in legal_answer_stream(
                req.message, category=req.category, language=req.language
            ):
                yield f"data: {json.dumps({'type': ev_type, 'data': payload})}\n\n"
                if ev_type == "final":
                    final_payload = payload
        except RuntimeError as exc:
            yield f"data: {json.dumps({'type':'error','message':str(exc)})}\n\n"
            return
        except Exception as exc:
            logger.exception("chat_stream failed")
            yield f"data: {json.dumps({'type':'error','message':f'Internal error: {exc}'})}\n\n"
            return

        if final_payload:
            add_message(sid, "assistant", final_payload.get("answer", ""),
                        language=req.language)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history/{session_id}")
async def history(session_id: str):
    rows = get_history(session_id)
    return {"session_id": session_id, "messages": rows}


@router.get("/detect")
async def detect(text: str):
    return {
        "language": detect_language(text),
        "category": detect_category(text),
    }
