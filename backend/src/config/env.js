import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "supersecretkey",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://ai_service:8000",
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb://root:example@localhost:27017/nobiai?authSource=admin",
  geminiEvalModel: process.env.GEMINI_EVAL_MODEL || "google/gemini-2.5-flash",
  agendaConcurrency: Number(process.env.AGENDA_CONCURRENCY) || 2,
  sharedDataDir: process.env.SHARED_DATA_DIR || "../shared_data",
};