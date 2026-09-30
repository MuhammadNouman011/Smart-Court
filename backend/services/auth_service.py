"""bcrypt + JWT auth helpers."""
from __future__ import annotations

import os
import time

import bcrypt
import jwt
from fastapi import Header, HTTPException

from db import get_user_by_id

JWT_SECRET = os.getenv("JWT_SECRET", "smartcourt-dev-secret-CHANGE-ME")
JWT_ALG    = "HS256"
JWT_TTL    = 60 * 60 * 24 * 30  # 30 days


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def issue_token(user_id: str) -> str:
    now = int(time.time())
    payload = {"sub": user_id, "iat": now, "exp": now + JWT_TTL}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])


def current_user(authorization: str | None = Header(default=None)) -> dict:
    """FastAPI dependency: requires a valid Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        payload = decode_token(authorization.split(" ", 1)[1])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_id(payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def optional_user(authorization: str | None = Header(default=None)) -> dict | None:
    """Same as current_user but returns None if no/invalid token (does not 401)."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        payload = decode_token(authorization.split(" ", 1)[1])
        return get_user_by_id(payload.get("sub", ""))
    except Exception:
        return None
