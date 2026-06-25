"""faster-whisper based speech-to-text (prebuilt wheels, ~4x faster than openai-whisper)."""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from config import settings

logger = logging.getLogger(__name__)

_model = None


def _load_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        logger.info("Loading faster-whisper model: %s", settings.whisper_model)
        # CPU-only, int8 quant for memory efficiency on laptops.
        _model = WhisperModel(
            settings.whisper_model,
            device="cpu",
            compute_type="int8",
        )
    return _model


def transcribe(audio_bytes: bytes, filename: str = "audio.wav",
               language_hint: str | None = None) -> dict:
    """Transcribe an uploaded audio file to text. language_hint: 'en'|'ur'|None."""
    suffix = Path(filename).suffix or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        model = _load_model()
        kwargs: dict = {"beam_size": 5, "vad_filter": True}
        if language_hint in ("ur", "en"):
            kwargs["language"] = language_hint

        segments, info = model.transcribe(tmp_path, **kwargs)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return {
            "text": text,
            "language": info.language or language_hint or "en",
        }
    finally:
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except Exception:
            pass
