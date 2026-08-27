"""Coordinates chat turns with hybrid retrieval and Groq LLM streaming."""

from __future__ import annotations

import asyncio
import json
import uuid
from collections.abc import AsyncIterator

from app.auth.dependencies import CurrentUser
from app.chat.messages import (
    assistant_message_for_storage,
    extract_latest_user_text,
    user_message_for_storage,
)
from app.chat.streaming import (
    format_done,
    format_finish_step,
    format_start_step,
    format_stream_finish,
    format_stream_start,
    format_text_delta,
    format_text_end,
    format_text_start,
)
from app.database import chats
from app.groq_service import GroqRAGService
from app.retriever import DocumentRetriever

groq_service = GroqRAGService()
retriever = DocumentRetriever()


async def run_stub_turn(
    user: CurrentUser,
    thread_id: uuid.UUID,
    messages: list[dict],
) -> AsyncIterator[str]:
    """Execute grounded RAG turn with Groq LLM streaming, citations payload, and persist messages."""
    await asyncio.to_thread(chats.get_thread_for_user, thread_id, user.id)
    await asyncio.to_thread(chats.ensure_user, user.id, user.email)

    user_text = extract_latest_user_text(messages)
    sources = await asyncio.to_thread(retriever.retrieve, user_text, 5)

    yield format_stream_start()
    yield format_start_step()
    yield format_text_start()

    full_reply_parts = []
    async for token in groq_service.stream_grounded_answer(user_text, sources, messages):
        full_reply_parts.append(token)
        yield format_text_delta(token)

    if sources:
        citations_payload = f"\n\n<!--CITATIONS_DATA:{json.dumps(sources)}-->"
        full_reply_parts.append(citations_payload)
        yield format_text_delta(citations_payload)

    yield format_text_end()
    yield format_finish_step()
    yield format_stream_finish()
    yield format_done()

    full_reply = "".join(full_reply_parts)

    await asyncio.to_thread(
        chats.append_messages,
        thread_id,
        [
            {"role": "user", "message": user_message_for_storage(messages)},
            {"role": "assistant", "message": assistant_message_for_storage(full_reply)},
        ],
    )
