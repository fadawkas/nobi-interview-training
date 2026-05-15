import os
import time
import tempfile
from faster_whisper import WhisperModel
from .config import (
    ASR_MODEL_NAME,
    ASR_DEVICE,
    ASR_COMPUTE_TYPE,
    ASR_BEAM_SIZE,
    ASR_USE_VAD,
    ASR_LANGUAGE,
)

_model = None


def get_asr_model():
    global _model
    if _model is None:
        _model = WhisperModel(
            ASR_MODEL_NAME,
            device=ASR_DEVICE,
            compute_type=ASR_COMPUTE_TYPE,
        )
    return _model


def process_asr(audio_path: str, language: str | None = None) -> dict:
    """
    Transcribe audio at audio_path.
    Returns { transcript_text, language, duration_seconds }.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    model = get_asr_model()
    used_language = language or ASR_LANGUAGE

    segments, info = model.transcribe(
        audio_path,
        language=used_language,
        beam_size=ASR_BEAM_SIZE,
        vad_filter=ASR_USE_VAD,
        condition_on_previous_text=False,
    )

    transcript_text = " ".join(
        segment.text.strip() for segment in segments
    ).strip()

    return {
        "transcript_text": transcript_text,
        "language": used_language,
        "duration_seconds": getattr(info, "duration", None),
    }


def process_asr_from_bytes(audio_bytes: bytes, language: str | None = None) -> dict:
    """
    Transcribe audio supplied as raw bytes (file upload).
    Writes to a temp file, runs ASR, then cleans up.
    Returns { transcript, metadata: { model_name, language, duration } }.
    """
    start = time.time()

    suffix = ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = process_asr(tmp_path, language)
        latency = time.time() - start
        return {
            "transcript": result["transcript_text"],
            "metadata": {
                "model_name": ASR_MODEL_NAME,
                "language": result["language"],
                "duration": result["duration_seconds"],
                "latency": round(latency, 3),
            },
        }
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass