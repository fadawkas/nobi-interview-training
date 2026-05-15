import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { getApiBaseUrl } from "../lib/apiBase"
import Navbar from "../components/Navbar"

const dashboardNavItems = [
  { label: "Latihan", to: "/session/setup" },
  { label: "Riwayat", to: "/history" },
]

const jenisWawancaraOptions = [
  "HR / Behavioral",
  "Technical",
  "Case Study",
  "General",
] as const

const tingkatKesulitanOptions = ["Pemula", "Menengah", "Lanjutan"] as const

const inputClass =
  "notion-input"

type GeneratedQuestion = {
  questionId: string
  questionNumber: number
  questionText: string
  category: string
  difficulty: string
}

type SessionData = {
  sessionId: string
  generatedQuestions: GeneratedQuestion[]
  contextSummary: { cv: string; links: string; search: string }
  metadata: { interviewType: string; difficulty: string; model: string; questionCount: number }
}

function SessionSetup() {
  const navigate = useNavigate()
  const [posisi, setPosisi] = useState("")
  const [perusahaan, setPerusahaan] = useState("")
  const [jenisWawancara, setJenisWawancara] = useState<string>(jenisWawancaraOptions[0])
  const [tingkatKesulitan, setTingkatKesulitan] = useState<string>(tingkatKesulitanOptions[0])
  const [deskripsi, setDeskripsi] = useState("")
  const [links, setLinks] = useState<string[]>([""])
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)

  function updateLink(index: number, value: string) {
    setLinks((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function addLink() {
    setLinks((prev) => [...prev, ""])
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!posisi.trim()) {
      setError("Posisi yang dilamar wajib diisi.")
      return
    }
    if (!deskripsi.trim()) {
      setError("Deskripsi pekerjaan atau fokus persiapan wajib diisi.")
      return
    }
    if (questionCount < 1 || questionCount > 15) {
      setError("Jumlah pertanyaan harus antara 1 dan 15.")
      return
    }
    setError(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("nobiai_auth_token")

      const res = await fetch(`${getApiBaseUrl()}/api/sessions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          position: posisi,
          company: perusahaan,
          links: links.filter((l) => l.trim() !== ""),
          interviewType: jenisWawancara,
          difficulty: tingkatKesulitan,
          description: deskripsi,
          questionCount,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || "Gagal membuat sesi wawancara.")
      }

      setSessionData(data.data)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan pada server. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-bg text-[#37352F]">
      <Navbar navItems={dashboardNavItems} />

      <main className="page-container">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
            Persiapan Sesi
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#37352F] sm:text-4xl">
            Atur sesi latihan wawancaramu
          </h1>
          <p className="mt-2 text-base leading-relaxed text-[#787774]">
            Isi data persiapan di bawah agar AI dapat menyusun pertanyaan wawancara yang lebih
            relevan dengan konteks posisi dan tujuan latihanmu.
          </p>
        </div>

        {/* Main form card */}
        <div className="rounded border border-[#E8E8E6] bg-white">
          {!sessionData ? (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 rounded border border-[#FDE8E8] bg-[#FDE8E8] px-4 py-3 text-sm text-[#C33D31]">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                {/* Posisi */}
                <div>
                  <label htmlFor="posisi" className="block text-sm font-medium text-[#37352F]">
                    Posisi yang Dilamar
                  </label>
                  <input
                    id="posisi"
                    name="posisi"
                    type="text"
                    value={posisi}
                    onChange={(e) => setPosisi(e.target.value)}
                    placeholder="Contoh: Frontend Developer"
                    className={inputClass}
                    autoComplete="organization-title"
                  />
                </div>

                {/* Perusahaan */}
                <div>
                  <label htmlFor="perusahaan" className="block text-sm font-medium text-[#37352F]">
                    Perusahaan / Instansi{" "}
                    <span className="font-normal text-[#787774]">(opsional)</span>
                  </label>
                  <input
                    id="perusahaan"
                    name="perusahaan"
                    type="text"
                    value={perusahaan}
                    onChange={(e) => setPerusahaan(e.target.value)}
                    placeholder="Contoh: Tokopedia"
                    className={inputClass}
                    autoComplete="organization"
                  />
                </div>

                {/* Links */}
                <div>
                  <label className="block text-sm font-medium text-[#37352F]">Links</label>
                  <p className="mt-1 text-sm text-[#787774]">
                    Tambahkan link lowongan, perusahaan, atau referensi lain
                  </p>
                  <div className="mt-2 space-y-3">
                    {links.map((link, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-3">
                        <input
                          id={`link-${index}`}
                          name={`link-${index}`}
                          type="text"
                          inputMode="url"
                          autoComplete="url"
                          value={link}
                          onChange={(e) => updateLink(index, e.target.value)}
                          placeholder="https://"
                          className={`${inputClass} flex-1 min-w-0`}
                        />
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="shrink-0 rounded border border-[#FDE8E8] bg-[#FDE8E8] px-3 py-2 text-sm font-medium text-[#C33D31] transition hover:bg-[#FDE0E0]"
                          title="Hapus link"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addLink}
                    className="mt-3 rounded border border-[#DADAD8] bg-transparent px-4 py-2 text-sm font-medium text-[#787774] transition hover:bg-[#F1F1EF]"
                  >
                    + Tambah Link
                  </button>
                </div>

                {/* Type, difficulty, count */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="jenisWawancara" className="block text-sm font-medium text-[#37352F]">
                      Jenis Wawancara
                    </label>
                    <select
                      id="jenisWawancara"
                      name="jenisWawancara"
                      value={jenisWawancara}
                      onChange={(e) => setJenisWawancara(e.target.value)}
                      className={inputClass}
                    >
                      {jenisWawancaraOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tingkatKesulitan" className="block text-sm font-medium text-[#37352F]">
                      Tingkat Kesulitan
                    </label>
                    <select
                      id="tingkatKesulitan"
                      name="tingkatKesulitan"
                      value={tingkatKesulitan}
                      onChange={(e) => setTingkatKesulitan(e.target.value)}
                      className={inputClass}
                    >
                      {tingkatKesulitanOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="questionCount" className="block text-sm font-medium text-[#37352F]">
                      Jumlah Pertanyaan
                    </label>
                    <input
                      id="questionCount"
                      name="questionCount"
                      type="number"
                      min="1"
                      max="15"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      placeholder="Contoh: 5"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <label htmlFor="deskripsi" className="block text-sm font-medium text-[#37352F]">
                    Deskripsi Pekerjaan / Fokus Persiapan
                  </label>
                  <textarea
                    id="deskripsi"
                    name="deskripsi"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Masukkan konteks, job description, atau fokus latihan"
                    rows={5}
                    className={`${inputClass} resize-y min-h-[6rem]`}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded bg-[#37352F] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Menyiapkan Sesi..." : "Mulai Sesi"}
                </button>
                <Link
                  to="/dashboard"
                  className="rounded border border-[#DADAD8] bg-transparent px-6 py-2.5 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF]"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            </form>
          ) : (
            /* Session ready state */
            <div className="p-6 sm:p-8">
              <div className="border-b border-[#E8E8E6] pb-5">
                <h2 className="text-xl font-semibold text-[#37352F]">Sesi Latihan Berhasil Disiapkan</h2>
                <p className="mt-2 text-sm text-[#787774]">
                  AI telah menghasilkan pertanyaan berdasarkan profil Anda. Sesi disimpan dengan ID:{" "}
                  <code className="rounded bg-[#F7F6F3] px-1.5 py-0.5 text-xs font-mono text-[#37352F]">
                    {sessionData.sessionId}
                  </code>
                </p>
              </div>

              {/* Summary grid */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">Informasi Sesi</h3>
                  <ul className="mt-3 space-y-2.5 text-sm text-[#37352F]">
                    <li className="flex justify-between border-b border-[#E8E8E6] pb-2">
                      <span className="text-[#787774]">Tipe</span>
                      <strong>{sessionData.metadata.interviewType}</strong>
                    </li>
                    <li className="flex justify-between border-b border-[#E8E8E6] pb-2">
                      <span className="text-[#787774]">Kesulitan</span>
                      <strong>{sessionData.metadata.difficulty}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-[#787774]">Model</span>
                      <strong>{sessionData.metadata.model}</strong>
                    </li>
                  </ul>
                </div>

                <div className="rounded border border-[#E8E8E6] bg-[#F7F6F3] p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">Konteks Referensi</h3>
                  <ul className="mt-3 space-y-2.5 text-sm text-[#37352F]">
                    <li className="flex justify-between border-b border-[#E8E8E6] pb-2">
                      <span className="text-[#787774]">Profil CV</span>
                      <strong>{sessionData.contextSummary.cv}</strong>
                    </li>
                    <li className="flex justify-between border-b border-[#E8E8E6] pb-2">
                      <span className="text-[#787774]">Web Search</span>
                      <strong>{sessionData.contextSummary.search}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-[#787774]">Links</span>
                      <strong>{sessionData.contextSummary.links}</strong>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Question preview */}
              <div className="mt-6">
                <h3 className="mb-4 text-base font-semibold text-[#37352F]">
                  Daftar Pertanyaan ({sessionData.generatedQuestions.length})
                </h3>
                <ul className="space-y-2.5 max-h-80 overflow-y-auto">
                  {sessionData.generatedQuestions.map((q, idx) => (
                    <li key={q.questionId} className="rounded border border-[#E8E8E6] bg-white p-4">
                      <div className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#37352F]/10 text-xs font-semibold text-[#37352F]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-[#37352F]">{q.questionText}</p>
                          <div className="mt-1.5">
                            <span className="rounded bg-[#F7F6F3] px-2 py-0.5 text-[11px] font-medium text-[#787774]">
                              {q.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3 pt-4 border-t border-[#E8E8E6]">
                <button
                  type="button"
                  onClick={() =>
                    navigate("/session/live", {
                      state: {
                        sessionId: sessionData.sessionId,
                        questions: sessionData.generatedQuestions,
                      },
                    })
                  }
                  className="rounded bg-[#37352F] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90"
                >
                  Mulai Simulasi Wawancara
                </button>
                <button
                  type="button"
                  onClick={() => setSessionData(null)}
                  className="rounded border border-[#DADAD8] bg-transparent px-6 py-2.5 text-sm font-medium text-[#787774] transition hover:bg-[#F1F1EF]"
                >
                  Ubah Parameter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info callout */}
        <div className="mt-6 rounded border border-[#E9F5FE] bg-[#E9F5FE] px-4 py-3">
          <p className="text-sm leading-relaxed text-[#086DDD]">
            <span className="font-medium">Info: </span>
            Informasi yang kamu masukkan membantu sistem menyusun pertanyaan yang lebih kontekstual.
            Sesi ini tersimpan otomatis di database dan dapat dilihat kembali di halaman Riwayat.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#E8E8E6] px-4 py-6 text-center text-xs text-[#B3B0A9] sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} NobiAI</span>
      </footer>
    </div>
  )
}

export default SessionSetup