import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import slide1 from "../assets/1.png"
import slide2 from "../assets/2.png"
import slide3 from "../assets/3.png"
import slide4 from "../assets/4.png"

// ── Types ────────────────────────────────────────────────────────────────────

type FeatureTab = {
  id: string
  label: string
  tag: string
  title: string
  description: string
  detail: string
  stat: string
  image: string
}

// ── Data ─────────────────────────────────────────────────────────────────────

const featureTabs: FeatureTab[] = [
  {
    id: "simulation",
    label: "Simulasi Wawancara",
    tag: "Fitur Utama",
    title: "Simulasikan wawancara nyata.",
    description:
      "NobiAI menghasilkan pertanyaan wawancara yang relevan berdasarkan posisi, perusahaan, dan konteks persiapan yang kamu masukkan — memberikan pengalaman latihan yang terasa seperti wawancara sesungguhnya.",
    detail: "Alur pertanyaan adaptif berbasis LLM",
    stat: "Pertanyaan kontekstual, bukan template.",
    image: slide1,
  },
  {
    id: "speech",
    label: "Speech Transcription",
    tag: "Multimodal",
    title: "Tinjau setiap kata yang kamu ucapkan.",
    description:
      "OpenAI Whisper mentranskripsikan jawaban lisanmu secara akurat sehingga kamu bisa membaca ulang, mengevaluasi pilihan kata, dan melihat di mana penyampaianmu perlu diperbaiki.",
    detail: "Transkripsi otomatis berbasis Whisper",
    stat: "Evaluasi performa verbal yang jelas.",
    image: slide2,
  },
  {
    id: "fem",
    label: "Analisis Ekspresi",
    tag: "Analisis",
    title: "Pahami bahasa tubuhmu.",
    description:
      "Facial emotion model melacak ekspresi wajahmu selama menjawab — membantu kamu mengenali pola non-verbal yang dapat memengaruhi kesan pertama di wawancara nyata.",
    detail: "Pelacakan sinyal non-verbal real-time",
    stat: "Insight komunikasi non-verbal yang actionable.",
    image: slide3,
  },
  {
    id: "feedback",
    label: "Feedback & Insight",
    tag: "Refleksi",
    title: "Feedback yang siap dipakai.",
    description:
      "Sistem menggabungkan analisis pertanyaan, transkrip, dan sinyal ekspresi menjadi umpan balik terstruktur yang bisa kamu gunakan langsung untuk sesi latihan berikutnya.",
    detail: "Sintesis verbal + non-verbal",
    stat: "Peningkatan yang terukur setiap sesi.",
    image: slide4,
  },
]

const techStack = [
  {
    label: "LLM",
    title: "Language Model Core",
    description:
      "Berperan sebagai mesin penalaran untuk memahami konteks, menghasilkan pertanyaan wawancara, dan mengorkestrasi feedback.",
  },
  {
    label: "Whisper",
    title: "Speech Transcription",
    description:
      "OpenAI Whisper mengubah jawaban wawancara lisan menjadi teks transkrip untuk review verbal dan analisis lanjutan.",
  },
  {
    label: "FEM",
    title: "Facial Emotion Model",
    description:
      "Melacak isyarat ekspresi wajah saat pengguna menjawab untuk membantu menilai komunikasi non-verbal dan penyampaian.",
  },
  {
    label: "React",
    title: "React + TypeScript",
    description:
      "Menyediakan antarmuka responsif untuk simulasi wawancara, tampilan feedback, dan pengembangan dashboard ke depannya.",
  },
  {
    label: "Express",
    title: "Express.js",
    description:
      "Menangani orkestrasi alur wawancara, pemrosesan model, dan pengelolaan data aplikasi.",
  },
  {
    label: "MongoDB",
    title: "MongoDB",
    description:
      "Menyimpan data pengguna, konteks persiapan, sesi wawancara, serta hasil feedback yang dihasilkan sistem.",
  },
]

const trustLogos = [
  { label: "React", sub: "Frontend" },
  { label: "Express", sub: "Backend" },
  { label: "MongoDB", sub: "Database" },
  { label: "Whisper", sub: "ASR" },
  { label: "LLM", sub: "Reasoning" },
  { label: "FEM", sub: "Ekspresi" },
]

const useCaseChips = [
  "Input konteks wawancara →",
  "Simulasi sesi nyata →",
  "Analisis performa verbal →",
  "Terima feedback multimodal →",
]

