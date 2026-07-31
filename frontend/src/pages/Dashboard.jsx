import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import StatusMessage from '../components/StatusMessage'
import useAuth from '../hooks/useAuth'
import { getApiErrorMessage } from '../utils/errorMessages'

const activityItems = [
  'No resume uploads yet',
  'No ATS analysis has been generated',
  'Profile workspace is ready',
]

function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, logout, user } = useAuth()
  const [refreshError, setRefreshError] = useState('')

  useEffect(() => {
    let isMounted = true

    if (!user) {
      currentUser().catch((error) => {
        if (isMounted) {
          setRefreshError(getApiErrorMessage(error))
        }
      })
    }

    return () => {
      isMounted = false
    }
  }, [currentUser, user])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  const displayName = user?.fullName || 'ResumeAI user'
  const displayEmail = user?.email || 'Email unavailable'

  return (
    <div className="min-h-screen bg-blue-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <BrandLogo />
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <StatusMessage>{refreshError}</StatusMessage>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
          <p className="text-sm font-semibold text-blue-700">Dashboard</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
                Welcome, {displayName}
              </h1>
              <p className="mt-2 text-slate-600">{displayEmail}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              Authenticated session
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
            <h2 className="text-lg font-semibold text-slate-950">
              Recent Activity
            </h2>
            <div className="mt-5 space-y-4">
              {activityItems.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
            <h2 className="text-lg font-semibold text-slate-950">
              Resume Upload
            </h2>
            <div className="mt-5 grid min-h-40 place-items-center rounded-lg border border-dashed border-blue-200 bg-blue-50 px-5 text-center">
              <div>
                <p className="font-semibold text-blue-800">Upload placeholder</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Resume upload will appear here when the module is added.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
            <h2 className="text-lg font-semibold text-slate-950">ATS Score</h2>
            <div className="mt-5 grid min-h-40 place-items-center rounded-lg bg-slate-50 px-5 text-center">
              <div>
                <p className="text-5xl font-bold text-blue-700">--</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Score placeholder for future resume analysis.
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
