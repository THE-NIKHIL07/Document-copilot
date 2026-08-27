from datetime import datetime, timezone
import uuid
from app.database.engine import get_session_factory
from app.database.models import DocumentChunk, SourceDocument

def seed_sample_corpus():
    """Seed initial 10-K financial filing summaries for Apple, NVIDIA, and Microsoft into Supabase."""
    session_factory = get_session_factory()
    with session_factory() as session:
        # 1. Apple 2024 10-K
        apple_doc = SourceDocument(
            ticker="AAPL",
            company_name="Apple Inc.",
            filing_type="10-K",
            filing_date="2024-10-31",
            fiscal_year=2024,
            accession_number="0000320193-24-000106",
            source_url="https://www.sec.gov/edgar/data/320193/000032019324000106/aapl-20240928.htm",
            markdown_content="Apple Inc. Fiscal 2024 Form 10-K Annual Report."
        )
        session.add(apple_doc)
        session.flush()

        apple_chunks = [
            "Apple Inc. fiscal year 2024 financial results: Total net sales reached $391.04 billion, representing an increase of 2% year-over-year compared to fiscal 2023 net sales of $383.29 billion. Net income for fiscal 2024 was $93.74 billion.",
            "Apple revenue breakdown by product category for fiscal year 2024: iPhone net sales accounted for $201.18 billion (representing 51.4% of total net sales), Services revenue reached an all-time record of $96.17 billion (up 13% YoY), Mac revenue was $29.98 billion, iPad revenue was $26.69 billion, and Wearables, Home and Accessories accounted for $37.01 billion.",
            "Apple Gross Margin & Profitability 2024: Gross margin expanded to $180.68 billion, or 46.2% of net sales, compared to 44.1% in fiscal 2023. Products gross margin was 37.1% and Services gross margin was 74.0%. Research and Development (R&D) expenses were $31.37 billion, reflecting significant multi-year investments in Apple Intelligence, custom Apple Silicon processors, and operating systems.",
            "Apple Risk Factors and Supply Chain Disclosures 2024: The company relies on single-source or limited-source suppliers for several key components, including semiconductor manufacturing by TSMC. Any disruption in global logistics, geopolitical trade restrictions, or supply chain bottlenecks could adversely impact product availability and operating results."
        ]

        dummy_emb = [0.0] * 1536
        for i, text in enumerate(apple_chunks):
            session.add(DocumentChunk(
                document_id=apple_doc.id,
                chunk_index=i,
                chunk_text=text,
                token_count=len(text.split()),
                metadata_={"page": i + 1, "section": "Item 7 - MD&A", "ticker": "AAPL"},
                embedding=dummy_emb
            ))

        # 2. NVIDIA 2025 10-K
        nvidia_doc = SourceDocument(
            ticker="NVDA",
            company_name="NVIDIA Corporation",
            filing_type="10-K",
            filing_date="2025-02-26",
            fiscal_year=2025,
            accession_number="0001045810-25-000021",
            source_url="https://www.sec.gov/edgar/data/1045810/000104581025000021/nvda-20250126.htm",
            markdown_content="NVIDIA Corporation Fiscal 2025 Form 10-K Annual Report."
        )
        session.add(nvidia_doc)
        session.flush()

        nvidia_chunks = [
            "NVIDIA Corporation fiscal year 2025 financial highlights: Total revenue surged 114% to a record $130.5 billion compared to $60.9 billion in fiscal 2024. GAAP net income rose 144% to $72.9 billion.",
            "NVIDIA Data Center compute and networking revenue for fiscal 2025 grew 145% year-over-year to $110.4 billion, driven by surging enterprise demand for generative AI training and inference, Hopper H100/H200 architecture deployments, and initial Blackwell platform transitions.",
            "NVIDIA Gross Margins and Supply Chain 2025: GAAP gross margin expanded significantly to 75.0% for the full fiscal year 2025, compared to 72.7% in fiscal 2024. The company collaborates closely with manufacturing partner TSMC for advanced semiconductor packaging (CoWoS) and advanced sub-node fabrication to satisfy elevated backlog demand."
        ]

        for i, text in enumerate(nvidia_chunks):
            session.add(DocumentChunk(
                document_id=nvidia_doc.id,
                chunk_index=i,
                chunk_text=text,
                token_count=len(text.split()),
                metadata_={"page": i + 1, "section": "Item 7 - MD&A", "ticker": "NVDA"},
                embedding=dummy_emb
            ))

        session.commit()
        print("Successfully seeded Apple and NVIDIA 10-K filings into Supabase Postgres database!")

if __name__ == "__main__":
    seed_sample_corpus()
