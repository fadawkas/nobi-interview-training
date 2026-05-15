import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import Navbar from "../components/Navbar"
import { getApiBaseUrl } from "../lib/apiBase"

const AUTH_TOKEN_KEY = "nobiai_auth_token"
const AUTH_USER_KEY = "nobiai_auth_user"

const dashboardNavItems = [
  { label: "Latihan", to: "/session/setup" },
  { label: "Riwayat", to: "/history" },
]

const inputClass = "notion-input"

type ProfileFormState = {
  namaLengkap: string
  email: string
  nomorTelepon: string
  domisili: string
  headline: string
}

const emptyForm: ProfileFormState = {
  namaLengkap: "",
  email: "",
  nomorTelepon: "",
  domisili: "",
  headline: "",
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ProfileFormState>(emptyForm)
  const [baselineForm, setBaselineForm] = useState<ProfileFormState>(emptyForm)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvMeta, setCvMeta] = useState<{ filename: string; url: string } | null>(null)
  const [baselineCvFile, setBaselineCvFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      navigate("/signin")
      return
    }

    async function fetchProfile() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY)
            navigate("/signin")
          }
          return
        }
        const data = await res.json()
        const user = data.user
        if (user) {
          const loadedForm = {
            namaLengkap: user.name || "",
            email: user.email || "",
            nomorTelepon: user.phone || "",
            domisili: user.domicile || "",
            headline: user.description || "",
          }
          setForm(loadedForm)
          setBaselineForm(loadedForm)
          if (user.cv && user.cv.filename) {
            setCvMeta(user.cv)
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err)
      }
    }
    fetchProfile()
  }, [navigate])

  function handleCvChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCvFile(file)
    e.target.value = ""
  }

  function handleRemoveCv() {
    setCvFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleReplaceCv() {
    fileInputRef.current?.click()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccessMessage(null)
    setError(null)

    if (!form.namaLengkap.trim()) {
      setError("Nama lengkap wajib diisi.")
      return
    }
    if (!form.email.trim()) {
      setError("Email wajib diisi.")
      return
    }
    if (!isValidEmail(form.email)) {
      setError("Format email tidak valid.")
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setError("Sesi telah berakhir, silakan login kembali.")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", form.namaLengkap)
      formData.append("email", form.email)
      formData.append("phone", form.nomorTelepon)
      formData.append("domicile", form.domisili)
      formData.append("description", form.headline)

      if (cvFile) {
        formData.append("cv", cvFile)
      }

      const res = await fetch(`${getApiBaseUrl()}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || "Gagal memperbarui profil.")
        return
      }

      setBaselineForm({ ...form })
      setBaselineCvFile(cvFile)
      if (data.user?.cv?.filename) {
        setCvMeta(data.user.cv)
      }

      if (data.user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
          id: data.user._id,
          name: data.user.name,
          email: data.user.email
        }))
      }

      setSuccessMessage("Perubahan profil berhasil disimpan")
      window.setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      setError("Terjadi kesalahan jaringan.")
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setError(null)
    setSuccessMessage(null)
    setForm({ ...baselineForm })
    setCvFile(baselineCvFile)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="page-bg text-[#37352F]">
      <Navbar navItems={dashboardNavItems} />

      <main className="page-container">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">Profil</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#37352F] sm:text-4xl">
            Kelola profil dan dokumen pendukungmu
          </h1>
          <p className="mt-2 text-base leading-relaxed text-[#787774]">
            Informasi di halaman ini membantu NobiAI menyesuaikan sesi latihan wawancara agar lebih
            relevan dengan latar belakangmu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded border border-[#FDE8E8] bg-[#FDE8E8] px-4 py-3 text-sm text-[#C33D31]">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded border border-[#E6F7EF] bg-[#E6F7EF] px-4 py-3 text-sm text-[#0B8A70]">
              {successMessage}
            </div>
          )}

          {/* Basic account info */}
          <div className="rounded border border-[#E8E8E6] bg-white p-6">
            <h2 className="text-base font-semibold text-[#37352F]">Informasi Akun Dasar</h2>
            <p className="mt-1 text-sm text-[#787774]">
              Data identitas dan ringkasan singkat yang membantu konteks sesi.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="namaLengkap" className="block text-sm font-medium text-[#37352F]">
                  Nama Lengkap
                </label>
                <input
                  id="namaLengkap"
                  name="namaLengkap"
                  type="text"
                  value={form.namaLengkap}
                  onChange={(e) => setForm((f) => ({ ...f, namaLengkap: e.target.value }))}
                  placeholder="Contoh: Cristiano Ronaldo"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-[#37352F]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Contoh: nama@email.com"
                  className={inputClass}
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="nomorTelepon" className="block text-sm font-medium text-[#37352F]">
                  Nomor Telepon{" "}
                  <span className="font-normal text-[#787774]">(opsional)</span>
                </label>
                <input
                  id="nomorTelepon"
                  name="nomorTelepon"
                  type="tel"
                  value={form.nomorTelepon}
                  onChange={(e) => setForm((f) => ({ ...f, nomorTelepon: e.target.value }))}
                  placeholder="Contoh: 081234567890"
                  className={inputClass}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label htmlFor="domisili" className="block text-sm font-medium text-[#37352F]">
                  Domisili / Lokasi{" "}
                  <span className="font-normal text-[#787774]">(opsional)</span>
                </label>
                <input
                  id="domisili"
                  name="domisili"
                  type="text"
                  value={form.domisili}
                  onChange={(e) => setForm((f) => ({ ...f, domisili: e.target.value }))}
                  placeholder="Contoh: Jakarta"
                  className={inputClass}
                  autoComplete="address-level2"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="headline" className="block text-sm font-medium text-[#37352F]">
                  Ringkasan Singkat Diri{" "}
                  <span className="font-normal text-[#787774]">(opsional)</span>
                </label>
                <textarea
                  id="headline"
                  name="headline"
                  value={form.headline}
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  placeholder="Tulis ringkasan singkat tentang latar belakang, minat, atau fokus kariermu"
                  rows={4}
                  className={`${inputClass} resize-y min-h-[5rem]`}
                />
              </div>
            </div>
          </div>

          {/* CV Upload */}
          <div className="rounded border border-[#E8E8E6] bg-white p-6">
            <h2 className="text-base font-semibold text-[#37352F]">Unggah CV</h2>
            <p className="mt-1 text-sm text-[#787774]">
              CV akan digunakan untuk konteks simulasi wawancara.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={handleCvChange}
            />
            <div className="mt-5 rounded border border-[#E8E8E6] bg-white p-5">
              {!cvFile && !cvMeta ? (
                <div className="flex flex-col items-center justify-center gap-4 py-6 text-center sm:py-8">
                  <p className="text-sm text-[#787774]">Unggah file PDF atau Word (maks. sesuai browser).</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded bg-[#37352F] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90"
                  >
                    Pilih File CV
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B0A9]">
                      {cvFile ? "File terpilih" : "CV Tersimpan"}
                    </p>
                    {cvFile ? (
                      <>
                        <p className="mt-1 truncate text-sm font-medium text-[#37352F]">{cvFile.name}</p>
                        <p className="mt-0.5 text-xs text-[#787774]">
                          {(cvFile.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : cvMeta ? (
                      <>
                        <p className="mt-1 truncate text-sm font-medium text-[#37352F]">{cvMeta.filename}</p>
                        <a
                          href={`${getApiBaseUrl()}${cvMeta.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-sm font-medium text-[#2383E2] hover:underline"
                        >
                          Lihat File CV
                        </a>
                      </>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleReplaceCv}
                      className="rounded border border-[#DADAD8] bg-transparent px-4 py-2 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF]"
                    >
                      Ganti File
                    </button>
                    {cvFile && (
                      <button
                        type="button"
                        onClick={handleRemoveCv}
                        className="rounded border border-[#FDE8E8] bg-[#FDE8E8] px-4 py-2 text-sm font-medium text-[#C33D31] transition hover:bg-[#FDE0E0]"
                      >
                        Batal File
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[#37352F] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="rounded border border-[#DADAD8] bg-transparent px-6 py-2.5 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset Perubahan
            </button>
          </div>
        </form>
      </main>

      <footer className="border-t border-[#E8E8E6] px-4 py-6 text-center text-xs text-[#B3B0A9] sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} NobiAI</span>
      </footer>
    </div>
  )
}

export default Profile