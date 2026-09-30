"""Wirasat / Islamic inheritance calculator endpoint."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.inheritance_service import calculate

router = APIRouter(prefix="/api/inheritance", tags=["inheritance"])


class InheritanceRequest(BaseModel):
    spouse: str = Field("none", description="none | husband | wife")
    wives: int = Field(0, ge=0, le=4)
    sons: int = Field(0, ge=0, le=50)
    daughters: int = Field(0, ge=0, le=50)
    father: bool = False
    mother: bool = False
    full_brothers: int = Field(0, ge=0, le=50)
    full_sisters: int = Field(0, ge=0, le=50)
    estate_value: float | None = Field(None, ge=0)


@router.post("/calculate")
async def calculate_inheritance(req: InheritanceRequest):
    if req.spouse not in ("none", "husband", "wife"):
        raise HTTPException(status_code=400, detail="spouse must be none, husband or wife")
    try:
        return calculate(
            spouse=req.spouse,
            wives=req.wives,
            sons=req.sons,
            daughters=req.daughters,
            father=req.father,
            mother=req.mother,
            full_brothers=req.full_brothers,
            full_sisters=req.full_sisters,
            estate_value=req.estate_value,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {exc}")
