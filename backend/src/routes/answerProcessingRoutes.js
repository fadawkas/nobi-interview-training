import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { uploadAnswerVideo } from "../middlewares/uploadMiddleware.js";
import { submitAnswer } from "../controllers/answerProcessingController.js";

const router = Router();

router.use(requireAuth);

// POST /api/answers/submit  — upload video + enqueue Agenda job
router.post("/submit", uploadAnswerVideo.single("video"), submitAnswer);

export default router;
