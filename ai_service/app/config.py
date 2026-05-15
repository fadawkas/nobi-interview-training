import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

APP_NAME = os.getenv("APP_NAME", "NobiAI AI Service")
APP_ENV = os.getenv("APP_ENV", "development")
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", 8000))

ASR_MODEL_NAME = os.getenv("ASR_MODEL_NAME", "cahya/faster-whisper-medium-id")
ASR_DEVICE = os.getenv("ASR_DEVICE", "cpu")
ASR_COMPUTE_TYPE = os.getenv("ASR_COMPUTE_TYPE", "int8")
ASR_BEAM_SIZE = int(os.getenv("ASR_BEAM_SIZE", 5))
ASR_USE_VAD = os.getenv("ASR_USE_VAD", "true").lower() == "true"
ASR_LANGUAGE = os.getenv("ASR_LANGUAGE", "id")

FEM_MODEL_NAME = os.getenv("FEM_MODEL_NAME", "dima806/facial_emotions_image_detection")
FEM_DEVICE = int(os.getenv("FEM_DEVICE", "-1"))
MAX_FEM_FRAMES = int(os.getenv("MAX_FEM_FRAMES", 10))