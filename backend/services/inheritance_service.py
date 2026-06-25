"""Islamic inheritance (Mirath / Faraid) calculator for Pakistan.

Deterministic — no LLM. Uses exact fractions. Covers the common heir set:
spouse, sons, daughters, father, mother, full siblings. Handles the core
doctrines: fixed shares (furud), residuary (asaba 2:1), Awl (shares exceed 1),
Radd (shares fall short with no residuary), and the two ʿUmariyyatayn cases.

Complex configurations (grandparents, grandchildren via representation under
MFLA 1961 §4, mixed consanguine/uterine siblings) are intentionally out of
scope and the API flags them so users consult a scholar / lawyer.
"""
from __future__ import annotations

from fractions import Fraction as F
from typing import Any

SPOUSE_NONE, SPOUSE_HUSBAND, SPOUSE_WIFE = "none", "husband", "wife"


def calculate(
    spouse: str = SPOUSE_NONE,
    wives: int = 0,
    sons: int = 0,
    daughters: int = 0,
    father: bool = False,
    mother: bool = False,
    full_brothers: int = 0,
    full_sisters: int = 0,
    estate_value: float | None = None,
) -> dict[str, Any]:
    sons = max(0, int(sons))
    daughters = max(0, int(daughters))
    wives = max(0, min(4, int(wives)))
    full_brothers = max(0, int(full_brothers))
    full_sisters = max(0, int(full_sisters))

    has_children = sons > 0 or daughters > 0
    has_sons = sons > 0
    siblings = full_brothers + full_sisters

    notes: list[str] = []
    shares: dict[str, dict] = {}   # key -> {fraction, count, basis}

    def put(key, frac, count, basis):
        shares[key] = {"fraction": frac, "count": count, "basis": basis}

    # ── ʿUmariyyatayn special cases ────────────────────────────────────────
    # Heirs are ONLY spouse + father + mother (no children, no siblings).
    only_spouse_parents = (
        father and mother and not has_children and siblings == 0
        and spouse in (SPOUSE_HUSBAND, SPOUSE_WIFE)
    )
    if only_spouse_parents:
        if spouse == SPOUSE_HUSBAND:
            sp = F(1, 2)
            put("Husband", sp, 1, "Qur'an 4:12 — half (no children)")
        else:
            sp = F(1, 4)
            put("Wife", sp, wives or 1, "Qur'an 4:12 — one-fourth (no children)")
        remainder = F(1) - sp
        m = remainder * F(1, 3)            # mother: 1/3 of the REMAINDER
        put("Mother", m, 1, "ʿUmariyyatayn — one-third of the residue")
        put("Father", remainder - m, 1, "ʿUmariyyatayn — residuary (asaba)")
        notes.append("ʿUmariyyatayn rule applied: mother takes one-third of the "
                     "residue after the spouse, not one-third of the whole estate.")
        return _finalise(shares, notes, estate_value, awl=False, radd=False)

    # ── Spouse (fixed) ─────────────────────────────────────────────────────
    if spouse == SPOUSE_HUSBAND:
        f = F(1, 4) if has_children else F(1, 2)
        put("Husband", f, 1, "Qur'an 4:12 — 1/4 with children, 1/2 without")
    elif spouse == SPOUSE_WIFE:
        f = F(1, 8) if has_children else F(1, 4)
        put("Wife", f, wives or 1, "Qur'an 4:12 — 1/8 with children, 1/4 without (shared)")

    # ── Mother (fixed) ─────────────────────────────────────────────────────
    if mother:
        if has_children or siblings >= 2:
            put("Mother", F(1, 6), 1, "Qur'an 4:11 — 1/6 (children or 2+ siblings)")
        else:
            put("Mother", F(1, 3), 1, "Qur'an 4:11 — 1/3 (no children, fewer than 2 siblings)")

    # ── Father ─────────────────────────────────────────────────────────────
    father_residuary = False
    if father:
        if has_sons:
            put("Father", F(1, 6), 1, "Qur'an 4:11 — 1/6 fixed (a male descendant exists)")
        elif has_children:               # only daughters → 1/6 + residue
            put("Father", F(1, 6), 1, "Qur'an 4:11 — 1/6 fixed, plus residue (asaba)")
            father_residuary = True
        else:                            # no children → pure residuary
            father_residuary = True

    # ── Daughters when there are NO sons (fixed share) ──────────────────────
    if daughters > 0 and not has_sons:
        if daughters == 1:
            put("Daughter", F(1, 2), 1, "Qur'an 4:11 — 1/2 (a single daughter)")
        else:
            put("Daughters", F(2, 3), daughters, "Qur'an 4:11 — 2/3 shared (two or more daughters)")

    total_fixed = sum((s["fraction"] for s in shares.values()), F(0))
    residue = F(1) - total_fixed

    # ── Residuary (asaba) distribution ──────────────────────────────────────
    awl = False
    radd = False
    absorbed_residue = False

    if has_sons:
        units = sons * 2 + daughters       # each son = 2 units, each daughter = 1 unit
        per = residue / units if units else F(0)
        # Store the GROUP share (all sons / all daughters together).
        put("Son", per * 2 * sons, sons, "Qur'an 4:11 — residuary, male takes a double share")
        if daughters:
            put("Daughter", per * daughters, daughters, "Qur'an 4:11 — residuary with sons (1 share each)")
        absorbed_residue = True
    elif father_residuary:
        cur = shares.get("Father", {}).get("fraction", F(0))
        put("Father", cur + residue, 1, "Qur'an 4:11 — residuary (asaba) takes the remainder")
        absorbed_residue = True
    elif (full_brothers > 0 or full_sisters > 0) and not father and not has_sons:
        # Full siblings inherit as residuary only when no father / no son.
        units = full_brothers * 2 + full_sisters
        per = residue / units if units else F(0)
        if full_brothers:
            put("Full brother", per * 2 * full_brothers, full_brothers, "Qur'an 4:176 — residuary (2:1)")
        if full_sisters:
            put("Full sister", per * full_sisters, full_sisters, "Qur'an 4:176 — residuary with brothers")
        absorbed_residue = True

    total = sum((s["fraction"] for s in shares.values()), F(0))

    # ── Awl (over-subscribed) ────────────────────────────────────────────────
    if total > 1:
        for s in shares.values():
            s["fraction"] = s["fraction"] / total
        awl = True
        notes.append("ʿAwl applied: the fixed shares exceeded the estate, so every "
                     "share is scaled down proportionally.")
        total = F(1)

    # ── Radd (under-subscribed, no residuary) ────────────────────────────────
    elif total < 1 and not absorbed_residue:
        remainder = F(1) - total
        spouse_keys = {"Husband", "Wife"}
        pool_total = sum((s["fraction"] for k, s in shares.items() if k not in spouse_keys), F(0))
        if pool_total > 0:
            for k, s in shares.items():
                if k in spouse_keys:
                    continue
                s["fraction"] += remainder * (s["fraction"] / pool_total)
            radd = True
            notes.append("Radd applied: leftover estate was returned proportionally to the "
                         "blood heirs (the spouse does not share in Radd).")
        else:
            notes.append("No residuary heir found; remaining estate would pass per "
                         "Pakistani law / Bait-ul-Mal. Consult a scholar.")

    return _finalise(shares, notes, estate_value, awl=awl, radd=radd)


