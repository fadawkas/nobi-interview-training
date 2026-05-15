import path from "path";
import { SessionAnswer } from "../models/sessionAnswerModel.js";
import { Session } from "../models/sessionModel.js";
import { User } from "../models/userModel.js";
import {
  getVideoDir,
  getAudioDir,
  buildMediaFilename,
  extractAudio,
  resolveMediaPath,
} from "../services/mediaService.js";
import { callAsrTranscribe, callFemAnalyzeVideo } from "../services/aiService.js";
import { evaluateAnswer } from "../services/answerEvaluationService.js";
import { getCvContext } from "../services/cvContextService.js";
import { getAgenda } from "../services/agendaService.js";

export const JOB_NAME = "process-answer";

/**
 * Define and register the process-answer Agenda job.
 * Call this once at startup after getAgenda() is initialized.
 */
export function defineProcessAnswerJob() {
  const agenda = getAgenda();

  agenda.define(
    JOB_NAME,
    { concurrency: Number(process.env.AGENDA_CONCURRENCY) || 2 },
    async (job) => {
      const { answerId, sessionId } = job.attrs.data;

      const answer = await SessionAnswer.findById(answerId);
      if (!answer) {
        throw new Error(`SessionAnswer not found: ${answerId}`);
      }

      await SessionAnswer.findByIdAndUpdate(answerId, {
        processingStatus: "processing",
        processingError: "",
      });

      let audioRelPath = "";
      try {
        const videoAbsPath = resolveMediaPath(answer.videoPath);
        const audioFilename = buildMediaFilename(
          sessionId,
          answerId,
          answer.questionNumber,
          "wav"
        );
        const audioAbsPath = path.join(getAudioDir(), audioFilename);

        await extractAudio(videoAbsPath, audioAbsPath);

        audioRelPath = path.join("shared_data", "audio", audioFilename);
        await SessionAnswer.findByIdAndUpdate(answerId, {
          audioPath: audioRelPath,
          processingStatus: "audio_extracted",
        });
      } catch (err) {
        console.error(`[process-answer] Audio extraction failed for ${answerId}:`, err.message);
        await SessionAnswer.findByIdAndUpdate(answerId, {
          processingStatus: "failed",
          processingError: `Audio extraction failed: ${err.message}`,
        });
        return;
      }

      let transcript = "";
      let asrMetadata = null;
      try {
        const audioAbsPath = resolveMediaPath(audioRelPath);
        const asrResult = await callAsrTranscribe(audioAbsPath);
        transcript = asrResult.transcript;
        asrMetadata = asrResult.metadata;

        await SessionAnswer.findByIdAndUpdate(answerId, {
          transcript,
          asrMetadata,
          processingStatus: "asr_completed",
        });
      } catch (err) {
        console.error(`[process-answer] ASR failed for ${answerId}:`, err.message);
        // Continue evaluation with empty transcript — don't hard-fail
        await SessionAnswer.findByIdAndUpdate(answerId, {
          processingError: `ASR failed: ${err.message}`,
        });
      }

      let femResult = null;
      let femSummary = "";
      try {
        const videoAbsPath = resolveMediaPath(answer.videoPath);
        const maxFrames = Number(process.env.MAX_FEM_FRAMES) || 10;
        console.log(`[process-answer] Starting FEM for ${answerId}, video: ${videoAbsPath}`);
        femResult = await callFemAnalyzeVideo(videoAbsPath, maxFrames);
        console.log(`[process-answer] FEM succeeded for ${answerId}: score=${femResult?.expressionScore}, emotion=${femResult?.dominantEmotion}`);
        femSummary = femResult
          ? `Ekspresi dominan: ${femResult.dominantEmotion}. Skor ekspresi: ${femResult.expressionScore}.`
          : "";

        await SessionAnswer.findByIdAndUpdate(answerId, {
          femResult,
          femSummary,
          processingStatus: "fem_completed",
        });
      } catch (err) {
        const femDetail = err.response?.data?.detail ?? err.message;
        console.error(
          `[process-answer] FEM FAILED answerId=${answerId} video=${resolveMediaPath(answer.videoPath)}:`,
          femDetail
        );
        // Continue with null FEM — evaluation will use transcript only
        await SessionAnswer.findByIdAndUpdate(answerId, {
          processingError: `FEM failed: ${err.message}`,
        });
      }

      await SessionAnswer.findByIdAndUpdate(answerId, {
        processingStatus: "evaluating",
      });

      try {
        // Load session + user for context
        const [session, user] = await Promise.all([
          Session.findById(sessionId),
          SessionAnswer.findById(answerId).then((a) =>
            User.findById(a.userId)
          ),
        ]);

        const cvContext = user ? await getCvContext(user) : "";

        const evalResult = await evaluateAnswer({
          questionText: answer.questionText,
          transcript,
          jobRole: session?.jobRole ?? "",
          companyName: session?.companyName ?? "",
          cvContext,
          linksContext: "",
          femResult,
        });

        await SessionAnswer.findByIdAndUpdate(answerId, {
          answerEvaluation: {
            strengths: evalResult.strengths,
            weaknesses: evalResult.weaknesses,
            evaluation: evalResult.evaluation,
            improvementSuggestions: evalResult.improvementSuggestions,
          },
          answerScore: evalResult.answerScore,
          communicationScore: evalResult.communicationScore,
          expressionScore: evalResult.expressionScore,
          expressionComment: evalResult.expressionComment,
          overallQuestionScore: evalResult.overallQuestionScore,
          optimalAnswer: evalResult.optimalAnswer,
          femSummary: evalResult.femSummary || femSummary,
          processingStatus: "completed",
          processingError: "",
        });
      } catch (err) {
        console.error(`[process-answer] Evaluation failed for ${answerId}:`, err.message);
        await SessionAnswer.findByIdAndUpdate(answerId, {
          processingStatus: "failed",
          processingError: `Evaluation failed: ${err.message}`,
        });
        return;
      }

      try {
        await updateSessionSummary(sessionId);
      } catch (err) {
        console.error(`[process-answer] Session summary update failed for ${sessionId}:`, err.message);
      }
    }
  );
}

