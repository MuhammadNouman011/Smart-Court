"""SQLite storage: users + sessions + messages."""
from __future__ import annotations

import sqlite3
import time
import uuid
from contextlib import contextmanager
from typing import Iterator

from config import settings


def _now() -> int:
    return int(time.time())


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(settings.sqlite_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        # 1. Create tables (without indexes that reference possibly-missing columns).
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                kind TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL DEFAULT 0,
                meta TEXT
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                language TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_messages_session
                ON messages(session_id, created_at);
            """
        )

        # 2. Migrate older sessions table that may be missing columns.
        cols = {r[1] for r in conn.execute("PRAGMA table_info(sessions)").fetchall()}
        if "user_id" not in cols:
            conn.execute("ALTER TABLE sessions ADD COLUMN user_id TEXT")
        if "updated_at" not in cols:
            conn.execute("ALTER TABLE sessions ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0")

        # 3. Now safe to add the user-scoped sessions index.
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, updated_at DESC)")


# ── users ──────────────────────────────────────────────────────────────────

def create_user(email: str, password_hash: str, full_name: str) -> dict:
    uid = uuid.uuid4().hex
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO users (id, email, password_hash, full_name, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (uid, email.lower(), password_hash, full_name, _now()),
        )
    return {"id": uid, "email": email.lower(), "full_name": full_name, "created_at": _now()}


def get_user_by_email(email: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, email, password_hash, full_name, created_at FROM users WHERE email = ?",
            (email.lower(),),
        ).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, email, full_name, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


# ── sessions ───────────────────────────────────────────────────────────────

def create_session(kind: str, meta: str | None = None, user_id: str | None = None) -> str:
    sid = uuid.uuid4().hex
    n = _now()
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO sessions (id, user_id, kind, created_at, updated_at, meta) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (sid, user_id, kind, n, n, meta),
        )
    return sid


def ensure_session(session_id: str | None, kind: str, user_id: str | None = None) -> str:
    if session_id:
        with get_conn() as conn:
            row = conn.execute(
                "SELECT id FROM sessions WHERE id = ?", (session_id,)
            ).fetchone()
            if row:
                # bump updated_at + attach user if not already
                if user_id:
                    conn.execute("UPDATE sessions SET updated_at = ?, user_id = COALESCE(user_id, ?) WHERE id = ?",
                                 (_now(), user_id, session_id))
                else:
                    conn.execute("UPDATE sessions SET updated_at = ? WHERE id = ?", (_now(), session_id))
                return session_id
    return create_session(kind, user_id=user_id)


def list_sessions_for_user(user_id: str, limit: int = 100) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT s.id, s.kind, s.created_at, s.updated_at,
                      (SELECT content FROM messages m WHERE m.session_id = s.id AND m.role = 'user'
                       ORDER BY m.created_at ASC LIMIT 1) AS preview
               FROM sessions s
               WHERE s.user_id = ?
               ORDER BY s.updated_at DESC
               LIMIT ?""",
            (user_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]


def delete_session(session_id: str, user_id: str) -> bool:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id FROM sessions WHERE id = ? AND user_id = ?",
            (session_id, user_id),
        ).fetchone()
        if not row:
            return False
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    return True


# ── messages ───────────────────────────────────────────────────────────────

def add_message(session_id: str, role: str, content: str, language: str | None = None) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, language, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (session_id, role, str(content) if content is not None else "", language, _now()),
        )
        conn.execute("UPDATE sessions SET updated_at = ? WHERE id = ?", (_now(), session_id))


def get_history(session_id: str, limit: int = 200) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT role, content, language, created_at FROM messages "
            "WHERE session_id = ? ORDER BY created_at ASC LIMIT ?",
            (session_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]
