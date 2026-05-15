import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  createSession,
  getSessionResults,
  getSessionHistory,
  deleteSession,
} from "../controllers/sessionController.js";

const router = Router();

router.use(requireAuth);

// POST /api/sessions/create  — generate questions + save session to MongoDB
router.post("/create", createSession);

// GET /api/sessions/history  — list user's past sessions (must be before :sessionId)
router.get("/history", getSessionHistory);

// GET /api/sessions/:sessionId/results  — full results for SessionResult page
router.get("/:sessionId/results", getSessionResults);

// DELETE /api/sessions/:sessionId  — delete session and related answers
router.delete("/:sessionId", deleteSession);

export default router;
