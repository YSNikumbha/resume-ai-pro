import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import useAuth from '../hooks/useAuth'

const features = [
  {
    title: 'Structured resume workspace',
    description:
      'Keep profile details, experience, and resume progress organized before deeper AI workflows arrive.',
  },
  {
    title: 'Secure account foundation',
    description:
      'JWT authentication keeps every private dashboard view behind a protected session.',
  },
  {
    title: 'ATS-ready direction',
    description:
      'Built around resume quality signals, score visibility, and job-search workflows from day one.',
  },
]

const steps = [
  'Create your ResumeAI Pro account',
  'Sign in to your secure dashboard',
  'Track resume activity and prepare for analysis',
]

function Landing() {
  const { isAuthenticated } = useAuth()
  const signedIn = isAuthenticated()

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <BrandLogo />
          <div className="flex items-center gap-3">
            {signedIn ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-blue-50/70">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:px-10 lg:py-20">
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-sm font-semibold text-blue-700">
                Professional resume intelligence
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] text-slate-950 sm:text-5xl lg:text-6xl">
                Build resumes that make hiring systems easier to read.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                ResumeAI Pro gives candidates a clean workspace for resume
                progress, account security, and ATS-focused improvement.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={signedIn ? '/dashboard' : '/register'}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {signedIn ? 'Open dashboard' : 'Start free'}
                </Link>
                <Link
                  to={signedIn ? '/dashboard' : '/login'}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {signedIn ? 'View account' : 'Login'}
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-blue-900/10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Resume workspace
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Candidate dashboard preview
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  Secure
                </div>
              </div>

              <div className="grid gap-5 py-5 sm:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="h-4 w-32 rounded-lg bg-blue-100" />
                  <div className="space-y-3">
                    <div className="h-3 rounded-lg bg-slate-100" />
                    <div className="h-3 w-5/6 rounded-lg bg-slate-100" />
                    <div className="h-3 w-4/6 rounded-lg bg-slate-100" />
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="mb-3 h-3 w-24 rounded-lg bg-slate-100" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-16 rounded-lg bg-blue-50" />
                      <div className="h-16 rounded-lg bg-slate-50" />
                      <div className="h-16 rounded-lg bg-emerald-50" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-900">
                    ATS Score
                  </p>
                  <div className="mt-5 grid aspect-square place-items-center rounded-lg bg-white">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-700">82</p>
                      <p className="mt-1 text-sm text-slate-500">Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-700">Features</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">
              A focused foundation for serious resume work.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5"
              >
                <h3 className="text-lg font-semibold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">
                From signup to resume readiness in minutes.
              </h2>
            </div>
            <div className="grid gap-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-blue-900/5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="self-center font-medium text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-lg border border-blue-100 bg-blue-600 p-8 text-white shadow-lg shadow-blue-900/20 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold">Ready to sharpen your resume?</h2>
              <p className="mt-3 max-w-2xl text-blue-50">
                Create your account and open the dashboard built for the next
                ResumeAI Pro workflows.
              </p>
            </div>
            <Link
              to={signedIn ? '/dashboard' : '/register'}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/40"
            >
              {signedIn ? 'Go to dashboard' : 'Create account'}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row lg:px-10">
          <p>ResumeAI Pro</p>
          <p>Modern resume intelligence for ambitious candidates.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
