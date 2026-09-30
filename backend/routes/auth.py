"""Auth: signup, login, me."""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from db import create_user, get_user_by_email
from services.auth_service import current_user, hash_password, issue_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def _public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "full_name": u["full_name"],
        "created_at": u["created_at"],
    }


@router.post("/signup")
async def signup(req: SignupRequest):
    if get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    if not re.match(r"^[A-Za-z؀-ۿ\s.'-]+$", req.full_name):
        raise HTTPException(status_code=400, detail="Please use letters only in your name.")
    user = create_user(req.email, hash_password(req.password), req.full_name.strip())
    return {
        "access_token": issue_token(user["id"]),
        "token_type": "Bearer",
        "user": _public_user(user),
    }


@router.post("/login")
async def login(req: LoginRequest):
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {
        "access_token": issue_token(user["id"]),
        "token_type": "Bearer",
        "user": _public_user(user),
    }


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return _public_user(user)
