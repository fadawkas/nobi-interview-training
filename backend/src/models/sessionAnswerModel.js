import mongoose from "mongoose";

const sessionAnswerSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionId: { type: String, required: true },
    questionNumber: { type: Number, required: true },
    questionText: { type: String, required: true },

    // Media paths (relative)
    videoPath: { type: String, default: "" },
    audioPath: { type: String, default: "" },

    // ASR output
    transcript: { type: String, default: "" },
    asrMetadata: { type: mongoose.Schema.Types.Mixed, default: null },

    // FEM output
    femResult: { type: mongoose.Schema.Types.Mixed, default: null },
    femSummary: { type: String, default: "" },

    // Gemini evaluation output
    answerEvaluation: { type: mongoose.Schema.Types.Mixed, default: null },
    answerScore: { type: Number, default: null },
    communicationScore: { type: Number, default: null },
    expressionScore: { type: Number, default: null },
    expressionComment: { type: String, default: "" },
    overallQuestionScore: { type: Number, default: null },
    optimalAnswer: { type: String, default: "" },

    // Processing pipeline state
    processingStatus: {
      type: String,
      enum: [
        "queued",
        "processing",
        "audio_extracted",
        "asr_completed",
        "fem_completed",
        "evaluating",
        "completed",
        "failed",
      ],
      default: "queued",
    },
    processingError: { type: String, default: "" },
  },
  { timestamps: true }
);

// Unique constraint: one answer per question per session
sessionAnswerSchema.index(
  { sessionId: 1, questionNumber: 1 },
  { unique: true }
);

export const SessionAnswer = mongoose.model(
  "SessionAnswer",
  sessionAnswerSchema
);