def _finalise(shares, notes, estate_value, *, awl, radd) -> dict[str, Any]:
    if not shares:
        return {
            "heirs": [],
            "total_percent": 0,
            "awl": awl, "radd": radd,
            "notes": ["No recognised heirs were provided."],
            "estate_value": estate_value,
        }

    out = []
    grand_total = sum((s["fraction"] for s in shares.values()), F(0))
    for key, s in shares.items():
        frac = s["fraction"]
        count = max(1, s["count"])
        per_person = frac / count
        amount = float(frac) * estate_value if estate_value else None
        per_amount = float(per_person) * estate_value if estate_value else None
        out.append({
            "heir": key,
            "count": count,
            "group_fraction": _frac_str(frac),
            "group_percent": round(float(frac) * 100, 2),
            "per_person_fraction": _frac_str(per_person),
            "per_person_percent": round(float(per_person) * 100, 2),
            "group_amount": round(amount, 2) if amount is not None else None,
            "per_person_amount": round(per_amount, 2) if per_amount is not None else None,
            "basis": s["basis"],
        })
    # sort: biggest share first
    out.sort(key=lambda x: x["group_percent"], reverse=True)

    return {
        "heirs": out,
        "total_percent": round(float(grand_total) * 100, 2),
        "awl": awl,
        "radd": radd,
        "notes": notes,
        "estate_value": estate_value,
    }


def _frac_str(f: F) -> str:
    if f == 0:
        return "0"
    return f"{f.numerator}/{f.denominator}" if f.denominator != 1 else str(f.numerator)
