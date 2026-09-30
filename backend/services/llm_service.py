"""Ollama Mistral wrappers for all generative tasks."""
from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from config import settings
from services.rag_service import retrieve

logger = logging.getLogger(__name__)


# ---------- Low-level Ollama call ----------

async def _ollama_generate(prompt: str, system: str | None = None,
                           temperature: float = 0.3, max_tokens: int = 1024,
                           json_mode: bool = False) -> str:
    payload: dict[str, Any] = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "keep_alive": "30m",  # keep model in RAM between requests
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "num_ctx": 2048,        # smaller context = faster on CPU
            "num_thread": 0,        # 0 = let Ollama autodetect (uses all cores)
            "top_k": 30,
            "top_p": 0.9,
            "repeat_penalty": 1.1,
        },
    }
    if json_mode:
        payload["format"] = "json"
    if system:
        payload["system"] = system

    url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=10.0)) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
            return (data.get("response") or "").strip()
    except httpx.ConnectError as exc:
        raise RuntimeError(
            "Could not connect to Ollama. Ensure Ollama is running locally and "
            f"the model `{settings.ollama_model}` is pulled. "
            "Install Ollama from https://ollama.com and run: "
            f"`ollama pull {settings.ollama_model}`."
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(f"Ollama returned HTTP {exc.response.status_code}: {exc.response.text}") from exc


# ---------- Heuristics ----------

async def ollama_stream(prompt: str, system: str | None = None,
                        temperature: float = 0.2, max_tokens: int = 500,
                        json_mode: bool = False):
    """Async generator yielding text chunks as the LLM produces them."""
    payload: dict[str, Any] = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": True,
        "keep_alive": "30m",
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "num_ctx": 2048,
            "num_thread": 0,
            "top_k": 30,
            "top_p": 0.9,
            "repeat_penalty": 1.1,
        },
    }
    if json_mode:
        payload["format"] = "json"
    if system:
        payload["system"] = system

    url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
    async with httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=10.0)) as client:
        async with client.stream("POST", url, json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError:
                    continue
                text = chunk.get("response", "")
                if text:
                    yield text
                if chunk.get("done"):
                    return


async def legal_answer_stream(question: str, category: str | None = None,
                              language: str | None = None):
    """Generator yielding (event_type, payload) for streaming chat.

    Event types: 'meta', 'chunk', 'final'.
    """
    category = category or detect_category(question)
    language = language or detect_language(question)

    passages = retrieve(question, category=category, k=3)
    if not passages:
        passages = retrieve(question, category=None, k=3)

    yield ("meta", {
        "category": category,
        "language": language,
        "sources": passages,
    })

    prompt, system = _build_legal_prompt(question, category, language, passages)

    accumulated = ""
    try:
        # Urdu needs more tokens per word — give it 50% headroom.
        max_out = 800 if language == "ur" else 550
        async for piece in ollama_stream(prompt, system=system, temperature=0.2,
                                          max_tokens=max_out, json_mode=False):
            accumulated += piece
            yield ("chunk", piece)
    except Exception as exc:
        yield ("final", {
            "answer": f"Error: {exc}",
            "citations": [p["citation"] for p in passages[:3]],
            "action_plan": [],
            "case_strength": 0,
            "warning": "An error occurred. Please try again.",
        })
        return

    parsed = _safe_json(accumulated, fallback={
        "explanation": accumulated.strip() or "(no response)",
        "citations": [p["citation"] for p in passages[:3]],
        "action_plan": [],
        "case_strength": 50,
        "warning": (
            "یہ مشورہ مصنوعی ذہانت کا ہے، وکیل کا متبادل نہیں۔"
            if language == "ur"
            else "This is AI-generated guidance; consult a licensed lawyer before acting."
        ),
    })

    heuristic = heuristic_case_strength(question, passages)
    llm_score = _as_int(parsed.get("case_strength"), default=heuristic)
    # 70% heuristic anchor + 30% LLM judgement — keeps it varied and grounded.
    blended = max(5, min(95, round(0.7 * heuristic + 0.3 * llm_score)))

    yield ("final", {
        "answer": _as_str(parsed.get("explanation"), fallback=accumulated),
        "citations": _as_list_of_str(parsed.get("citations"))
                      or [p["citation"] for p in passages[:3]],
        "action_plan": _as_list_of_str(parsed.get("action_plan")),
        "case_strength": blended,
        "warning": _as_str(parsed.get("warning")),
    })


CATEGORIES = ["Labour", "Tenant", "Family", "Criminal", "Consumer", "General"]


def detect_category(text: str) -> str:
    t = text.lower()
    keywords = {
        "Labour": [
            "job", "salary", "wage", "boss", "employer", "employee", "overtime", "fired",
            "terminated", "factory", "labour", "eobi", "ملازم", "تنخواہ", "آجر", "برطرف",
        ],
        "Tenant": [
            "rent", "landlord", "tenant", "eviction", "lease", "deposit", "house owner",
            "کرایہ", "مالک مکان", "بے دخل", "ضمانت",
        ],
        "Family": [
            "divorce", "talaq", "khula", "marriage", "nikah", "dowry", "haq mehr",
            "maintenance", "nafaqa", "custody", "child", "guardian",
            "طلاق", "خلع", "نکاح", "نان نفقہ", "تحویل",
        ],
        "Criminal": [
            "fir", "police", "theft", "robbery", "assault", "threat", "intimidation",
            # Stems rather than full words: matching is substring-based, so
            # "harass" also catches harassed/harassing/harassment.
            "harass", "murder", "rape", "kidnap", "fraud", "beat", "stalk",
            "پولیس", "ایف آئی آر", "چوری", "ڈکیتی", "ہراساں", "دھمکی",
        ],
        "Consumer": [
            "refund", "defective", "warranty", "shop", "online order", "fake product",
            "delivery", "ناقص", "وارنٹی", "صارف", "دکاندار",
        ],
    }
    best = ("General", 0)
    for cat, kws in keywords.items():
        score = sum(1 for kw in kws if kw in t)
        if score > best[1]:
            best = (cat, score)
    return best[0]


def detect_language(text: str) -> str:
    if re.search(r"[؀-ۿ]", text):
        return "ur"
    try:
        from langdetect import detect

        lang = detect(text)
        return "ur" if lang in {"ur", "fa", "ar"} else "en"
    except Exception:
        return "en"


# ---------- Legal Q&A ----------

LEGAL_SYSTEM = (
    "You are Smart Court, a Pakistani legal co-pilot. Cite only Pakistan law. "
    "Be concise. Never invent citations. Output strict JSON only."
)


def _build_legal_prompt(question: str, category: str, language: str,
                        passages: list[dict]) -> tuple[str, str]:
    """Return (prompt, system) for the legal Q&A call. Kept short on purpose
    (CPU prompt-processing dominates first-token latency on a 3B model)."""
    # 1 passage, 220 chars max — enough for the model to ground its citation.
    if passages:
        p = passages[0]
        ctx = f"{p['citation']}: {(p['text'] or '')[:220]}"
    else:
        ctx = "(general Pakistani legal principles)"

    lang = "اردو" if language == "ur" else "English"

    prompt = (
        f"Question: {question}\n"
        f"Law: {ctx}\n\n"
        f"Reply in {lang}. JSON keys:\n"
        f"  explanation  -> 2 short paragraphs explaining the law for this citizen\n"
        f"  citations    -> 1-3 statute names like 'PPC §354', never numbers\n"
        f"  action_plan  -> 3 short actionable steps\n"
        f"  case_strength -> INTEGER 0-100. Calibrate honestly to the actual facts:\n"
        f"    0-25  fatally weak (no facts given, expired limitation, wrong forum)\n"
        f"    26-45 weak (vague facts, missing evidence, hostile precedent)\n"
        f"    46-65 mixed (some legal grounds but real gaps)\n"
        f"    66-80 solid (clear statute applies, evidence likely available)\n"
        f"    81-100 very strong (statute applies precisely, clear violation)\n"
        f"    Use the FULL range. Do NOT default to 70-80. Pick the bucket\n"
        f"    that fits, then pick any number inside it.\n"
        f"  warning -> 1 short sentence reminding this is AI guidance, not a lawyer."
    )
    return prompt, LEGAL_SYSTEM


async def legal_answer(question: str, category: str | None = None,
                       language: str | None = None) -> dict[str, Any]:
    category = category or detect_category(question)
    language = language or detect_language(question)

    passages = retrieve(question, category=category, k=3)
    if not passages:
        passages = retrieve(question, category=None, k=3)

    prompt, system = _build_legal_prompt(question, category, language, passages)
    raw = await _ollama_generate(prompt, system=system, temperature=0.2, max_tokens=500, json_mode=True)
    parsed = _safe_json(raw, fallback={
        "explanation": raw or "(no response)",
        "citations": [p["citation"] for p in passages[:3]],
        "action_plan": [],
        "case_strength": 50,
        "warning": (
            "یہ مشورہ مصنوعی ذہانت کا ہے، وکیل کا متبادل نہیں۔"
            if language == "ur"
            else "This is AI-generated guidance; consult a licensed lawyer before acting."
        ),
    })

    heuristic = heuristic_case_strength(question, passages)
    llm_score = _as_int(parsed.get("case_strength"), default=heuristic)
    blended = max(5, min(95, round(0.7 * heuristic + 0.3 * llm_score)))

    return {
        "category": category,
        "language": language,
        "answer": _as_str(parsed.get("explanation"), fallback=raw),
        "citations": _as_list_of_str(parsed.get("citations"))
                      or [p["citation"] for p in passages[:3]],
        "action_plan": _as_list_of_str(parsed.get("action_plan")),
        "case_strength": blended,
        "warning": _as_str(parsed.get("warning")),
        "sources": passages,
    }


# ---------- Document drafting ----------

DOC_TEMPLATES = {
    "fir": {
        "label": "First Information Report (FIR)",
        "system_extra": "Draft an FIR application addressed to the SHO of the relevant police station in standard Pakistani style.",
    },
    "legal_notice": {
        "label": "Legal Notice",
        "system_extra": "Draft a formal legal notice on behalf of the sender, citing Pakistani statutes and giving a clear deadline.",
    },
    "affidavit": {
        "label": "Affidavit",
        "system_extra": "Draft a sworn affidavit on stamp-paper format, numbered paragraphs, ending with a verification clause.",
    },
    "complaint_letter": {
        "label": "Complaint Letter",
        "system_extra": "Draft a professional complaint letter to the appropriate authority (consumer court, ombudsperson, regulator) with a clear prayer.",
    },
}


async def draft_document(doc_type: str, fields: dict[str, Any], language: str = "en") -> dict[str, str]:
    spec = DOC_TEMPLATES.get(doc_type)
    if not spec:
        raise ValueError(f"Unknown document type: {doc_type}")

    lang_line = "Write the entire document in Urdu using formal legal vocabulary." \
        if language == "ur" else "Write the entire document in formal English."

    fields_block = "\n".join(f"- {k}: {v}" for k, v in fields.items() if str(v).strip())

    prompt = f"""{spec['system_extra']}
{lang_line}

User-supplied details:
{fields_block}

Produce a complete, properly formatted document. Include:
- A correct heading and addressee
- Numbered paragraphs of facts
- Specific Pakistani statutory references where relevant
- A clear prayer / demand / request
- A proper closing with placeholders for signature, date, CNIC

Output only the document text. Do not add commentary, do not say "here is your document"."""

    text = await _ollama_generate(
        prompt,
        system=("You are an experienced Pakistani legal drafter. Output formal documents only."),
        temperature=0.3,
        max_tokens=800,
    )
    return {"label": spec["label"], "doc_type": doc_type, "language": language, "text": text}


# ---------- Contract scanning ----------

async def scan_contract(text: str, language: str = "en") -> dict[str, Any]:
    lang_line = (
        "Respond in Urdu where 'explanation' fields are concerned."
        if language == "ur"
        else "Respond in clear English."
    )
    excerpt = text[:8000]

    prompt = f"""You are a contract-risk analyst trained on Pakistani contract and consumer law.
{lang_line}

Read the following contract / agreement excerpt and identify dangerous, unfair, or one-sided clauses.

CONTRACT:
\"\"\"{excerpt}\"\"\"

Reply in STRICT JSON only:
{{
  "summary": "1–2 sentence neutral summary of what this document is",
  "risk_score": <integer 0–100 where 100 is extremely risky>,
  "red_flags": [
    {{
      "clause": "verbatim quote of the problematic clause (max 240 chars)",
      "severity": "low|medium|high|critical",
      "why": "1–2 sentence explanation of why this is dangerous to the signer",
      "law": "the Pakistani statute or principle this clause potentially violates or relies on (or 'general unconscionability')"
    }}
  ],
  "recommendations": ["actionable suggestions to the signer before signing"]
}}
"""

    raw = await _ollama_generate(
        prompt,
        system="You are a meticulous, conservative contract risk analyst.",
        temperature=0.15,
        max_tokens=700,
        json_mode=True,
    )
    return _safe_json(raw, fallback={
        "summary": raw[:400],
        "risk_score": 50,
        "red_flags": [],
        "recommendations": [],
    })


# ---------- Courtroom simulator ----------

JUDGE_SYSTEM = (
    "You are an experienced, strict, but fair Pakistani Sessions Court judge. "
    "You preside in formal English (or Urdu if the litigant addresses you in Urdu). "
    "Your job is to test the petitioner's case by asking sharp questions, pointing "
    "out missing evidence, challenging legal grounds, and demanding specifics. "
    "Stay in character. Do not break the fourth wall. Refer to the petitioner as "
    "'Counsel' or 'Petitioner'."
)


async def judge_turn(case_summary: str, history: list[dict], user_message: str,
                     language: str = "en") -> str:
    transcript = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in history[-12:]
    )
    lang_line = "Speak in Urdu, formal court register." if language == "ur" else "Speak in formal English court register."

    prompt = f"""{lang_line}

Case under review:
\"\"\"{case_summary}\"\"\"

Transcript so far:
{transcript}

The petitioner now states:
\"\"\"{user_message}\"\"\"

As the Hon. Judge, respond with ONE turn: either a probing question, a demand for evidence, a challenge to a legal claim, or a procedural observation. Keep it 2–4 sentences. Do not deliver final verdict unless explicitly asked.
"""
    return await _ollama_generate(prompt, system=JUDGE_SYSTEM, temperature=0.5, max_tokens=200)


