import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"

import Navbar from "../components/Navbar"
import { getApiBaseUrl } from "../lib/apiBase"

type RecentSession = {
  _id: string
  title: string
  createdAt: string
  status: string
  totalScore: number | null
}

const dashboardNavItems = [
  { label: "Latihan", to: "/session/setup" },
  { label: "Riwayat", to: "/history" },
]

function Dashboard() {
  const [sessions, setSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecentSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem("nobiai_auth_token")
      const res = await fetch(`${getApiBaseUrl()}/api/sessions/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setSessions((json.data ?? []).slice(0, 3))
      }
    } catch (err) {
      console.error("Failed to fetch recent sessions", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRecentSessions()
  }, [fetchRecentSessions])

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
        {/* Welcome section */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#37352F] sm:text-4xl">
            Selamat datang kembali
          </h1>
          <p className="mt-2 text-base leading-relaxed text-[#787774]">
            Lanjutkan latihan wawancara atau tinjau riwayat sesi latihanmu.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/session/setup"
              className="rounded bg-[#37352F] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90"
            >
              Mulai Sesi
            </Link>
            <Link
              to="/history"
              className="rounded border border-[#DADAD8] bg-transparent px-5 py-2.5 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF]"
            >
              Lihat Riwayat
            </Link>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="rounded border border-[#E8E8E6] bg-white">
          <div className="border-b border-[#E8E8E6] px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
              Riwayat
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#37352F]">
              Sesi terkini
            </h2>
            <p className="mt-0.5 text-sm text-[#787774]">
              {sessions.length > 0
                ? "Tinjau performa terakhir dari latihan wawancara Anda."
                : "Anda belum melakukan latihan wawancara."}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#DADAD8] border-t-[#37352F]" />
            </div>
          ) : sessions.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E8E8E6] bg-[#F7F6F3]">
                <tr>
                  <th className="px-6 py-3 font-medium text-[#787774]">Judul sesi</th>
                  <th className="hidden px-6 py-3 font-medium text-[#787774] sm:table-cell">Tanggal</th>
                  <th className="px-6 py-3 font-medium text-[#787774]">Status</th>
                  <th className="px-6 py-3 font-medium text-right text-[#787774]">Skor</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const badge = getStatusLabel(session.status)
                  const dateStr = new Date(session.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })
                  return (
                    <tr
                      key={session._id}
                      className="border-b border-[#E8E8E6] last:border-0 bg-white transition hover:bg-[#F7F6F3]/50 cursor-pointer"
                      onClick={() => (window.location.href = `/results/${session._id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-[#37352F]">{session.title}</td>
                      <td className="hidden px-6 py-4 text-[#787774] sm:table-cell">
                        {dateStr}
                      </td>
                      <td className="px-6 py-4">
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#37352F]">
                        {session.totalScore !== null ? session.totalScore : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-sm text-[#B3B0A9]">
              Belum ada data sesi.
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[#E8E8E6] px-4 py-6 text-center text-xs text-[#B3B0A9] sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} NobiAI</span>
      </footer>
    </div>
  )
}

export default Dashboard