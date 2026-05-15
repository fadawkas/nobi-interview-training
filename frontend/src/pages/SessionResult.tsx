import { useEffect, useState, useCallback, useRef } from "react"
import { Link, useParams } from "react-router-dom"

import Navbar from "../components/Navbar"
import { getApiBaseUrl } from "../lib/apiBase"

const dashboardNavItems = [
  { label: "Latihan", to: "/session/setup" },
  { label: "Riwayat", to: "/history" },
]

// Statuses that mean evaluation is still running
const PENDING_STATUSES = new Set([
  "queued",
  "processing",
  "audio_extracted",
  "asr_completed",
  "fem_completed",
  "evaluating",
])

type ProcessingStatus =
  | "queued"
  | "processing"
  | "audio_extracted"
  | "asr_completed"
  | "fem_completed"
  | "evaluating"
  | "completed"
  | "failed"

type AnswerEvaluation = {
  strengths: string[]
  weaknesses: string[]
  evaluation: string
  improvementSuggestions: string[]
}

type SessionAnswer = {
  _id: string
  questionNumber: number
  questionText: string
  transcript: string
  videoPath?: string
  audioPath?: string
  asrMetadata: { modelName: string; language: string; duration: number | null } | null
  femResult: {
    dominantEmotion: string
    emotionDistribution: {
      positive?: number
      neutral?: number
      negative?: number
    }
    confidenceAverage: number
    expressionScore: number
  } | null
  femSummary: string
  answerEvaluation: AnswerEvaluation | null
  answerScore: number | null
  communicationScore: number | null
  expressionScore: number | null
  expressionComment: string
  overallQuestionScore: number | null
  optimalAnswer: string
  processingStatus: ProcessingStatus
  processingError: string
}

type SessionData = {
  _id: string
  title: string
  jobRole: string
  companyName: string
  totalQuestions: number
  totalScore: number | null
  overallEvaluation: string
  status: string
  generatedQuestions: Array<{
    questionId: string
    questionNumber: number
    questionText: string
    category: string
  }>
}

type ResultData = {
  session: SessionData
  answers: SessionAnswer[]
}

function statusLabel(status: ProcessingStatus): string {
  switch (status) {
    case "queued": return "Menunggu antrian…"
    case "processing": return "Memproses…"
    case "audio_extracted": return "Audio diekstrak, mentranskripsi…"
    case "asr_completed": return "Transkripsi selesai, analisis ekspresi…"
    case "fem_completed": return "Analisis ekspresi selesai, mengevaluasi…"
    case "evaluating": return "Mengevaluasi jawaban…"
    case "completed": return "Selesai"
    case "failed": return "Gagal diproses"
    default: return status
  }
}

