from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from typing import Optional
from .config import APP_NAME, APP_ENV, ASR_MODEL_NAME, MAX_FEM_FRAMES
from .schemas import (
    ASRJobRequest,
    ASRJobResponse,
    FEMJobRequest,
    FEMJobResponse,
    ASRTranscribeResponse,
    FEMAnalyzeResponse,
)
from .asr_service import process_asr, process_asr_from_bytes
from .fem_service import process_fem, process_fem_from_bytes

app = FastAPI(
    title=APP_NAME,
    version="2.0.0",
    description="AI inference service for ASR and FEM — NobiAI",
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": APP_NAME,
        "environment": APP_ENV,
    }


# ── New file-upload endpoints (used by Express Agenda jobs) ───────────────────

@app.post("/asr/transcribe", response_model=ASRTranscribeResponse)
async def asr_transcribe(
    audio_file: UploadFile = File(...),
    language: Optional[str] = Form(default=None),
):
    """
    Accept an audio file upload and return transcript + metadata.
    Used by the Express process-answer Agenda job.
    """
    try:
        audio_bytes = await audio_file.read()
        result = process_asr_from_bytes(audio_bytes, language)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fem/analyze-video", response_model=FEMAnalyzeResponse)
async def fem_analyze_video(
    video_file: UploadFile = File(...),
    max_frames: int = Form(default=MAX_FEM_FRAMES),
):
    """
    Accept a video file upload, sample frames, run FEM, and return results.
    Used by the Express process-answer Agenda job.
    """
    try:
        video_bytes = await video_file.read()
        result = process_fem_from_bytes(video_bytes, max_frames)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Legacy path-based endpoints (kept for backward compat) ────────────────────

@app.post("/jobs/asr/process", response_model=ASRJobResponse)
def process_asr_job(payload: ASRJobRequest):
    try:
        result = process_asr(
            audio_path=payload.audio_path,
            language=payload.language,
        )
        return ASRJobResponse(
            job_id=payload.job_id,
            answer_id=payload.answer_id,
            status="completed",
            transcript_text=result["transcript_text"],
            language=result["language"],
            duration_seconds=result["duration_seconds"],
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/fem/process", response_model=FEMJobResponse)
def process_fem_job(payload: FEMJobRequest):
    try:
        result = process_fem(
            video_path=payload.video_path,
            frame_interval=payload.frame_interval,
        )
        return FEMJobResponse(
            job_id=payload.job_id,
            answer_id=payload.answer_id,
            status="completed",
            dominant_expression=result["dominant_expression"],
            positive_percentage=result["positive_percentage"],
            neutral_percentage=result["neutral_percentage"],
            negative_percentage=result["negative_percentage"],
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))