/**
 * Recalculate and update the session's totalScore and status
 * based on all answer records.
 */
async function updateSessionSummary(sessionId) {
  const session = await Session.findById(sessionId);
  if (!session) return;

  const answers = await SessionAnswer.find({ sessionId });
  if (answers.length === 0) return;

  const totalExpected = session.totalQuestions;
  const completed = answers.filter((a) => a.processingStatus === "completed");
  const failed = answers.filter((a) => a.processingStatus === "failed");
  const inProgress = answers.filter(
    (a) => !["completed", "failed"].includes(a.processingStatus)
  );

  const allDone = inProgress.length === 0 && answers.length >= totalExpected;

  let totalScore = null;
  let overallEvaluation = "";
  let status = "processing";

  if (allDone) {
    status = "completed";

    if (completed.length > 0) {
      const scores = completed
        .map((a) => a.overallQuestionScore)
        .filter((s) => s !== null && s !== undefined);

      if (scores.length > 0) {
        totalScore = Math.round(
          scores.reduce((sum, s) => sum + s, 0) / scores.length
        );
      }
    }

    if (failed.length > 0) {
      overallEvaluation = `${completed.length} jawaban berhasil dievaluasi, ${failed.length} jawaban gagal diproses.`;
    } else {
      overallEvaluation = `Semua ${completed.length} jawaban telah berhasil dievaluasi.`;
    }
  }

  await Session.findByIdAndUpdate(sessionId, {
    totalScore,
    overallEvaluation,
    status,
  });
}

/**
 * Enqueue a process-answer job.
 */
export async function enqueueProcessAnswerJob({ answerId, sessionId, userId, questionNumber }) {
  const agenda = getAgenda();
  await agenda.now(JOB_NAME, { answerId, sessionId, userId, questionNumber });
}
