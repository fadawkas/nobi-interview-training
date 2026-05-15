import type { FormEvent } from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { getApiBaseUrl } from "../lib/apiBase"

function SignUp() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [domicile, setDomicile] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          domicile,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        setError(data.message ?? "Registration failed")
        return
      }
      navigate("/signin")
    } catch {
      setError("Unable to reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-bg text-[#37352F]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12">
        <Link
          to="/"
          className="mb-8 text-sm font-medium text-[#787774] transition hover:text-[#37352F]"
        >
          ← Kembali ke beranda
        </Link>

        <div className="w-full rounded border border-[#E8E8E6] bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          {/* Brand */}
          <div className="mb-8 flex items-center gap-2">
            <span className="text-lg font-semibold text-[#37352F]">NobiAI</span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
            Mulai Sekarang
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#37352F]">
            Buat akun NobiAI
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#787774]">
            Mulai latihan wawancara dengan feedback multimodal yang lebih terstruktur.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error ? (
              <div className="rounded border border-[#FDE8E8] bg-[#FDE8E8] px-4 py-3 text-sm text-[#C33D31]">
                {error}
              </div>
            ) : null}

            <div>
              <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-[#37352F]">
                Nama Lengkap
              </label>
              <input
                id="signup-name"
                type="text"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="Masukkan nama lengkap"
                className="notion-input"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-[#37352F]">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="kamu@email.com"
                className="notion-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="signup-phone" className="mb-1.5 block text-sm font-medium text-[#37352F]">
                  No. Telepon
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={(ev) => setPhone(ev.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="notion-input"
                />
              </div>
              <div>
                <label htmlFor="signup-domicile" className="mb-1.5 block text-sm font-medium text-[#37352F]">
                  Domisili
                </label>
                <input
                  id="signup-domicile"
                  type="text"
                  name="domicile"
                  autoComplete="address-level2"
                  value={domicile}
                  onChange={(ev) => setDomicile(ev.target.value)}
                  placeholder="Kota"
                  className="notion-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-[#37352F]">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="notion-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3B0A9] hover:text-[#787774] focus:outline-none"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-[#37352F] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses…" : "Daftar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#787774]">
            Sudah punya akun?{" "}
            <Link
              to="/signin"
              className="font-medium text-[#37352F] underline underline-offset-4 hover:text-[#37352F]/80"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp