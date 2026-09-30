"""ChromaDB-backed retrieval service for Pakistan law corpus."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from config import settings
from data.sample_laws import SAMPLE_LAWS

logger = logging.getLogger(__name__)

# Lazy globals so importing this module never blocks on heavy downloads.
_embeddings = None
_vectorstore = None


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        from langchain_community.embeddings import HuggingFaceEmbeddings

        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def _get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        from langchain_chroma import Chroma

        persist_dir = Path(settings.chroma_persist_dir)
        persist_dir.mkdir(parents=True, exist_ok=True)

        _vectorstore = Chroma(
            collection_name="pakistan_laws",
            embedding_function=_get_embeddings(),
            persist_directory=str(persist_dir),
        )
        if _vectorstore._collection.count() == 0:
            logger.info("Empty vector store — seeding with sample Pakistan law corpus.")
            _seed(_vectorstore)
    return _vectorstore


def _seed(store) -> None:
    from langchain_core.documents import Document

    docs = [
        Document(
            page_content=entry["text"],
            metadata={
                "id": entry["id"],
                "category": entry["category"],
                "title": entry["title"],
                "citation": entry["citation"],
                "language": entry["language"],
            },
        )
        for entry in SAMPLE_LAWS
    ]
    ids = [entry["id"] for entry in SAMPLE_LAWS]
    store.add_documents(docs, ids=ids)


def retrieve(query: str, category: str | None = None, k: int = 5) -> list[dict[str, Any]]:
    """Return top-k relevant law passages, optionally filtered by category."""
    store = _get_vectorstore()
    filt: dict | None = None
    if category and category.lower() != "general":
        filt = {"category": category}

    results = []
    if filt:
        try:
            results = store.similarity_search_with_score(query, k=k, filter=filt)
        except Exception as exc:
            logger.warning("Filtered retrieval failed (%s) — retrying without filter.", exc)

    # Chroma does not raise when a category matches nothing — it returns an
    # empty list. Falling back only on an exception would therefore leave a
    # mis-detected category returning no passages at all, so an empty result
    # is treated the same as a failure.
    if not results:
        if filt:
            logger.info("No passages for category %s — retrying unfiltered.",
                        filt.get("category"))
        results = store.similarity_search_with_score(query, k=k)

    out: list[dict[str, Any]] = []
    for doc, score in results:
        out.append(
            {
                "text": doc.page_content,
                "title": doc.metadata.get("title"),
                "citation": doc.metadata.get("citation"),
                "category": doc.metadata.get("category"),
                "language": doc.metadata.get("language"),
                "score": float(score),
            }
        )
    return out


def add_law_documents(documents: list[dict]) -> int:
    """Bulk add custom law documents at runtime."""
    from langchain_core.documents import Document

    store = _get_vectorstore()
    docs = [
        Document(page_content=d["text"], metadata={k: v for k, v in d.items() if k != "text"})
        for d in documents
    ]
    store.add_documents(docs)
    return len(docs)


def ingest_pdf_directory(directory: str | None = None) -> int:
    """Read every PDF in `directory` and add chunks to the store."""
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    target = Path(directory or settings.law_pdf_dir)
    if not target.exists():
        return 0

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=150, separators=["\n\n", "\n", ". ", " "]
    )

    store = _get_vectorstore()
    total = 0
    for pdf in target.glob("**/*.pdf"):
        try:
            loader = PyPDFLoader(str(pdf))
            pages = loader.load()
            for p in pages:
                p.metadata.setdefault("title", pdf.stem)
                p.metadata.setdefault("citation", pdf.stem)
                p.metadata.setdefault("category", "General")
                p.metadata.setdefault("language", "en")
            chunks = splitter.split_documents(pages)
            store.add_documents(chunks)
            total += len(chunks)
        except Exception as exc:
            logger.error("Failed to ingest %s: %s", pdf, exc)
    return total
