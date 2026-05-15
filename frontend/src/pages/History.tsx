import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"

import Navbar from "../components/Navbar"
import { getApiBaseUrl } from "../lib/apiBase"

const dashboardNavItems = [
  { label: "Latihan", to: "/session/setup" },
  { label: "Riwayat", to: "/history" },
]

type HistorySession = {
  _id: string
  title: string
  jobRole: string
  companyName: string
  sourceType: string
  totalQuestions: number
  totalScore: number | null
  status: string
  createdAt: string
}

function History() {
  const [sessions, setSessions] = useState<HistorySession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("nobiai_auth_token")
      const res = await fetch(`${getApiBaseUrl()}/api/sessions/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || "Gagal memuat riwayat.")
      setSessions(json.data ?? [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const confirmed = confirm(
      "Apakah Anda yakin ingin menghapus sesi ini? Tindakan ini tidak dapat dibatalkan."
    )
    if (!confirmed) return

    setDeletingId(sessionId)
    try {
      const token = localStorage.getItem("nobiai_auth_token")
      const res = await fetch(`${getApiBaseUrl()}/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || "Gagal menghapus sesi.")

      setSessions((prev) => prev.filter((s) => s._id !== sessionId))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "active":
        return { label: "Belum Dimulai", className: "notion-tag notion-tag--gray" }
      case "processing":
        return { label: "Sedang Diproses", className: "notion-tag notion-tag--yellow" }
      case "completed":
        return { label: "Selesai", className: "notion-tag notion-tag--green" }
      case "failed":
        return { label: "Gagal", className: "notion-tag notion-tag--red" }
      default:
        return { label: status, className: "notion-tag notion-tag--gray" }
    }
  }

  return (
    <div className="page-bg text-[#37352F]">
      <Navbar navItems={dashboardNavItems} />

      <main className="page-container">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
            Riwayat Sesi
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#37352F] sm:text-4xl">
            Tinjau sesi latihan yang pernah dilakukan
          </h1>
          <p className="mt-2 text-base leading-relaxed text-[#787774]">
            Buka salah satu sesi di bawah untuk melihat ringkasan skor, evaluasi, dan detail
            jawaban per pertanyaan.
          </p>
          <div className="mt-5">
            <Link
              to="/session/setup"
              className="rounded border border-[#DADAD8] bg-transparent px-5 py-2.5 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF]"
            >
              Mulai Sesi Baru
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded border border-[#FDE8E8] bg-[#FDE8E8] px-4 py-3 text-sm text-[#C33D31]">
            {error}
          </div>
        )}

        {/* Session list */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DADAD8] border-t-[#37352F]" />
            <p className="text-sm text-[#787774]">Memuat riwayat sesi…</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded border border-[#E8E8E6] bg-white px-6 py-12 text-center">
            <p className="text-[#B3B0A9]">Anda belum memiliki riwayat sesi wawancara.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => {
              const badge = getStatusLabel(session.status)
              const dateStr = new Date(session.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })

              return (
                <li key={session._id}>
                  <Link
                    to={`/results/${session._id}`}
                    className="group block rounded border border-[#E8E8E6] bg-white p-6 transition hover:border-[#DADAD8] hover:shadow-sm lg:p-8"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[#37352F] sm:text-lg">
                            {session.title}
                          </h3>
                          <span className={`shrink-0 ${badge.className}`}>
                            {session.status === "processing" && (
                              <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-[#714300]" />
                            )}
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#787774]">{dateStr}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#787774]">
                          {session.jobRole && (
                            <p>
                              <span className="font-medium text-[#37352F]">Posisi:</span>{" "}
                              {session.jobRole}
                            </p>
                          )}
                          {session.companyName && (
                            <p>
                              <span className="font-medium text-[#37352F]">Perusahaan:</span>{" "}
                              {session.companyName}
                            </p>
                          )}
                          <p>
                            <span className="font-medium text-[#37352F]">Pertanyaan:</span>{" "}
                            {session.totalQuestions}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-baseline gap-1 sm:items-end sm:text-right">
                        <p className="text-xs font-medium uppercase tracking-wider text-[#B3B0A9]">
                          Skor
                        </p>
                        <p className="text-3xl font-semibold tabular-nums text-[#37352F] sm:text-4xl">
                          {session.totalScore !== null ? session.totalScore : "—"}
                          <span className="text-lg font-medium text-[#B3B0A9]">/100</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#E8E8E6] pt-4">
                      <p className="text-sm font-medium text-[#787774] transition group-hover:text-[#37352F]">
                        Lihat detail hasil →
                      </p>
                      <button
                        onClick={(e) => handleDeleteSession(session._id, e)}
                        disabled={deletingId === session._id}
                        className="inline-flex items-center gap-1.5 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-xs font-medium text-[#C33D31] transition hover:bg-[#FDE8E8] disabled:opacity-50"
                        title="Hapus sesi"
                      >
                        {deletingId === session._id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#FECACA] border-t-[#C33D31]" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                        {deletingId === session._id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <footer className="border-t border-[#E8E8E6] px-4 py-6 text-center text-xs text-[#B3B0A9] sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} NobiAI</span>
      </footer>
    </div>
  )
}

export default History