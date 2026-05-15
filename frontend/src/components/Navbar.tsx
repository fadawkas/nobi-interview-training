import { Link, NavLink, useNavigate } from "react-router-dom"

export type NavbarNavItem = {
  label: string
  to: string
}

type NavbarProps = {
  logoTo?: string
  navItems?: NavbarNavItem[]
  showAuthActions?: boolean
  className?: string
}

function Navbar({
  logoTo = "/dashboard",
  navItems,
  showAuthActions = true,
  className = "",
}: NavbarProps) {
  const navigate = useNavigate()

  function handleSignOut(e: React.MouseEvent) {
    e.preventDefault()
    localStorage.removeItem("nobiai_auth_token")
    localStorage.removeItem("nobiai_auth_user")
    navigate("/signin")
  }

  return (
    <header className={`sticky top-0 z-50 border-b border-[#E8E8E6] bg-white/95 backdrop-blur-sm ${className}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        {/* Left: Logo + Nav */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            to={logoTo}
            className="flex shrink-0 items-center gap-2 transition hover:opacity-80"
          >
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded">
              <img src="/NobiAI_Logo.png" alt="NobiAI Logo" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-base font-semibold text-[#37352F]">NobiAI</span>
          </Link>

          {navItems && navItems.length > 0 ? (
            <nav className="hidden items-center gap-0.5 sm:flex ml-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded px-2.5 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "text-[#37352F] bg-[#F1F1EF]"
                        : "text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : null}
        </div>

        {/* Right: Auth actions */}
        {showAuthActions ? (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/profile"
              className="rounded px-2.5 py-1.5 text-sm font-medium text-[#787774] transition hover:bg-[#F1F1EF] hover:text-[#37352F]"
            >
              Profil
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded bg-[#37352F] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#37352F]/90"
            >
              Keluar
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default Navbar