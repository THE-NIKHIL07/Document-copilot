from collections.abc import AsyncIterator
from typing import Any
from groq import AsyncGroq, Groq
from app.config import settings


class GroqRAGService:
    """Orchestrates LLM generation with strict citation grounding using Groq API."""

    def __init__(self):
        """Initialize synchronous and asynchronous Groq API clients."""
        self.api_key = settings.groq_api_key
        self.model = settings.groq_model
        self.sync_client = Groq(api_key=self.api_key)
        self.async_client = AsyncGroq(api_key=self.api_key)

    def _build_system_prompt(self) -> str:
        """Construct system instructions enforcing factual grounding and citations."""
        return (
            "You are Document Copilot, an expert AI research assistant for Driftwood Capital. "
            "Your mission is to provide accurate, concise, and factually grounded answers to investment analysts "
            "based strictly on the provided company document excerpts and SEC filings.\n\n"
            "STRICT RULES:\n"
            "1. Answer ONLY using information explicitly stated in the provided document excerpts.\n"
            "2. Always cite every factual claim with bracketed source numbers like [Source 1], [Source 2], etc.\n"
            "3. If the provided context does not contain sufficient facts to answer the question, clearly state: "
            "'Based on the provided documents, there is not enough evidence in the corpus to answer this question.'\n"
            "4. Never hallucinate, extrapolate beyond the filings, or invent financial figures.\n"
            "5. Maintain a professional, objective tone suitable for institutional investment research."
        )

    def _build_user_context_prompt(self, query: str, sources: list[dict[str, Any]]) -> str:
        """Format retrieved document passages into structured prompt context."""
        context_blocks = []
        for i, src in enumerate(sources, 1):
            company = src.get("company_name") or src.get("company") or "Company"
            ticker = src.get("ticker", "")
            filing = src.get("filing_type") or src.get("filename") or "Filing"
            year = src.get("fiscal_year") or ""
            header = f"--- [Source {i}] {company} ({ticker}) | {filing} {year} ---"
            content = src.get("chunk_text") or src.get("content") or ""
            context_blocks.append(f"{header}\n{content}\n")

        joined_context = "\n".join(context_blocks)
        return (
            f"DOCUMENT PASSAGES:\n"
            f"{joined_context}\n\n"
            f"ANALYST QUESTION: {query}\n\n"
            f"Provide a comprehensive, grounded answer with exact bracketed citations [Source X]."
        )

    async def stream_grounded_answer(
        self,
        query: str,
        sources: list[dict[str, Any]],
        history: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[str]:
        """Stream answer tokens from Groq API in real time."""
        if not sources:
            yield "Based on the provided documents, there is not enough evidence in the corpus to answer this question. Please ensure the relevant SEC filings or company documents are ingested."
            return

        messages = [{"role": "system", "content": self._build_system_prompt()}]
        if history:
            for item in history[-4:]:
                role = item.get("role", "user")
                content = item.get("content") or item.get("message", "")
                if isinstance(content, str) and content.strip():
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": self._build_user_context_prompt(query, sources)})

        stream = await self.async_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.1,
            max_tokens=1500,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