function ScorePill({
  label,
  value,
  accent = false,
}: {
  label: string
  value: number | null
  accent?: boolean
}) {
  return (
    <div
      className={`rounded border px-4 py-3 text-center ${
        accent
          ? "border-[#E9F5FE] bg-[#E9F5FE]"
          : "border-[#E8E8E6] bg-white"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-[#086DDD]" : "text-[#B3B0A9]"}`}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[#37352F]">
        {value !== null && value !== undefined ? value : "—"}
      </p>
    </div>
  )
}

function ProcessingCard({ answer }: { answer: SessionAnswer }) {
  const [showMedia, setShowMedia] = useState(false)
  const hasMedia = answer.videoPath || answer.audioPath

  return (
    <div className="rounded border border-[#E8E8E6] bg-white p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-[#37352F] px-3 text-sm font-semibold text-white">
          {answer.questionNumber}
        </span>
        <h3 className="text-base font-semibold leading-snug text-[#37352F] sm:text-lg">
          {answer.questionText}
        </h3>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded border border-[#E8E8E6] bg-[#F7F6F3] px-4 py-2.5">
        {answer.processingStatus !== "failed" ? (
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#DADAD8] border-t-[#37352F]" />
        ) : (
          <span className="inline-block h-4 w-4 shrink-0 rounded-full bg-[#EB5647]" />
        )}
        <p className="text-sm font-medium text-[#37352F]">
          {statusLabel(answer.processingStatus)}
        </p>
      </div>

      {answer.processingError ? (
        <p className="mt-3 text-xs text-[#EB5647]">{answer.processingError}</p>
      ) : null}

      {/* Media Toggle */}
      {hasMedia && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowMedia((v) => !v)}
            className="inline-flex items-center gap-2 rounded border border-[#DADAD8] bg-[#F7F6F3] px-3 py-2 text-sm font-medium text-[#787774] transition hover:bg-[#F1F1EF]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${showMedia ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            {showMedia ? "Sembunyikan Rekaman" : "Lihat Rekaman"}
          </button>

          {showMedia && (
            <div className="mt-3 space-y-3">
              {answer.videoPath && (
                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
                    Rekaman Video
                  </p>
                  <video controls className="w-full rounded" src={`${getApiBaseUrl()}/media/video/${answer.videoPath.replace(/^shared_data\/video\//, '')}`} />
                </div>
              )}
              {answer.audioPath && (
                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
                    Rekaman Audio
                  </p>
                  <audio controls className="w-full" src={`${getApiBaseUrl()}/media/audio/${answer.audioPath.replace(/^shared_data\/audio\//, '')}`} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CompletedCard({ answer }: { answer: SessionAnswer }) {
  const [showOptimal, setShowOptimal] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const hasMedia = answer.videoPath || answer.audioPath

  return (
    <article className="rounded border border-[#E8E8E6] bg-white p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-[#37352F] px-3 text-sm font-semibold text-white">
          {answer.questionNumber}
        </span>
        <h3 className="text-base font-semibold leading-snug text-[#37352F] sm:text-lg">
          {answer.questionText}
        </h3>
      </div>

      {/* Scores */}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <ScorePill label="Skor jawaban" value={answer.answerScore} />
        <ScorePill label="Komunikasi" value={answer.communicationScore} />
        <ScorePill label="Ekspresi" value={answer.expressionScore} />
        <ScorePill label="Skor overall" value={answer.overallQuestionScore} accent />
      </div>

      {/* Media Toggle */}
      {hasMedia && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowMedia((v) => !v)}
            className="inline-flex items-center gap-2 rounded border border-[#DADAD8] bg-[#F7F6F3] px-3 py-2 text-sm font-medium text-[#787774] transition hover:bg-[#F1F1EF]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${showMedia ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            {showMedia ? "Sembunyikan Rekaman" : "Lihat Rekaman"}
          </button>

          {showMedia && (
            <div className="mt-3 space-y-3">
              {answer.videoPath && (
                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
                    Rekaman Video
                  </p>
                  <video controls className="w-full rounded" src={`${getApiBaseUrl()}/media/video/${answer.videoPath.replace(/^shared_data\/video\//, '')}`} />
                </div>
              )}
              {answer.audioPath && (
                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
                    Rekaman Audio
                  </p>
                  <audio controls className="w-full" src={`${getApiBaseUrl()}/media/audio/${answer.audioPath.replace(/^shared_data\/audio\//, '')}`} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transcript */}
      {answer.transcript && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
            Transkrip Jawaban
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#37352F]">
            {answer.transcript}
          </p>
          {answer.asrMetadata?.duration && (
            <p className="mt-1 text-xs text-[#B3B0A9]">
              Durasi: {Math.round(answer.asrMetadata.duration)}s · Bahasa: {answer.asrMetadata.language}
            </p>
          )}
        </div>
      )}

      {/* FEM */}
      {answer.femResult && (
        <div className="mt-5 rounded border border-[#E8E8E6] bg-[#F7F6F3] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
            Analisis Ekspresi Wajah
          </p>
          <p className="mt-1.5 text-sm text-[#37352F]">
            Ekspresi dominan:{" "}
            <span className="font-medium capitalize">{answer.femResult.dominantEmotion}</span>
            {" · "}Confidence rata-rata:{" "}
            <span className="font-medium">{(answer.femResult.confidenceAverage * 100).toFixed(1)}%</span>
          </p>
          {answer.femSummary && (
            <p className="mt-1.5 text-xs text-[#787774]">{answer.femSummary}</p>
          )}
          {answer.expressionComment && (
            <p className="mt-1.5 text-sm text-[#37352F]">{answer.expressionComment}</p>
          )}
        </div>
      )}

      {/* Evaluation */}
      {answer.answerEvaluation && (
        <>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
              Evaluasi Jawaban
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#37352F]">
              {answer.answerEvaluation.evaluation}
            </p>
          </div>

          {answer.answerEvaluation.strengths?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0B8A70]">
                Kekuatan
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {answer.answerEvaluation.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-[#37352F]">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {answer.answerEvaluation.weaknesses?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#EB5647]">
                Area Peningkatan
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {answer.answerEvaluation.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-[#37352F]">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {answer.answerEvaluation.improvementSuggestions?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#086DDD]">
                Saran Peningkatan
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {answer.answerEvaluation.improvementSuggestions.map((s, i) => (
                  <li key={i} className="text-sm text-[#37352F]">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Optimal answer */}
      {answer.optimalAnswer && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowOptimal((v) => !v)}
            className="rounded bg-[#37352F] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90"
          >
            {showOptimal ? "Sembunyikan Jawaban Optimal" : "Lihat Jawaban Optimal"}
          </button>
          {showOptimal && (
            <div className="mt-4 rounded border border-[#E9F5FE] bg-[#E9F5FE] p-5">
              <p className="text-sm font-semibold text-[#086DDD]">JAWABAN OPTIMAL</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#37352F]">
                {answer.optimalAnswer}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function SessionResults() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchResults = useCallback(async () => {
    if (!sessionId) return
    try {
      const token = localStorage.getItem("nobiai_auth_token")
      const res = await fetch(`${getApiBaseUrl()}/api/sessions/${sessionId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || "Gagal memuat hasil.")
      setData(json.data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    void fetchResults()
  }, [fetchResults])

  // Poll while any answer is still in progress
  useEffect(() => {
    if (!data) return

    const hasInProgress = data.answers.some((a) => PENDING_STATUSES.has(a.processingStatus))

    if (hasInProgress) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          void fetchResults()
        }, 5000)
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [data, fetchResults])

  // Build lookup: questionNumber → answer
  const answerMap = new Map<number, SessionAnswer>(
    (data?.answers ?? []).map((a) => [a.questionNumber, a])
  )

  const session = data?.session

  const allComplete = data
    ? data.answers.length > 0 && data.answers.every((a) => !PENDING_STATUSES.has(a.processingStatus))
    : false

  const completedAnswers = data?.answers.filter((a) => a.processingStatus === "completed") ?? []
  const avgExpression =
    completedAnswers.length > 0
      ? Math.round(
          completedAnswers.reduce((s, a) => s + (a.expressionScore ?? 0), 0) /
            completedAnswers.length
        )
      : null
  const avgAnswer =
    completedAnswers.length > 0
      ? Math.round(
          completedAnswers.reduce((s, a) => s + (a.answerScore ?? 0), 0) /
            completedAnswers.length
        )
      : null

  return (
    <div className="page-bg text-[#37352F]">
      <Navbar navItems={dashboardNavItems} />

      <main className="page-container">
        {/* Header actions */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#787774]">
            Evaluasi menggabungkan kualitas jawaban lisan dan analisis ekspresi wajah.
            {!allComplete && data && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded border border-[#E9F5FE] bg-[#E9F5FE] px-2.5 py-0.5 text-xs font-medium text-[#086DDD]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#086DDD]" />
                Sedang memproses…
              </span>
            )}
          </p>
          <Link
            to="/dashboard"
            className="rounded border border-[#DADAD8] bg-transparent px-4 py-2 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF]"
          >
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Loading */}
        {loading && !data && (
          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DADAD8] border-t-[#37352F]" />
            <p className="text-sm text-[#787774]">Memuat hasil sesi…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded border border-[#FDE8E8] bg-[#FDE8E8] px-4 py-3 text-sm text-[#C33D31]">
            {error}
          </div>
        )}

        {/* Summary section */}
        {session && (
          <section className="mt-6 rounded border border-[#E8E8E6] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
              Hasil Sesi
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#37352F] sm:text-3xl">
              Ringkasan evaluasi wawancara
            </h1>
            {session.title && (
              <p className="mt-2 text-base font-medium text-[#37352F]">{session.title}</p>
            )}
            {(session.jobRole || session.companyName) && (
              <p className="mt-1 text-sm text-[#787774]">
                {session.jobRole}
                {session.jobRole && session.companyName ? " · " : ""}
                {session.companyName}
              </p>
            )}
            <p className="mt-3 text-base leading-relaxed text-[#787774]">
              Hasil ini memadukan penilaian kualitas jawaban Anda dan sinyal ekspresi wajah selama
              sesi, lalu dirangkum dalam skor keseluruhan dan umpan balik dari model bahasa.
            </p>

            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col items-start">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
                  Skor sesi
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold tracking-tight text-[#37352F] sm:text-6xl">
                    {session.totalScore !== null && session.totalScore !== undefined
                      ? session.totalScore
                      : allComplete
                        ? "—"
                        : "…"}
                  </span>
                  <span className="text-lg font-medium text-[#B3B0A9]">/100</span>
                </div>
                <p className="mt-1.5 text-sm text-[#787774]">
                  {session.status === "completed"
                    ? "Gabungan skor jawaban dan ekspresi"
                    : "Menunggu semua jawaban selesai diproses"}
                </p>
              </div>

              <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:max-w-none sm:grid-cols-3 lg:w-auto">
                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] px-4 py-3 text-center">
                  <p className="text-xs font-medium text-[#B3B0A9]">Pertanyaan</p>
                  <p className="mt-1 text-2xl font-semibold text-[#37352F]">
                    {session.totalQuestions}
                  </p>
                </div>
                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] px-4 py-3 text-center">
                  <p className="text-xs font-medium text-[#B3B0A9]">Rata-rata ekspresi</p>
                  <p className="mt-1 text-2xl font-semibold text-[#37352F]">
                    {avgExpression !== null ? avgExpression : "—"}
                  </p>
                </div>
                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] px-4 py-3 text-center">
                  <p className="text-xs font-medium text-[#B3B0A9]">Rata-rata jawaban</p>
                  <p className="mt-1 text-2xl font-semibold text-[#37352F]">
                    {avgAnswer !== null ? avgAnswer : "—"}
                  </p>
                </div>
              </div>
            </div>

            {session.overallEvaluation && (
              <div className="mt-8 rounded border border-[#E9F5FE] bg-[#E9F5FE] p-5">
                <p className="text-sm font-semibold text-[#086DDD]">Evaluasi Overall</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#37352F]">
                  {session.overallEvaluation}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Per-question results */}
        {session && (
          <section className="mt-10">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
                Detail per pertanyaan
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#37352F] sm:text-2xl">
                Hasil tiap pertanyaan
              </h2>
            </div>

            {session.generatedQuestions.map((q) => {
              const answer = answerMap.get(q.questionNumber)

              if (!answer) {
                return (
                  <div
                    key={q.questionId}
                    className="mt-4 rounded border border-[#E8E8E6] bg-white p-6 opacity-60"
                  >
                    <div className="flex gap-3">
                      <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-[#E8E8E6] px-3 text-sm font-semibold text-[#787774]">
                        {q.questionNumber}
                      </span>
                      <p className="text-sm font-medium text-[#787774]">{q.questionText}</p>
                    </div>
                    <p className="mt-3 text-sm text-[#B3B0A9]">Belum ada jawaban untuk pertanyaan ini.</p>
                  </div>
                )
              }

              if (answer.processingStatus === "completed") {
                return <CompletedCard key={q.questionId} answer={answer} />
              }

              return <ProcessingCard key={q.questionId} answer={answer} />
            })}
          </section>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard"
            className="rounded bg-[#37352F] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90"
          >
            Kembali ke Dashboard
          </Link>
          <Link
            to="/history"
            className="rounded border border-[#DADAD8] bg-transparent px-6 py-2.5 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF]"
          >
            Lihat Riwayat
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#E8E8E6] px-4 py-6 text-center text-xs text-[#B3B0A9] sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} NobiAI</span>
      </footer>
    </div>
  )
}

export default SessionResults