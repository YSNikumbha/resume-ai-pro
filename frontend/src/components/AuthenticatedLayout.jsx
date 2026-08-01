import { NavLink, useNavigate } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import useAuth from '../hooks/useAuth'

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Upload Resume', to: '/resumes/upload' },
  { label: 'Resume History', to: '/resumes' },
  { label: 'Match Resume', to: '/job-matches/new' },
  { label: 'Job Match History', to: '/job-matches' },
]

function AuthenticatedLayout({ children }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-blue-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 lg:hidden"
            >
              Logout
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" aria-label="Primary navigation">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 lg:inline-flex"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  )
}

export default AuthenticatedLayout
