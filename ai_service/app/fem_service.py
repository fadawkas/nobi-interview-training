import os
import tempfile
import cv2
import numpy as np
import subprocess
import logging
from collections import Counter
from PIL import Image
from transformers import pipeline
from .config import FEM_MODEL_NAME, FEM_DEVICE, MAX_FEM_FRAMES

_clf = None
logger = logging.getLogger(__name__)

# Raw emotion → sentiment group
SENTIMENT_MAP = {
    "happy": "positive",
    "surprise": "positive",
    "neutral": "neutral",
    "sad": "negative",
    "angry": "negative",
    "fear": "negative",
    "disgust": "negative",
}

# Scoring weights: positive=high, neutral=mid, negative=low
SENTIMENT_SCORE = {
    "positive": 90,
    "neutral": 60,
    "negative": 30,
}


def get_fem_model():
    global _clf
    if _clf is None:
        _clf = pipeline(
            "image-classification",
            model=FEM_MODEL_NAME,
            device=FEM_DEVICE,
        )
    return _clf


def _convert_to_mp4(input_path: str) -> str:
    """
    Convert input video (e.g., WebM) to H.264 MP4 for reliable OpenCV decoding.
    Returns the path to the converted MP4 file.
    Raises ValueError if conversion fails.
    """
    output_path = input_path + "_cv.mp4"
    logger.info(f"[FEM] Converting {input_path} to MP4: {output_path}")
    
    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-an",  # No audio
            output_path,
        ],
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        error_msg = result.stderr[-300:] if result.stderr else "Unknown error"
        logger.error(f"[FEM] FFmpeg conversion failed: {error_msg}")
        raise ValueError(f"FFmpeg conversion failed: {error_msg}")
    
    logger.info(f"[FEM] FFmpeg conversion succeeded: {output_path}")
    return output_path


