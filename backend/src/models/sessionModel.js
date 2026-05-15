import mongoose from "mongoose";

const generatedQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionNumber: { type: Number, required: true },
    questionText: { type: String, required: true },
    category: { type: String, default: "" },
    difficulty: { type: String, default: "" },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "Interview Practice Session" },
    jobRole: { type: String, default: "" },
    companyName: { type: String, default: "" },
    sourceType: { type: String, default: "" },
    totalQuestions: { type: Number, required: true },
    generatedQuestions: { type: [generatedQuestionSchema], default: [] },
    totalScore: { type: Number, default: null },
    overallEvaluation: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "processing", "completed", "failed"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
