"""Chat thread and message persistence via SQLAlchemy and Supabase client."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status

from app.database.engine import get_session_factory
from app.database.models import ChatMessage, ChatThread, MessageCitation, User
from sqlalchemy import delete, func, select

MAX_USER_THREADS = 10


def ensure_user(user_id: uuid.UUID, email: str) -> None:
    """Upsert a public.users row so chat FKs succeed."""
    session_factory = get_session_factory()
    with session_factory() as session:
        existing = session.get(User, user_id)
        if not existing:
            session.add(User(id=user_id, email=email))
            session.commit()


def _thread_row_to_api(t: ChatThread) -> dict[str, Any]:
    """Format SQLAlchemy ChatThread into API representation."""
    return {
        "id": str(t.id),
        "title": t.title,
        "createdAt": t.created_at.isoformat() if t.created_at else datetime.now(UTC).isoformat(),
        "updatedAt": t.updated_at.isoformat() if t.updated_at else datetime.now(UTC).isoformat(),
    }


def _prune_old_threads_for_user(user_id: uuid.UUID, max_allowed: int = 9) -> None:
    """Enforce maximum chat thread limit per user by deleting the oldest excess threads."""
    session_factory = get_session_factory()
    with session_factory() as session:
        threads = (
            session.scalars(
                select(ChatThread)
                .where(ChatThread.user_id == user_id)
                .order_by(ChatThread.updated_at.asc())
            )
            .all()
        )
        if len(threads) > max_allowed:
            excess = len(threads) - max_allowed
            to_delete = [t.id for t in threads[:excess]]
            msg_ids = session.scalars(select(ChatMessage.id).where(ChatMessage.thread_id.in_(to_delete))).all()
            if msg_ids:
                session.execute(delete(MessageCitation).where(MessageCitation.message_id.in_(msg_ids)))
                session.execute(delete(ChatMessage).where(ChatMessage.id.in_(msg_ids)))
            session.execute(delete(ChatThread).where(ChatThread.id.in_(to_delete)))
            session.commit()


def create_thread_for_user(
    user_id: uuid.UUID, email: str, title: str | None = None
) -> dict[str, Any]:
    """Create a new chat thread for user while strictly keeping total threads <= 10."""
    ensure_user(user_id, email)
    _prune_old_threads_for_user(user_id, max_allowed=MAX_USER_THREADS - 1)

    session_factory = get_session_factory()
    with session_factory() as session:
        new_thread = ChatThread(
            user_id=user_id,
            title=title or "New chat",
        )
        session.add(new_thread)
        session.commit()
        session.refresh(new_thread)
        return _thread_row_to_api(new_thread)


def delete_thread_for_user(thread_id: uuid.UUID, user_id: uuid.UUID) -> None:
    """Delete a chat thread and all its messages permanently from database."""
    session_factory = get_session_factory()
    with session_factory() as session:
        msg_ids = session.scalars(select(ChatMessage.id).where(ChatMessage.thread_id == thread_id)).all()
        if msg_ids:
            session.execute(delete(MessageCitation).where(MessageCitation.message_id.in_(msg_ids)))
            session.execute(delete(ChatMessage).where(ChatMessage.id.in_(msg_ids)))

        session.execute(
            delete(ChatThread).where(
                ChatThread.id == thread_id,
            )
        )
        session.commit()


def list_threads(user_id: uuid.UUID) -> list[dict[str, Any]]:
    """List chat threads for a user sorted by most recent first, capped at 10."""
    session_factory = get_session_factory()
    with session_factory() as session:
        threads = (
            session.scalars(
                select(ChatThread)
                .where(ChatThread.user_id == user_id)
                .order_by(ChatThread.updated_at.desc())
                .limit(MAX_USER_THREADS)
            )
            .all()
        )
        return [_thread_row_to_api(t) for t in threads]


def get_thread_for_user(thread_id: uuid.UUID, user_id: uuid.UUID) -> dict[str, Any]:
    """Retrieve a single thread verifying ownership."""
    session_factory = get_session_factory()
    with session_factory() as session:
        t = session.get(ChatThread, thread_id)
        if not t:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")
        if t.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return _thread_row_to_api(t)


def list_messages(thread_id: uuid.UUID) -> list[dict[str, Any]]:
    """List ordered messages for a thread."""
    session_factory = get_session_factory()
    with session_factory() as session:
        messages = (
            session.scalars(
                select(ChatMessage)
                .where(ChatMessage.thread_id == thread_id)
                .order_by(ChatMessage.sequence_number.asc())
            )
            .all()
        )
        return [
            {
                "id": str(m.id),
                "role": m.role,
                "message": m.message,
                "sequenceNumber": m.sequence_number,
                "createdAt": m.created_at.isoformat() if m.created_at else datetime.now(UTC).isoformat(),
            }
            for m in messages
        ]


def _next_sequence_number(thread_id: uuid.UUID) -> int:
    """Determine the next sequential message number in a thread."""
    session_factory = get_session_factory()
    with session_factory() as session:
        max_seq = session.scalar(
            select(func.max(ChatMessage.sequence_number)).where(ChatMessage.thread_id == thread_id)
        )
        return (max_seq or 0) + 1


def append_messages(
    thread_id: uuid.UUID,
    messages: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Insert messages, update thread updated_at timestamp, and auto-title on first turn."""
    if not messages:
        return []

    seq = _next_sequence_number(thread_id)
    session_factory = get_session_factory()
    with session_factory() as session:
        added_messages = []
        for item in messages:
            msg_obj = ChatMessage(
                thread_id=thread_id,
                role=item["role"],
                message=item["message"],
                sequence_number=seq,
            )
            session.add(msg_obj)
            added_messages.append(msg_obj)
            seq += 1

        t = session.get(ChatThread, thread_id)
        if t:
            t.updated_at = datetime.now(UTC)
            for item in messages:
                if item.get("role") == "user":
                    user_msg = item.get("message", {})
                    user_text = ""
                    if isinstance(user_msg, dict) and "parts" in user_msg:
                        for p in user_msg.get("parts", []):
                            if p.get("type") == "text":
                                user_text += p.get("text", "")
                    elif isinstance(user_msg, str):
                        user_text = user_msg

                    if user_text.strip():
                        clean_title = user_text.strip().replace("\n", " ")
                        if len(clean_title) > 36:
                            clean_title = clean_title[:34] + "..."
                        if t.title.lower() in ("new chat", "new thread", ""):
                            t.title = clean_title
                    break

        session.commit()
        return [
            {
                "id": str(m.id),
                "role": m.role,
                "message": m.message,
                "sequenceNumber": m.sequence_number,
                "createdAt": m.created_at.isoformat() if m.created_at else datetime.now(UTC).isoformat(),
            }
            for m in added_messages
        ]
