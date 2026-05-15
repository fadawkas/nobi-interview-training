from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# ── Legacy schemas (kept for backward compat) ─────────────────────────────────

class ASRJobRequest(BaseModel):
    job_id: str = Field(..., example="asr_job_001")
    answer_id: str = Field(..., example="answer_001")
    audio_path: str = Field(..., example="/data/audio/answer_001.wav")
    language: Optional[str] = Field(default=None, example="id")


class ASRJobResponse(BaseModel):
    job_id: str
    answer_id: str
    status: str
    transcript_text: str
    language: str
    duration_seconds: Optional[float] = None


class FEMJobRequest(BaseModel):
    job_id: str = Field(..., example="fem_job_001")
    answer_id: str = Field(..., example="answer_001")
    video_path: str = Field(..., example="/data/video/answer_001.mp4")
    frame_interval: int = Field(default=15, example=15)


class FEMJobResponse(BaseModel):
    job_id: str
    answer_id: str
    status: str
    dominant_expression: str
    positive_percentage: float
    neutral_percentage: float
    negative_percentage: float


# ── New REST schemas ───────────────────────────────────────────────────────────

class ASRMetadata(BaseModel):
    model_name: str
    language: str
    duration: Optional[float] = None


class ASRTranscribeResponse(BaseModel):
    transcript: str
    metadata: ASRMetadata


class FEMFrameResult(BaseModel):
    frame_index: int
    dominant_emotion: str
    scores: Dict[str, float]


class FEMAnalyzeResponse(BaseModel):
    dominant_emotion: str
    emotion_distribution: Dict[str, float]
    frame_results: List[FEMFrameResult]
    confidence_average: float
    expression_score: float