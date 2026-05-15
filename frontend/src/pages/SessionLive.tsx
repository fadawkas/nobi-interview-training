import { useEffect, useRef, useState, useCallback } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"

import Navbar from "../components/Navbar"
import { getApiBaseUrl } from "../lib/apiBase"

const dashboardNavItems = [
  { label: "Latihan", to: "/session/setup" },
  { label: "Riwayat", to: "/history" },
]

type RecordingState = "idle" | "recording" | "stopped"
type SessionPhase = "overview" | "live" | "completed"

type SessionQuestion = {
  questionId: string
  questionNumber: number
  questionText: string
  category: string
  difficulty?: string
}

type SubmittedAnswer = {
  answerId: string
  questionNumber: number
  processingStatus: string
}

function pickRecorderMimeType(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ]
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c
    }
  }
  return undefined
}

function SessionLive() {
  const navigate = useNavigate()
  const location = useLocation()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const blobUrlsRef = useRef<string[]>([])
  const liveMountIdRef = useRef(0)

  const [phase, setPhase] = useState<SessionPhase>("overview")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [submittedAnswers, setSubmittedAnswers] = useState<SubmittedAnswer[]>([])
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [recorderError, setRecorderError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // State from navigation
  const sessionId: string = location.state?.sessionId ?? ""
  const sessionQuestions: SessionQuestion[] = location.state?.questions ?? []

  useEffect(() => {
    if (sessionQuestions.length === 0 || !sessionId) {
      navigate("/session/setup")
    }
  }, [sessionQuestions, sessionId, navigate])

  const totalQuestions = sessionQuestions.length
  const currentQuestion = sessionQuestions[currentQuestionIndex]
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

  // ── Blob URL tracking ──────────────────────────────────────────────────────
  function trackBlobUrl(url: string) {
    blobUrlsRef.current.push(url)
  }
  function revokeBlobUrl(url: string) {
    URL.revokeObjectURL(url)
    blobUrlsRef.current = blobUrlsRef.current.filter((u) => u !== url)
  }
  function revokeAllBlobUrls() {
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    blobUrlsRef.current = []
  }

  useEffect(() => () => revokeAllBlobUrls(), [])

  // Navigate to results when phase = completed
  useEffect(() => {
    if (phase !== "completed") return
    const t = window.setTimeout(() => {
      navigate(`/results/${sessionId}`)
    }, 1800)
    return () => window.clearTimeout(t)
  }, [phase, navigate, sessionId])

  // ── Camera lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "live") return

    liveMountIdRef.current += 1
    let stream: MediaStream | null = null
    let cancelled = false

    setCameraError(null)
    setCameraReady(false)
    setRecorderError(null)

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setCameraError("Peramban Anda tidak mendukung akses kamera.")
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        mediaStreamRef.current = stream
        const el = videoRef.current
        if (el) {
          el.srcObject = stream
          await el.play().catch(() => {})
        }
        if (!cancelled) {
          setCameraReady(true)
          setCameraError(null)
        }
      } catch {
        if (!cancelled) {
          setCameraError("Kamera atau mikrofon tidak dapat diakses. Pastikan izin sudah diberikan.")
          setCameraReady(false)
        }
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      liveMountIdRef.current += 1
      const rec = mediaRecorderRef.current
      if (rec && rec.state !== "inactive") rec.stop()
      mediaRecorderRef.current = null
      recordedChunksRef.current = []
      if (stream) stream.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
      const el = videoRef.current
      if (el) el.srcObject = null
    }
  }, [phase])

  useEffect(() => {
    if (phase !== "live" || recordedVideoUrl || !cameraReady) return
    const el = videoRef.current
    const stream = mediaStreamRef.current
    if (!el || !stream) return
    el.srcObject = stream
    void el.play().catch(() => {})
  }, [phase, recordedVideoUrl, cameraReady])

  // ── Session control ────────────────────────────────────────────────────────
  function handleStartSession() {
    revokeAllBlobUrls()
    setRecordedVideoUrl(null)
    setRecordedBlob(null)
    setCurrentQuestionIndex(0)
    setRecordingState("idle")
    setSubmittedAnswers([])
    recordedChunksRef.current = []
    mediaRecorderRef.current = null
    setPhase("live")
  }

  // ── Recording control ─────────────────────────────────────────────────────
  function handleStartRecording() {
    const recordingMountId = liveMountIdRef.current
    setRecorderError(null)
    setSubmitError(null)
    const stream = mediaStreamRef.current
    if (!stream || typeof MediaRecorder === "undefined") {
      setRecorderError("Perekaman tidak didukung di peramban ini.")
      return
    }
    if (recordedVideoUrl) {
      revokeBlobUrl(recordedVideoUrl)
      setRecordedVideoUrl(null)
      setRecordedBlob(null)
    }
    recordedChunksRef.current = []

    let recorder: MediaRecorder
    try {
      const mimeType = pickRecorderMimeType()
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch {
      setRecorderError("Tidak dapat memulai perekaman.")
      return
    }

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      if (recordingMountId !== liveMountIdRef.current) {
        recordedChunksRef.current = []
        return
      }
      const chunks = recordedChunksRef.current
      const blobType = recorder.mimeType || "video/webm"
      const blob =
        chunks.length > 0 ? new Blob(chunks, { type: blobType }) : new Blob([], { type: blobType })

      if (blob.size === 0) {
        setRecorderError("Rekaman kosong. Coba lagi.")
        setRecordingState("idle")
        mediaRecorderRef.current = null
        return
      }

      const url = URL.createObjectURL(blob)
      trackBlobUrl(url)
      setRecordedVideoUrl(url)
      setRecordedBlob(blob)
      setRecordingState("stopped")
      mediaRecorderRef.current = null
    }

    recorder.onerror = () => {
      if (recordingMountId !== liveMountIdRef.current) return
      setRecorderError("Terjadi kesalahan saat merekam.")
      setRecordingState("idle")
      mediaRecorderRef.current = null
    }

    mediaRecorderRef.current = recorder
    try {
      recorder.start()
      setRecordingState("recording")
    } catch {
      setRecorderError("Tidak dapat memulai perekaman.")
      mediaRecorderRef.current = null
    }
  }

  function handleStopRecording() {
    const rec = mediaRecorderRef.current
    if (!rec || rec.state === "inactive") return
    if (rec.state === "recording") rec.stop()
  }

  function handleRetryRecording() {
    const rec = mediaRecorderRef.current
    if (rec && rec.state !== "inactive") rec.stop()
    mediaRecorderRef.current = null
    recordedChunksRef.current = []
    if (recordedVideoUrl) {
      revokeBlobUrl(recordedVideoUrl)
      setRecordedVideoUrl(null)
      setRecordedBlob(null)
    }
    setRecordingState("idle")
    setRecorderError(null)
    setSubmitError(null)
  }

  // ── Answer submission (async) ──────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(async () => {
    if (!recordedBlob || !currentQuestion || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const token = localStorage.getItem("nobiai_auth_token")

      const formData = new FormData()
      formData.append("sessionId", sessionId)
      formData.append("questionId", currentQuestion.questionId)
      formData.append("questionNumber", String(currentQuestion.questionNumber))
      formData.append("questionText", currentQuestion.questionText)
      formData.append("video", recordedBlob, `answer-q${currentQuestion.questionNumber}.webm`)

      const res = await fetch(`${getApiBaseUrl()}/api/answers/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengunggah jawaban.")
      }

      // Record the queued answer locally
      setSubmittedAnswers((prev) => [
        ...prev,
        {
          answerId: data.answerId,
          questionNumber: currentQuestion.questionNumber,
          processingStatus: data.processingStatus,
        },
      ])

      // Clean up recording state
      if (recordedVideoUrl) revokeBlobUrl(recordedVideoUrl)
      setRecordedVideoUrl(null)
      setRecordedBlob(null)
      setRecordingState("idle")
      recordedChunksRef.current = []
      mediaRecorderRef.current = null
      setRecorderError(null)

      // Advance or complete
      if (currentQuestionIndex >= totalQuestions - 1) {
        setPhase("completed")
      } else {
        setCurrentQuestionIndex((i) => i + 1)
      }
    } catch (err: any) {
      setSubmitError(err.message || "Terjadi kesalahan. Coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }, [
    recordedBlob,
    currentQuestion,
    isSubmitting,
    sessionId,
    currentQuestionIndex,
    totalQuestions,
    recordedVideoUrl,
  ])

  const recorderSupported = typeof MediaRecorder !== "undefined"
  const canStartRecording =
    recordingState === "idle" &&
    !recordedVideoUrl &&
    cameraReady &&
    recorderSupported &&
    !!mediaStreamRef.current
  const canStopRecording = recordingState === "recording"
  const canRetryRecording = recordedVideoUrl !== null && !isSubmitting
  const canSubmitAnswer = recordedBlob !== null && !isSubmitting

  const showLivePreview = !recordedVideoUrl

  return (
    <div className="page-bg text-[#37352F]">
      <Navbar navItems={dashboardNavItems} />

      <main className="page-container">
        {/* ── Overview phase ───────────────────────────────────────────────── */}
        {phase === "overview" ? (
          <>
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
                Sesi Wawancara
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#37352F] sm:text-4xl">
                Tinjau pertanyaan sebelum memulai
              </h1>
              <p className="mt-2 text-base leading-relaxed text-[#787774]">
                Setelah memulai, Anda akan menjawab satu per satu secara berurutan. Rekaman video
                Anda akan diunggah secara otomatis dan diproses di latar belakang. Anda dapat
                langsung lanjut ke pertanyaan berikutnya tanpa menunggu hasil evaluasi.
              </p>
            </div>

            <div className="rounded border border-[#E8E8E6] bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-[#37352F]">
                Daftar pertanyaan ({totalQuestions})
              </h2>
              <ol className="space-y-3">
                {sessionQuestions.map((q, i) => (
                  <li
                    key={q.questionId}
                    className="rounded border border-[#E8E8E6] bg-white p-4"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#37352F]/10 text-xs font-semibold text-[#37352F]">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-[#37352F]">{q.questionText}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleStartSession}
                className="rounded bg-[#37352F] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90"
              >
                Mulai Sesi
              </button>
              <Link
                to="/session/setup"
                className="rounded border border-[#DADAD8] bg-transparent px-6 py-2.5 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF]"
              >
                Kembali ke Persiapan
              </Link>
            </div>
          </>
        ) : null}

        {/* ── Live phase ───────────────────────────────────────────────────── */}
        {phase === "live" ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
            <div className="rounded border border-[#E8E8E6] bg-white p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-[#787774]">
                  Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}
                </p>
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#E8E8E6] sm:max-w-[200px]">
                  <div
                    className="h-full rounded-full bg-[#37352F]/80 transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <h1 className="mt-5 text-lg font-semibold leading-8 tracking-tight text-[#37352F] sm:text-xl">
                {currentQuestion?.questionText}
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-[#787774]">
                Jawab dengan jelas dan tenang. Gunakan pelafalan kata yang jelas agar transkripsi lebih akurat. Pandang kamera saat berbicara agar terasa natural.
              </p>

              {recorderError ? (
                <p className="mt-4 rounded border border-[#FDE8E8] bg-[#FDE8E8] px-4 py-2.5 text-sm text-[#C33D31]" role="alert">
                  {recorderError}
                </p>
              ) : null}

              {submitError ? (
                <p className="mt-4 rounded border border-[#FDE8E8] bg-[#FDE8E8] px-4 py-2.5 text-sm text-[#C33D31]" role="alert">
                  {submitError}
                </p>
              ) : null}

              {/* Processing info */}
              {submittedAnswers.length > 0 && (
                <div className="mt-4 rounded border border-[#E9F5FE] bg-[#E9F5FE] px-4 py-2.5">
                  <p className="text-xs font-medium text-[#086DDD]">
                    {submittedAnswers.length} jawaban sebelumnya sedang diproses di latar belakang…
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  id="btn-start-recording"
                  type="button"
                  disabled={!canStartRecording}
                  onClick={handleStartRecording}
                  className="rounded bg-[#37352F] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mulai Rekam
                </button>
                <button
                  id="btn-stop-recording"
                  type="button"
                  disabled={!canStopRecording}
                  onClick={handleStopRecording}
                  className="rounded border border-[#DADAD8] bg-transparent px-4 py-2 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Hentikan Rekaman
                </button>
                <button
                  id="btn-retry-recording"
                  type="button"
                  disabled={!canRetryRecording}
                  onClick={handleRetryRecording}
                  className="rounded border border-[#DADAD8] bg-transparent px-4 py-2 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Rekam Ulang
                </button>
                <button
                  id="btn-submit-answer"
                  type="button"
                  disabled={!canSubmitAnswer}
                  onClick={handleSubmitAnswer}
                  className="rounded bg-[#2383E2] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1C6DC1] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Mengunggah…
                    </span>
                  ) : (
                    "Kirim Jawaban"
                  )}
                </button>
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20">
              <div className="overflow-hidden rounded border border-[#E8E8E6] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
                <div className="relative aspect-[4/3] bg-[#F7F6F3]">
                  {recordedVideoUrl ? (
                    <video
                      key={recordedVideoUrl}
                      src={recordedVideoUrl}
                      controls
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                      aria-label="Pratinjau rekaman jawaban"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 [transform:scaleX(-1)] ${
                        cameraReady ? "opacity-100" : "opacity-0"
                      }`}
                      autoPlay
                      muted
                      playsInline
                      aria-label="Pratinjau kamera langsung"
                    />
                  )}
                  {showLivePreview && !cameraReady && !cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#DADAD8] border-t-[#37352F]" />
                      <p className="text-center text-sm font-medium text-[#787774]">
                        Menyiapkan kamera…
                      </p>
                    </div>
                  ) : null}
                  {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#DADAD8] bg-white text-[#B3B0A9]">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                      </div>
                      <p className="max-w-[16rem] text-sm leading-6 text-[#787774]">{cameraError}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded border border-[#E8E8E6] bg-white px-4 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
                  Status rekaman
                </p>
                <p className="mt-1 text-sm font-medium text-[#37352F]">
                  {isSubmitting
                    ? "Mengunggah jawaban…"
                    : recordedVideoUrl
                      ? "Tinjau rekaman — putar ulang jika perlu"
                      : recordingState === "recording"
                        ? "Sedang merekam…"
                        : "Belum merekam"}
                </p>
              </div>
            </aside>
          </div>
        ) : null}

        {/* ── Completed phase ──────────────────────────────────────────────── */}
        {phase === "completed" ? (
          <div className="rounded border border-[#E8E8E6] bg-white px-8 py-16 text-center shadow-[0_0_0_1px_rgba(0,0,0,0.03)] lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
              Sesi selesai
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#37352F] sm:text-3xl">
              Terima kasih telah menyelesaikan simulasi
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-[#787774]">
              {submittedAnswers.length} jawaban telah diunggah dan sedang diproses di latar
              belakang. Mengalihkan Anda ke halaman hasil…
            </p>
            <div className="mt-6 flex justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#DADAD8] border-t-[#37352F]" />
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-[#E8E8E6] px-4 py-6 text-center text-xs text-[#B3B0A9] sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} NobiAI</span>
      </footer>
    </div>
  )
}

export default SessionLive