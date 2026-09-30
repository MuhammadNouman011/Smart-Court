"""Per-user conversation history."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from db import delete_session, get_history, list_sessions_for_user
from services.auth_service import current_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("")
async def list_my_sessions(user: dict = Depends(current_user)):
    rows = list_sessions_for_user(user["id"])
    return {"sessions": rows}


@router.get("/{session_id}")
async def get_session(session_id: str, user: dict = Depends(current_user)):
    msgs = get_history(session_id)
    return {"id": session_id, "messages": msgs}


@router.delete("/{session_id}")
async def remove(session_id: str, user: dict = Depends(current_user)):
    ok = delete_session(session_id, user["id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}