const statsData = [
  {
    value: "3",
    unit: "model AI",
    label: "LLM + Whisper + FEM bekerja bersama dalam satu sesi.",
  },
  {
    value: "4",
    unit: "langkah",
    label: "Dari input konteks hingga feedback terstruktur siap pakai.",
  },
  {
    value: "100%",
    unit: "multimodal",
    label: "Verbal, non-verbal, dan ekspresi dianalisis sekaligus.",
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

function Landing() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("simulation")

  const currentTab = featureTabs.find((t) => t.id === activeTab) ?? featureTabs[0]

  return (
    <div className="page-bg text-[#37352F]">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#E8E8E6] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded">
              <img src="/NobiAI_Logo.png" alt="NobiAI Logo" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-base font-semibold text-[#37352F]">NobiAI</span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "#features", label: "Fitur" },
              { href: "#how-it-works", label: "Cara Kerja" },
              { href: "#tech", label: "Tech Stack" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded px-2.5 py-1.5 text-sm font-medium text-[#787774] transition hover:bg-[#F1F1EF] hover:text-[#37352F]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/signup"
              className="rounded px-3 py-1.5 text-sm font-medium text-[#787774] transition hover:bg-[#F1F1EF] hover:text-[#37352F]"
            >
              Daftar
            </Link>
            <Link
              to="/signin"
              className="rounded bg-[#37352F] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#37352F]/90"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#E8E8E6]">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#B3B0A9]">
            AI-Powered Interview Practice
          </p>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-[#37352F] sm:text-6xl lg:text-7xl">
            Latihan wawancara
            <br />
            dengan feedback cerdas.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#787774] sm:text-xl">
            NobiAI menggabungkan simulasi wawancara berbasis AI, speech transcription, dan
            analisis ekspresi wajah — semua dalam satu platform latihan yang terstruktur.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/signin")}
              className="rounded bg-[#37352F] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#37352F]/90"
            >
              Mulai Latihan Gratis
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded border border-[#DADAD8] px-6 py-3 text-sm font-medium text-[#37352F] transition hover:bg-[#F1F1EF]"
            >
              Jelajahi Fitur
            </button>
          </div>

          {/* Trust strip */}
          <div className="mt-14">
            <p className="mb-5 text-xs text-[#B3B0A9]">Dibangun dengan teknologi terpercaya</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {trustLogos.map((logo) => (
                <div
                  key={logo.label}
                  className="flex items-center gap-2 rounded border border-[#E8E8E6] bg-white px-4 py-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"
                >
                  <span className="text-sm font-semibold text-[#37352F]">{logo.label}</span>
                  <span className="text-xs text-[#B3B0A9]">{logo.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Tabs — "Keep work moving" style ──────────────────────── */}
      <section id="features" className="border-b border-[#E8E8E6] bg-[#F7F6F3]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
              Fitur Utama
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#37352F] sm:text-3xl lg:text-4xl">
              Wawancara berjalan, feedback mengalir.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Left tab list */}
            <div className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {featureTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 rounded px-4 py-3 text-left text-sm font-medium transition lg:w-full ${
                    activeTab === tab.id
                      ? "bg-white text-[#37352F] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]"
                      : "text-[#787774] hover:bg-white/60 hover:text-[#37352F]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right content card */}
            <div className="rounded-lg border border-[#E8E8E6] bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.04)] lg:p-8">
              <div className="mb-5 flex items-start justify-between">
                <span className="rounded bg-[#E9F5FE] px-2.5 py-0.5 text-xs font-medium text-[#086DDD]">
                  {currentTab.tag}
                </span>
                <span className="rounded border border-[#E8E8E6] px-2.5 py-1 text-xs text-[#B3B0A9]">
                  {currentTab.detail}
                </span>
              </div>

              {/* Feature screenshot */}
              <div className="mb-6 overflow-hidden rounded-lg border border-[#E8E8E6] bg-[#F7F6F3]">
                <img
                  key={currentTab.id}
                  src={currentTab.image}
                  alt={currentTab.label}
                  className="h-auto w-full object-cover"
                />
              </div>

              <h3 className="text-xl font-bold text-[#37352F] sm:text-2xl">{currentTab.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#787774] sm:text-base">
                {currentTab.description}
              </p>
              <div className="mt-5 rounded-lg border border-[#E8E8E6] bg-[#F7F6F3] px-4 py-3">
                <p className="text-sm font-medium text-[#37352F]">"{currentTab.stat}"</p>
              </div>
            </div>
          </div>

          {/* Use-case chips strip */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {useCaseChips.map((chip) => (
              <button
                key={chip}
                onClick={() => navigate("/signin")}
                className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3 text-left text-sm font-medium text-[#37352F] transition hover:border-[#DADAD8] hover:shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento Grid — "Ask your on-demand assistants" style ───────────── */}
      <section id="how-it-works" className="border-b border-[#E8E8E6]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
              Analisis Multimodal
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#37352F] sm:text-3xl lg:text-4xl">
              Tiga lapisan analisis, satu feedback lengkap.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#787774]">
              NobiAI bukan sekadar chatbot pertanyaan. Sistem menggabungkan language intelligence,
              speech transcription, dan pelacakan ekspresi untuk menghasilkan insight yang kaya.
            </p>
          </div>

          {/* Bento layout */}
          <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {/* Primary large card — LLM */}
            <div className="flex flex-col rounded-xl border border-[#E8E8E6] bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] transition hover:shadow-md lg:col-span-2 lg:row-span-2">
              <span className="w-fit rounded bg-[#F1F1EF] px-2.5 py-1 text-xs font-semibold text-[#787774]">
                LLM
              </span>
              <h3 className="mt-4 text-2xl font-bold text-[#37352F]">
                Kamu berikan konteks. NobiAI lakukan sisanya.
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[#787774]">
                Large Language Model berperan sebagai mesin penalaran utama — memahami posisi target,
                nama perusahaan, dan deskripsi pekerjaanmu untuk menghasilkan pertanyaan wawancara yang
                benar-benar relevan dan kontekstual.
              </p>
              <div className="mt-6 flex-1 rounded-lg border border-[#E8E8E6] bg-[#F7F6F3] p-5">
                <div className="space-y-3">
                  {[
                    { icon: "💬", text: "Pertanyaan berbasis konteks posisi & perusahaan" },
                    { icon: "🔁", text: "Orkestrasi alur wawancara yang adaptif" },
                    { icon: "📝", text: "Sintesis feedback dari semua sinyal multimodal" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-start gap-3">
                      <span className="mt-0.5 text-base">{item.icon}</span>
                      <p className="text-sm text-[#787774]">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Whisper card */}
            <div className="flex flex-col rounded-xl border border-[#E8E8E6] bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] transition hover:shadow-md">
              <span className="w-fit rounded bg-[#E6F7EF] px-2.5 py-1 text-xs font-semibold text-[#0B8A70]">
                Whisper
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#37352F]">Speech Transcription</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#787774]">
                Setiap kata yang kamu ucapkan ditranskripsi secara otomatis oleh OpenAI Whisper —
                siap untuk ditinjau dan dianalisis.
              </p>
            </div>

            {/* FEM card */}
            <div className="flex flex-col rounded-xl border border-[#E8E8E6] bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] transition hover:shadow-md">
              <span className="w-fit rounded bg-[#F1E8FF] px-2.5 py-1 text-xs font-semibold text-[#814CC2]">
                FEM
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#37352F]">Facial Emotion Model</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#787774]">
                Ekspresi wajahmu selama menjawab dianalisis untuk memberikan insight komunikasi
                non-verbal yang selama ini sering terlewat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip — "More productivity" style ──────────────────────── */}
      <section className="border-b border-[#E8E8E6] bg-[#F7F6F3]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-[#37352F] sm:text-2xl">
              Lebih dari sekadar latihan.
            </h2>
            <p className="mt-2 text-sm text-[#787774]">
              Satu platform, tiga dimensi analisis, feedback yang siap dipakai.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {statsData.map((stat) => (
              <div
                key={stat.value}
                className="rounded-xl border border-[#E8E8E6] bg-white p-6 text-center shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-4xl font-bold text-[#37352F]">{stat.value}</span>
                  <span className="text-sm font-medium text-[#787774]">{stat.unit}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#787774]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────────────────────────────────── */}
      <section id="tech" className="border-b border-[#E8E8E6]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#B3B0A9]">
              Tech Stack
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#37352F] sm:text-3xl lg:text-4xl">
              Dibangun dengan teknologi modern.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#787774]">
              NobiAI menggabungkan teknologi web modern dengan komponen pemrosesan AI untuk
              mensimulasikan wawancara dan memberikan feedback terstruktur.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {techStack.map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-[#E8E8E6] bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] transition hover:shadow-md"
              >
                <span className="rounded bg-[#F1F1EF] px-2.5 py-1 text-xs font-semibold text-[#787774]">
                  {item.label}
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#37352F]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#787774]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ─────────────────────────────────────────────────────── */}
      <section className="border-b border-[#E8E8E6] bg-[#37352F]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Siap meningkatkan persiapan wawancaramu?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
            Mulai sesi latihan pertamamu sekarang dan dapatkan feedback multimodal yang terstruktur.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/signup")}
              className="rounded bg-white px-6 py-3 text-sm font-medium text-[#37352F] transition hover:bg-white/90"
            >
              Daftar Gratis
            </button>
            <button
              onClick={() => navigate("/signin")}
              className="rounded border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Sudah punya akun? Masuk
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer>
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 text-center text-xs text-[#B3B0A9] sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} NobiAI. Seluruh hak cipta dilindungi.</span>
        </div>
      </footer>

    </div>
  )
}

export default Landing
