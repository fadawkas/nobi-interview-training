import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Session } from "../models/sessionModel.js";
import { SessionAnswer } from "../models/sessionAnswerModel.js";
import { generateInterviewQuestions } from "../services/questionGenerationService.js";
import { User } from "../models/userModel.js";

/**
 * GET /api/sessions/:sessionId/results
 * Returns session metadata and all answer results (for SessionResult page).
 */
export const getSessionResults = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid sessionId." });
    }

    const [session, answers] = await Promise.all([
      Session.findOne({ _id: sessionId, userId }),
      SessionAnswer.find({ sessionId, userId }).sort({ questionNumber: 1 }),
    ]);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found or access denied." });
    }

    return res.status(200).json({
      success: true,
      data: {
        session,
        answers,
      },
    });
  } catch (error) {
    console.error("getSessionResults error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/sessions/history
 * Returns the user's interview session history.
 */
export const getSessionHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .select(
        "title jobRole companyName sourceType totalQuestions totalScore status createdAt"
      );

    return res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error("getSessionHistory error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/sessions/create
 * Called by SessionSetup after questions are generated.
 * Saves session + questions to MongoDB and returns sessionId.
 */
export const createSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      position,
      company,
      links,
      interviewType,
      difficulty,
      description,
      questionCount,
    } = req.body;

    if (!position) {
      return res.status(400).json({ success: false, message: "Position is required." });
    }
    if (!interviewType) {
      return res.status(400).json({ success: false, message: "Interview type is required." });
    }
    if (!difficulty) {
      return res.status(400).json({ success: false, message: "Difficulty is required." });
    }
    if (!description) {
      return res.status(400).json({ success: false, message: "Description is required." });
    }
    if (!questionCount || questionCount < 1 || questionCount > 15) {
      return res
        .status(400)
        .json({ success: false, message: "Question count must be between 1 and 15." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Generate questions
    const result = await generateInterviewQuestions({
      user,
      position,
      company,
      links: Array.isArray(links) ? links : [],
      interviewType,
      difficulty,
      description,
      questionCount,
    });

    // Map generated questions to session schema format
    const generatedQuestions = (result.questions || []).map((q, idx) => ({
      questionId: q.id ? String(q.id) : uuidv4(),
      questionNumber: idx + 1,
      questionText: q.question,
      category: q.category || "",
      difficulty: difficulty,
    }));

    // Determine sourceType
    const hasLinks = Array.isArray(links) && links.some((l) => l.trim());
    const hasCv = !!user.cv?.filename;
    let sourceType = "manual";
    if (hasCv && hasLinks) sourceType = "cv_and_links";
    else if (hasCv) sourceType = "cv";
    else if (hasLinks) sourceType = "links";

    const session = await Session.create({
      userId,
      title: `${interviewType} Interview – ${position}`,
      jobRole: position,
      companyName: company || "",
      sourceType,
      totalQuestions: generatedQuestions.length,
      generatedQuestions,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        generatedQuestions,
        contextSummary: result.contextSummary,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    console.error("createSession error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create session.",
    });
  }
};

/**
 * DELETE /api/sessions/:sessionId
 * Deletes a session and all related SessionAnswer documents.
 */
export const deleteSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid sessionId." });
    }

    // Verify session exists and belongs to user
    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found or access denied." });
    }

    // Delete all related SessionAnswer documents
    await SessionAnswer.deleteMany({ sessionId, userId });

    // Delete the session
    await Session.deleteOne({ _id: sessionId, userId });

    return res.status(200).json({
      success: true,
      message: "Session deleted successfully.",
    });
  } catch (error) {
    console.error("deleteSession error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
