import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { env } from "../config/env.js";

const aiApi = axios.create({
  baseURL: env.aiServiceUrl,
  timeout: 1000 * 60 * 10, // 10 min — ASR/FEM can be slow
});

/**
 * POST /asr/transcribe
 * Sends audio file as multipart upload.
 * Returns { transcript, metadata: { modelName, language, duration, latency } }
 */
export const callAsrTranscribe = async (audioAbsPath) => {
  const form = new FormData();
  form.append("audio_file", fs.createReadStream(audioAbsPath));

  const startTime = Date.now();
  const response = await aiApi.post("/asr/transcribe", form, {
    headers: form.getHeaders(),
    timeout: 1000 * 60 * 10,
  });

  const latency = (Date.now() - startTime) / 1000;
  const data = response.data;

  return {
    transcript: data.transcript ?? "",
    metadata: {
      modelName: data.metadata?.model_name ?? "",
      language: data.metadata?.language ?? "",
      duration: data.metadata?.duration ?? null,
      latency,
    },
  };
};

/**
 * POST /fem/analyze-video
 * Sends video file as multipart upload.
 * Returns { dominantEmotion, emotionDistribution, frameResults, confidenceAverage, expressionScore }
 */
export const callFemAnalyzeVideo = async (videoAbsPath, maxFrames = 10) => {
  const form = new FormData();
  form.append("video_file", fs.createReadStream(videoAbsPath));
  form.append("max_frames", String(maxFrames));

  try {
    const response = await aiApi.post("/fem/analyze-video", form, {
      headers: form.getHeaders(),
      timeout: 1000 * 60 * 10,
    });

    const data = response.data;

    return {
      dominantEmotion: data.dominant_emotion ?? "neutral",
      emotionDistribution: data.emotion_distribution ?? {},
      frameResults: data.frame_results ?? [],
      confidenceAverage: data.confidence_average ?? 0,
      expressionScore: data.expression_score ?? null,
    };
  } catch (error) {
    const detail = error.response?.data?.detail ?? error.message;
    const message = `FEM API failed: ${detail}`;
    console.error(`[callFemAnalyzeVideo] ${message}`);
    throw new Error(message);
  }
};