def sample_frames_from_video(video_path: str, max_frames: int = 10):
    """
    Sample up to max_frames evenly-spaced frames from a video file.
    Returns a list of (frame_index, RGB numpy array) tuples.
    """
    logger.info(f"[FEM] Sampling frames from {video_path}, max_frames={max_frames}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"[FEM] Failed to open video file: {video_path}")
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    logger.info(f"[FEM] Video opened successfully. Total frames: {total_frames}")
    
    if total_frames <= 0:
        logger.error(f"[FEM] No frames detected in video. total_frames={total_frames}")
        cap.release()
        return []

    # Evenly space up to max_frames indices
    indices = set(
        int(i * total_frames / max_frames)
        for i in range(max_frames)
    )

    frames = []
    for idx in sorted(indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append((idx, rgb))

    cap.release()
    logger.info(f"[FEM] Successfully extracted {len(frames)} frames out of {len(indices)} attempted")
    return frames


def process_fem(video_path: str, frame_interval: int = 15) -> dict:
    """
    Legacy path-based FEM (kept for backward compat with old endpoints).
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    clf = get_fem_model()

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Cannot open video")

    frames = []
    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if idx % frame_interval == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(rgb)
        idx += 1
    cap.release()

    if not frames:
        raise ValueError("No frames extracted from video")

    grouped = []
    for frame in frames:
        preds = clf(Image.fromarray(frame))
        if preds:
            label = preds[0]["label"].lower()
            grouped.append(SENTIMENT_MAP.get(label, "neutral"))

    if not grouped:
        raise ValueError("No valid FEM predictions generated")

    counts = Counter(grouped)
    total = sum(counts.values())

    return {
        "dominant_expression": counts.most_common(1)[0][0],
        "positive_percentage": round((counts.get("positive", 0) / total) * 100, 2),
        "neutral_percentage": round((counts.get("neutral", 0) / total) * 100, 2),
        "negative_percentage": round((counts.get("negative", 0) / total) * 100, 2),
    }


def process_fem_from_bytes(video_bytes: bytes, max_frames: int = 10) -> dict:
    """
    FEM inference from uploaded video bytes.
    Returns the new response schema expected by Express.
    """
    logger.info(f"[FEM] Processing FEM from bytes, size={len(video_bytes)} bytes, max_frames={max_frames}")
    
    suffix = ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name
    
    logger.info(f"[FEM] Temp WebM saved to: {tmp_path}")

    try:
        return process_fem_from_path(tmp_path, max_frames)
    finally:
        try:
            os.remove(tmp_path)
            logger.info(f"[FEM] Cleaned up temp WebM: {tmp_path}")
        except OSError as e:
            logger.warning(f"[FEM] Failed to clean up temp file {tmp_path}: {e}")


def process_fem_from_path(video_path: str, max_frames: int = 10) -> dict:
    """
    FEM inference from a file path.
    Converts WebM to MP4 using FFmpeg for reliable OpenCV decoding.
    Returns the new response schema expected by Express.
    """
    logger.info(f"[FEM] Starting FEM processing from path: {video_path}, max_frames={max_frames}")
    
    if not os.path.exists(video_path):
        logger.error(f"[FEM] Video file not found: {video_path}")
        raise FileNotFoundError(f"Video file not found: {video_path}")

    # Convert to MP4 if needed (handles WebM → MP4 conversion)
    mp4_path = None
    try:
        mp4_path = _convert_to_mp4(video_path)
        video_to_process = mp4_path
    except ValueError as e:
        logger.error(f"[FEM] FFmpeg conversion failed, will attempt to use original: {e}")
        video_to_process = video_path

    try:
        clf = get_fem_model()
        logger.info(f"[FEM] FEM model loaded successfully")
        
        indexed_frames = sample_frames_from_video(video_to_process, max_frames)

        if not indexed_frames:
            logger.error(f"[FEM] No frames could be extracted from {video_to_process}")
            raise ValueError("No frames could be extracted from the video")

        frame_results = []
        all_emotions = []
        all_confidences = []

        logger.info(f"[FEM] Processing {len(indexed_frames)} frames through emotion model")
        for frame_idx, frame in indexed_frames:
            preds = clf(Image.fromarray(frame))
            if not preds:
                logger.warning(f"[FEM] No predictions for frame {frame_idx}")
                continue

            # Build scores dict from all predictions
            scores = {p["label"].lower(): round(float(p["score"]), 4) for p in preds}
            dominant_raw = preds[0]["label"].lower()
            confidence = float(preds[0]["score"])

            frame_results.append(
                {
                    "frame_index": frame_idx,
                    "dominant_emotion": dominant_raw,
                    "scores": scores,
                }
            )
            all_emotions.append(dominant_raw)
            all_confidences.append(confidence)

        if not frame_results:
            logger.error(f"[FEM] No valid FEM predictions generated from {len(indexed_frames)} frames")
            raise ValueError("No valid FEM predictions generated")

        # Aggregate raw emotions into 7 categories
        emotion_counts = Counter(all_emotions)

        # Map to 3 sentiments using SENTIMENT_MAP
        sentiment_counts = Counter()
        for em, cnt in emotion_counts.items():
            sentiment = SENTIMENT_MAP.get(em, "neutral")
            sentiment_counts[sentiment] += cnt

        total = sum(sentiment_counts.values())
        sentiment_distribution = {
            sent: round((cnt / total) * 100, 2)
            for sent, cnt in sentiment_counts.items()
        }

        dominant_emotion = emotion_counts.most_common(1)[0][0]
        confidence_average = round(sum(all_confidences) / len(all_confidences), 4)

        # Compute expression score (0-100) based on sentiment of dominant emotion
        dominant_sentiment = SENTIMENT_MAP.get(dominant_emotion, "neutral")
        base_score = SENTIMENT_SCORE.get(dominant_sentiment, 60)

        # Weight by confidence
        expression_score = round(
            base_score * 0.7 + confidence_average * 100 * 0.3, 2
        )
        expression_score = max(0.0, min(100.0, expression_score))

        logger.info(
            f"[FEM] SUCCESS: dominant_emotion={dominant_emotion}, "
            f"confidence_avg={confidence_average}, expression_score={expression_score}"
        )

        return {
            "dominant_emotion": dominant_emotion,
            "emotion_distribution": sentiment_distribution,
            "frame_results": frame_results,
            "confidence_average": confidence_average,
            "expression_score": expression_score,
        }
    
    except Exception as e:
        logger.error(f"[FEM] FAILED to process video: {str(e)}")
        raise
    
    finally:
        # Clean up converted MP4 if it exists
        if mp4_path and os.path.exists(mp4_path):
            try:
                os.remove(mp4_path)
                logger.info(f"[FEM] Cleaned up converted MP4: {mp4_path}")
            except OSError as e:
                logger.warning(f"[FEM] Failed to clean up {mp4_path}: {e}")