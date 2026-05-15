import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { Session } from "../models/sessionModel.js";
import { SessionAnswer } from "../models/sessionAnswerModel.js";
import {
  getVideoDir,
  buildMediaFilename,
  ensureMediaDirs,
} from "../services/mediaService.js";
import { enqueueProcessAnswerJob } from "../jobs/processAnswerJob.js";

/**
 * POST /api/answers/submit
 * multipart/form-data: sessionId, questionId, questionNumber, questionText, video (file)
 */
export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user._id;

    const { sessionId, questionId, questionNumber, questionText } = req.body;

    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid sessionId." });
    }
    if (!questionId) {
      return res.status(400).json({ success: false, message: "questionId is required." });
    }
    if (!questionNumber || isNaN(Number(questionNumber))) {
      return res.status(400).json({ success: false, message: "questionNumber is required." });
    }
    if (!questionText) {
      return res.status(400).json({ success: false, message: "questionText is required." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file uploaded." });
    }

    const qNum = Number(questionNumber);

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found or access denied." });
    }

    const matchedQuestion = session.generatedQuestions.find(
      (q) => q.questionId === questionId && q.questionNumber === qNum
    );
    if (!matchedQuestion) {
      return res.status(400).json({
        success: false,
        message: `Question ${questionNumber} (id: ${questionId}) not found in this session.`,
      });
    }

    let answerDoc;
    try {
      answerDoc = await SessionAnswer.findOneAndUpdate(
        { sessionId, questionNumber: qNum },
        {
          $setOnInsert: {
            sessionId,
            userId,
            questionId,
            questionNumber: qNum,
            questionText,
            processingStatus: "queued",
            processingError: "",
          },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      // If duplicate key — another request already created it; fetch it
      if (err.code === 11000) {
        answerDoc = await SessionAnswer.findOne({ sessionId, questionNumber: qNum });
      } else {
        throw err;
      }
    }

    const answerId = answerDoc._id.toString();

    ensureMediaDirs();
    const ext =
      req.file.originalname.match(/\.(webm|mp4|mov|mkv|ogv)$/i)?.[1] ?? "webm";
    const videoFilename = buildMediaFilename(sessionId, answerId, qNum, ext);
    const videoAbsPath = path.join(getVideoDir(), videoFilename);

    fs.writeFileSync(videoAbsPath, req.file.buffer);

    const videoRelPath = path.join("shared_data", "video", videoFilename);

    await SessionAnswer.findByIdAndUpdate(answerId, {
      videoPath: videoRelPath,
      processingStatus: "queued",
      processingError: "",
      transcript: "",
      asrMetadata: null,
      femResult: null,
      femSummary: "",
      answerEvaluation: null,
      answerScore: null,
      communicationScore: null,
      expressionScore: null,
      overallQuestionScore: null,
      optimalAnswer: "",
    });

    await Session.findByIdAndUpdate(sessionId, { status: "processing" });

    await enqueueProcessAnswerJob({
      answerId,
      sessionId,
      userId: userId.toString(),
      questionNumber: qNum,
    });

    return res.status(202).json({
      success: true,
      message: "Answer uploaded and queued for processing.",
      answerId,
      sessionId,
      questionNumber: qNum,
      processingStatus: "queued",
    });
  } catch (error) {
    console.error("submitAnswer error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit answer.",
    });
  }
};

