import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import answerProcessingRoutes from "./routes/answerProcessingRoutes.js";
import { getVideoDir, getAudioDir } from "./services/mediaService.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "NobiAI Backend",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/answers", answerProcessingRoutes);

// Serve CV uploads statically
const uploadDir = process.env.UPLOAD_PATH || path.resolve(process.cwd(), "../shared_data/cv");
app.use("/uploads/cv", express.static(uploadDir));

// Serve video and audio files statically
app.use("/media/video", express.static(getVideoDir()));
app.use("/media/audio", express.static(getAudioDir()));

export default app;