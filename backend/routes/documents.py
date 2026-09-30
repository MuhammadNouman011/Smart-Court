"""Auto-draft FIR / Legal Notice / Affidavit / Complaint Letter and export PDF."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.llm_service import DOC_TEMPLATES, draft_document
from services.pdf_service import text_to_docx, text_to_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])


class DraftRequest(BaseModel):
    doc_type: str = Field(..., description="fir | legal_notice | affidavit | complaint_letter")
    language: str = Field("en", description="'en' or 'ur'")
    fields: dict = Field(default_factory=dict)


class DraftResponse(BaseModel):
    doc_type: str
    label: str
    language: str
    text: str


class PdfRequest(BaseModel):
    title: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)


@router.get("/types")
async def list_types():
    return [
        {"id": key, "label": spec["label"]}
        for key, spec in DOC_TEMPLATES.items()
    ]


@router.post("/draft", response_model=DraftResponse)
async def draft(req: DraftRequest):
    if req.doc_type not in DOC_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Unsupported doc_type: {req.doc_type}")
    try:
        result = await draft_document(req.doc_type, req.fields, language=req.language)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("draft failed")
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")
    return DraftResponse(**result)


@router.post("/pdf")
async def export_pdf(req: PdfRequest):
    try:
        pdf_bytes = text_to_pdf(req.title, req.body)
    except Exception as exc:
        logger.exception("text_to_pdf failed")
        raise HTTPException(status_code=500, detail=f"PDF export failed: {exc}")
    headers = {
        "Content-Disposition": f'attachment; filename="{req.title.replace(" ", "_")}.pdf"'
    }
    return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf", headers=headers)


@router.post("/docx")
async def export_docx(req: PdfRequest):
    try:
        docx_bytes = text_to_docx(req.title, req.body)
    except Exception as exc:
        logger.exception("text_to_docx failed")
        raise HTTPException(status_code=500, detail=f"DOCX export failed: {exc}")
    headers = {
        "Content-Disposition": f'attachment; filename="{req.title.replace(" ", "_")}.docx"'
    }
    return StreamingResponse(
        iter([docx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers,
    )
