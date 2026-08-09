import { useEffect, useMemo, useState } from 'react'
import { NavLink, matchPath, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import useAuth from '../hooks/useAuth'

const sidebarSections = [
  {
    title: 'OVERVIEW',
    items: [
      {
        icon: 'DB',
        label: 'Dashboard',
        to: '/dashboard',
        activePatterns: ['/dashboard'],
      },
    ],
  },
  {
    title: 'RESUMES',
    items: [
      {
        icon: 'UP',
        label: 'Upload Resume',
        to: '/resumes/upload',
        activePatterns: ['/resumes/upload'],
      },
      {
        icon: 'CV',
        label: 'My Resumes',
        to: '/resumes',
        activePatterns: [
          '/resumes',
          '/resumes/:id',
          '/resumes/:resumeId/chat',
          '/analyses/:analysisId',
        ],
        excludePatterns: ['/resumes/upload'],
      },
    ],
  },
  {
    title: 'JOB TOOLS',
    items: [
      {
        icon: 'JM',
        label: 'Match Resume',
        to: '/job-matches/new',
        activePatterns: ['/job-matches/new'],
      },
      {
        icon: 'JH',
        label: 'Job Match History',
        to: '/job-matches',
        activePatterns: ['/job-matches', '/job-matches/:id'],
        excludePatterns: ['/job-matches/new'],
      },
    ],
  },
]

const pageTitles = [
  { pattern: '/dashboard', title: 'Dashboard' },
  { pattern: '/resumes/upload', title: 'Upload Resume' },
  { pattern: '/resumes', title: 'My Resumes' },
  { pattern: '/resumes/:resumeId/chat', title: 'Resume Chat' },
  { pattern: '/resumes/:id', title: 'Resume Details' },
  { pattern: '/analyses/:analysisId', title: 'AI Analysis' },
  { pattern: '/job-matches/new', title: 'Match Resume' },
  { pattern: '/job-matches', title: 'Job Match History' },
  { pattern: '/job-matches/:id', title: 'Job Match Details' },
]

function DashboardLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const accountName = user?.fullName || user?.name || user?.email || 'Account'
  const accountEmail = user?.email || 'Career workspace'
  const initials = getInitials(accountName)
  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname],
  )

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="ai-page app-shell">
      <Sidebar
        accountEmail={accountEmail}
        accountName={accountName}
        className="fixed inset-y-0 left-0 z-40 hidden w-[250px] lg:flex"
        initials={initials}
        onLogout={handleLogout}
        pathname={location.pathname}
      />

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm"
            aria-label="Close navigation menu"
            onClick={() => setDrawerOpen(false)}
          />
          <Sidebar
            accountEmail={accountEmail}
            accountName={accountName}
            className="relative z-10 flex h-full w-[min(18rem,86vw)] max-w-full"
            initials={initials}
            onLogout={handleLogout}
            pathname={location.pathname}
          />
        </div>
      ) : null}

      <div className="ai-main app-main-shell flex flex-col lg:pl-[250px]">
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#070b14]/82 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:gap-4 sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="secondary-button min-h-10 px-3 py-2 lg:hidden"
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
              >
                Menu
              </button>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  ResumeAI Pro
                </p>
                <h1 className="truncate text-lg font-black text-white sm:text-xl">
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-44 truncate text-sm font-black text-white">
                  {accountName}
                </p>
                <p className="max-w-44 truncate text-xs font-semibold text-slate-500">
                  {accountEmail}
                </p>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-100 sm:h-10 sm:w-10">
                {initials}
              </span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-8 sm:py-6 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

function Sidebar({
  accountEmail,
  accountName,
  className,
  initials,
  onLogout,
  pathname,
}) {
  return (
    <aside
      className={`${className} flex-col border-r border-slate-800/90 bg-slate-950/92 shadow-2xl shadow-slate-950/35 backdrop-blur-xl`}
    >
      <div className="border-b border-slate-800/80 px-5 py-5">
        <BrandLogo to="/dashboard" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Authenticated navigation">
        <div className="space-y-6">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                {section.title}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <SidebarNavLink
                    key={`${section.title}-${item.label}`}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
          ACCOUNT
        </p>
        <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-100">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{accountName}</p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {accountEmail}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-2xl border border-slate-800 bg-transparent px-3 text-sm font-black text-slate-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100 focus:outline-none focus:ring-4 focus:ring-red-400/20"
        >
          <IconBadge label="LO" />
          Logout
        </button>
      </div>
    </aside>
  )
}

function SidebarNavLink({ item, pathname }) {
  const active = isItemActive(item, pathname)

  return (
    <NavLink
      to={item.to}
      className={() =>
        `relative flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-cyan-300/20 ${
          active
            ? 'bg-indigo-500/10 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-cyan-300'
            : 'text-slate-400 hover:bg-slate-900/70 hover:text-white'
        }`
      }
    >
      <IconBadge active={active} label={item.icon} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

function IconBadge({ active = false, label }) {
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-[10px] font-black transition ${
        active
          ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100'
          : 'border-slate-800 bg-slate-950/60 text-slate-500'
      }`}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}

function isItemActive(item, pathname) {
  if (
    item.excludePatterns?.some((pattern) =>
      matchPath({ path: pattern, end: true }, pathname),
    )
  ) {
    return false
  }

  return item.activePatterns.some((pattern) =>
    matchPath({ path: pattern, end: true }, pathname),
  )
}

function getPageTitle(pathname) {
  const match = pageTitles.find((item) =>
    matchPath({ path: item.pattern, end: true }, pathname),
  )

  return match?.title || 'Workspace'
}

function getInitials(name) {
  const initials = String(name || 'Account')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return initials || 'AI'
}

export default DashboardLayout
