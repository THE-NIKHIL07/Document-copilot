from typing import Any
from sqlalchemy import func, select
from app.database.engine import get_session_factory
from app.database.models import DocumentChunk, SourceDocument


class DocumentRetriever:
    """Retrieves relevant chunks from Postgres database using full-text search and keyword matching."""

    def __init__(self):
        """Initialize retriever with database session factory."""
        self.session_factory = get_session_factory()

    def retrieve(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """Retrieve top matching document chunks from the database for the given query."""
        if not query.strip():
            return []

        clean_words = [w for w in query.replace("'", "").split() if len(w) > 2]
        ts_query = " | ".join(clean_words) if clean_words else query

        with self.session_factory() as session:
            try:
                stmt = (
                    select(
                        DocumentChunk.id,
                        DocumentChunk.chunk_text,
                        DocumentChunk.chunk_index,
                        DocumentChunk.metadata_,
                        SourceDocument.ticker,
                        SourceDocument.company_name,
                        SourceDocument.filing_type,
                        SourceDocument.fiscal_year,
                    )
                    .join(SourceDocument, DocumentChunk.document_id == SourceDocument.id)
                    .where(
                        DocumentChunk.search_vector.op("@@")(
                            func.to_tsquery("english", ts_query)
                        )
                    )
                    .limit(top_k)
                )
                rows = session.execute(stmt).all()
            except Exception:
                rows = []

            if not rows:
                fallback_stmt = (
                    select(
                        DocumentChunk.id,
                        DocumentChunk.chunk_text,
                        DocumentChunk.chunk_index,
                        DocumentChunk.metadata_,
                        SourceDocument.ticker,
                        SourceDocument.company_name,
                        SourceDocument.filing_type,
                        SourceDocument.fiscal_year,
                    )
                    .join(SourceDocument, DocumentChunk.document_id == SourceDocument.id)
                    .limit(top_k)
                )
                rows = session.execute(fallback_stmt).all()

            results = []
            for row in rows:
                results.append({
                    "id": str(row.id),
                    "chunk_text": row.chunk_text,
                    "chunk_index": row.chunk_index,
                    "metadata": row.metadata_,
                    "ticker": row.ticker,
                    "company_name": row.company_name,
                    "filing_type": row.filing_type,
                    "fiscal_year": row.fiscal_year,
                })
            return results