async def judge_verdict(case_summary: str, history: list[dict],
                        language: str = "en") -> dict[str, Any]:
    transcript = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in history
    )
    lang_line = "Write the verdict in Urdu." if language == "ur" else "Write the verdict in formal English."

    prompt = f"""{lang_line}

Case under review:
\"\"\"{case_summary}\"\"\"

Full transcript:
{transcript}

Deliver a structured final verdict in STRICT JSON:
{{
  "verdict": "in favour of petitioner | against petitioner | inconclusive",
  "case_strength": <int 0-100>,
  "strengths": ["bullets — what the petitioner did well"],
  "weaknesses": ["bullets — gaps in evidence or law"],
  "feedback": "2–3 paragraphs of constructive advice on how to strengthen this case before filing in a real court",
  "closing_remark": "one formal closing sentence in judicial tone"
}}
"""
    raw = await _ollama_generate(prompt, system=JUDGE_SYSTEM, temperature=0.25, max_tokens=500, json_mode=True)
    return _safe_json(raw, fallback={
        "verdict": "inconclusive",
        "case_strength": 50,
        "strengths": [],
        "weaknesses": [],
        "feedback": raw[:600],
        "closing_remark": "Court is adjourned.",
    })


# ---------- Utility ----------

def _as_str(value: Any, fallback: str = "") -> str:
    """Coerce LLM output to a string — defends against the model returning a list/dict."""
    if value is None:
        return fallback
    if isinstance(value, str):
        return value
    if isinstance(value, (list, tuple)):
        return "\n\n".join(str(v) for v in value if v is not None)
    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def _as_list_of_str(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value else []
    if isinstance(value, (list, tuple)):
        out = []
        for v in value:
            if v is None:
                continue
            if isinstance(v, str):
                out.append(v)
            elif isinstance(v, dict):
                # Common shape: {"step": "..."} or {"title": "...", "details": "..."}
                if "step" in v:        out.append(str(v["step"]))
                elif "title" in v:     out.append(str(v["title"]))
                elif "text"  in v:     out.append(str(v["text"]))
                else:                  out.append(json.dumps(v, ensure_ascii=False))
            else:
                out.append(str(v))
        return out
    return [str(value)]


def heuristic_case_strength(question: str, passages: list[dict]) -> int:
    """Deterministic case-strength estimate based on signal in the question + retrieval.

    This is intentionally not random — same question + same retrieval = same score.
    It rewards concrete facts, evidence words, and successful statute retrieval,
    and penalises vagueness and hedging.

    Returns an int in 10–95.
    """
    if not question:
        return 30

    q = question.lower()
    score = 50  # neutral baseline

    # Length: more words usually means more facts
    words = q.split()
    if   len(words) < 5:   score -= 18
    elif len(words) < 12:  score -= 8
    elif len(words) < 25:  score += 3
    elif len(words) < 50:  score += 8
    else:                  score += 12

    # Strengthening signals (specifics, evidence, paperwork)
    strong_terms = (
        "evidence", "witness", "contract", "signed", "receipt", "salary slip",
        "appointment letter", "cnic", "fir", "police report", "photo", "video",
        "cctv", "messages", "screenshot", "email", "bank statement", "warranty",
        "deed", "stamp paper", "notarised", "registered", "documented",
        # urdu
        "گواہ", "ثبوت", "رسید", "تنخواہ کی پرچی", "ای میل", "رجسٹرڈ",
    )
    score += sum(4 for term in strong_terms if term in q)

    # Concrete numbers / dates / money — strong fact signal
    import re as _re
    if _re.search(r"\b\d{1,2}\s*(day|week|month|year|gen|ghante|روز|ماہ|سال)", q):
        score += 5
    if _re.search(r"\b(rs|pkr|rupees|روپے|لاکھ|ہزار)\b", q):
        score += 4
    if _re.search(r"\b(20\d{2}|19\d{2})\b", q):  # an actual year
        score += 4

    # Weakening signals (hedging, lack of facts)
    weak_terms = (
        "maybe", "i think", "not sure", "i guess", "perhaps", "might",
        "i don't know", "shayad", "lagta hai",
        "شاید", "نہیں معلوم", "پتہ نہیں", "ممکن", "خیال", "اندازہ",
    )
    score -= sum(6 for term in weak_terms if term in q)

    # Bare/wide questions
    if any(p in q for p in ("how to sue", "what to do", "kya karu", "i want to sue", "any case", "can i")):
        if len(words) < 12:
            score -= 12

    # Retrieval quality bonus — a real statute matched ⇒ stronger footing
    cited = len(passages or [])
    if cited >= 3:
        score += 6
    elif cited == 2:
        score += 3
    elif cited == 0:
        score -= 10

    # Clamp to 10..95
    return max(10, min(95, int(score)))


def _as_int(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return max(0, min(100, value))
    try:
        return max(0, min(100, int(float(str(value).strip().rstrip("%")))))
    except (ValueError, TypeError):
        return default


def _safe_json(raw: str, fallback: dict[str, Any]) -> dict[str, Any]:
    """Pull the first parseable JSON object out of an LLM response, defensively.
    Also tries to repair JSON truncated mid-stream (closing braces/brackets)."""
    if not raw:
        return fallback

    candidates = list(_candidate_blobs(raw))

    # If the model output looks like JSON but was cut off, attempt repair.
    repaired = _repair_truncated_json(raw)
    if repaired:
        candidates.append(repaired)

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            cleaned = re.sub(r",(\s*[}\]])", r"\1", candidate)
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                continue
    return fallback


def _repair_truncated_json(raw: str) -> str | None:
    """Best-effort fix for an LLM JSON output cut off by max_tokens."""
    # Strip markdown code fences if present.
    s = raw.strip()
    s = re.sub(r"^```(?:json)?\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    start = s.find("{")
    if start < 0:
        return None
    s = s[start:]

    depth_curly = 0
    depth_square = 0
    in_str = False
    esc = False
    for c in s:
        if esc:
            esc = False; continue
        if c == "\\":
            esc = True; continue
        if c == '"':
            in_str = not in_str; continue
        if in_str:
            continue
        if   c == "{": depth_curly += 1
        elif c == "}": depth_curly -= 1
        elif c == "[": depth_square += 1
        elif c == "]": depth_square -= 1

    if depth_curly <= 0 and depth_square <= 0 and not in_str:
        return None  # Already balanced — no repair needed

    repair = s.rstrip()
    # If we cut off mid-string, close it first.
    if in_str:
        repair += '"'
    # Drop a dangling comma so the closer is valid.
    repair = re.sub(r",\s*$", "", repair)
    # Drop a dangling key like `"warning":` with no value.
    repair = re.sub(r',\s*"[^"]*"\s*:\s*$', "", repair)
    # Close arrays and objects in the right order.
    repair += "]" * max(depth_square, 0)
    repair += "}" * max(depth_curly, 0)
    return repair


def _candidate_blobs(raw: str):
    """Yield JSON candidates: full string, then every balanced {...} substring."""
    yield raw.strip()
    starts = [i for i, c in enumerate(raw) if c == "{"]
    for s in starts:
        depth = 0
        in_str = False
        esc = False
        for i in range(s, len(raw)):
            c = raw[i]
            if esc:
                esc = False; continue
            if c == "\\":
                esc = True; continue
            if c == '"':
                in_str = not in_str; continue
            if in_str:
                continue
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    yield raw[s : i + 1]
                    break
