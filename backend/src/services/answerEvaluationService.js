import { callOpenRouter } from "./openRouterService.js";

const EVAL_MODEL =
  process.env.GEMINI_EVAL_MODEL || "google/gemini-2.5-flash";

/**
 * Build a human-readable FEM summary string from the FEM result object.
 */
function buildFemSummary(femResult) {
  if (!femResult) return "Analisis ekspresi wajah tidak tersedia.";
  const { dominantEmotion, emotionDistribution, confidenceAverage, expressionScore } = femResult;
  const dist = emotionDistribution
    ? Object.entries(emotionDistribution)
        .map(([k, v]) => `${k}: ${v}%`)
        .join(", ")
    : "";
  return (
    `Ekspresi dominan: ${dominantEmotion ?? "tidak diketahui"}. ` +
    (dist ? `Distribusi emosi: ${dist}. ` : "") +
    `Rata-rata confidence: ${confidenceAverage ?? 0}. ` +
    `Skor ekspresi FEM: ${expressionScore ?? "tidak tersedia"}.`
  );
}

/**
 * Evaluate one interview answer using Gemini 2.5 Flash via OpenRouter.
 *
 * @param {object} params
 * @param {string} params.questionText
 * @param {string} params.transcript
 * @param {string} params.jobRole
 * @param {string} params.companyName
 * @param {string} params.cvContext
 * @param {string} params.linksContext
 * @param {object|null} params.femResult
 * @returns {object} Parsed evaluation result
 */
export const evaluateAnswer = async ({
  questionText,
  transcript,
  jobRole,
  companyName,
  cvContext,
  linksContext,
  femResult,
}) => {
  const femSummary = buildFemSummary(femResult);

  const systemPrompt = `Anda adalah evaluator wawancara kerja berbasis AI. Tugas Anda adalah mengevaluasi jawaban kandidat terhadap pertanyaan wawancara.

Berikan evaluasi yang konstruktif, jujur, dan praktis. Fokus pada kualitas jawaban, relevansi, kelengkapan, dan kejelasan komunikasi.

ATURAN PENTING:
- Gunakan Bahasa Indonesia KECUALI jika pertanyaan dan jawaban kandidat jelas dalam Bahasa Inggris.
- Jangan mengarang fakta atau pengalaman yang tidak ada dalam transkrip atau konteks.
- Jika transkrip kosong, sangat pendek, atau tidak relevan, beri skor rendah dan jelaskan alasannya.
- FEM (analisis ekspresi wajah) adalah data tentang ekspresi wajah kandidat selama menjawab. WAJIB gunakan skor ekspresi FEM dan data tersebut untuk mengomentari ekspresi mereka di field "expressionComment". Jelaskan apa yang diindikasikan skor ekspresi dan emosi dominan tentang demeanor kandidat.
- JANGAN tambahkan field "expressionScore" dalam JSON output — skor tersebut sudah dihitung oleh sistem FEM secara otomatis, bukan oleh LLM.
- Skala skor: 0–100.

Return JSON only, tanpa markdown, penjelasan, atau teks tambahan. Schema wajib:
{
  "answerScore": number,
  "communicationScore": number,
  "expressionComment": string,
  "overallQuestionScore": number,
  "strengths": [string],
  "weaknesses": [string],
  "evaluation": string,
  "improvementSuggestions": [string],
  "optimalAnswer": string
}

CATATAN PENTING: Field "expressionComment" HARUS selalu diisi dengan analisis singkat tentang ekspresi dan bahasa tubuh kandidat berdasarkan data FEM yang disediakan. Jangan kosongkan field ini.`;

  const prompt = `Evaluasi jawaban wawancara berikut:

=== INFORMASI POSISI ===
Posisi: ${jobRole || "Tidak disebutkan"}
Perusahaan: ${companyName || "Tidak disebutkan"}

=== PERTANYAAN WAWANCARA ===
${questionText}

=== TRANSKRIP JAWABAN KANDIDAT ===
${transcript || "(Tidak ada transkrip — rekaman mungkin diam atau gagal ditranskripsi)"}

=== KONTEKS CV KANDIDAT ===
${cvContext || "Tidak tersedia."}

=== KONTEKS LOWONGAN / LINK ===
${linksContext || "Tidak tersedia."}

=== HASIL ANALISIS EKSPRESI WAJAH (FEM) ===
${femSummary}

INSTRUKSI KHUSUS: Berdasarkan data FEM di atas, berikan komentar detail di field "expressionComment" tentang ekspresi wajah dan demeanor kandidat.

Berikan evaluasi lengkap sesuai schema JSON yang ditentukan.`;

  try {
    const result = await callOpenRouter(prompt, systemPrompt, EVAL_MODEL);

    // Validate and provide safe fallbacks for all required fields
    const femScore = femResult?.expressionScore != null 
      ? safeScore(femResult.expressionScore)
      : null;
    
    // Log FEM score for debugging
    if (femResult?.expressionScore != null) {
      console.log(`[evaluateAnswer] FEM score: ${femResult.expressionScore}, safeScore result: ${femScore}`);
    } else {
      console.log(`[evaluateAnswer] FEM not available or score missing`);
    }
    
    return {
      answerScore: safeScore(result.answerScore),
      communicationScore: safeScore(result.communicationScore),
      expressionScore: femScore,
      expressionComment: result.expressionComment ?? "",
      overallQuestionScore: safeScore(result.overallQuestionScore),
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      evaluation: result.evaluation ?? "",
      improvementSuggestions: Array.isArray(result.improvementSuggestions)
        ? result.improvementSuggestions
        : [],
      optimalAnswer: result.optimalAnswer ?? "",
      femSummary,
    };
  } catch (error) {
    console.error("Answer evaluation error:", error.message);
    throw error;
  }
};

function safeScore(value, fallback = null) {
  const n = Number(value);
  if (isNaN(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}
