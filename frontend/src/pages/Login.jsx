import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import FormInput from '../components/FormInput'
import LoadingSpinner from '../components/LoadingSpinner'
import PasswordField from '../components/PasswordField'
import StatusMessage from '../components/StatusMessage'
import useAuth from '../hooks/useAuth'
import { getApiErrorMessage } from '../utils/errorMessages'
import { validateLogin } from '../utils/validators'

const initialValues = {
  email: '',
  password: '',
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading, login } = useAuth()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const successMessage = location.state?.message
  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (!loading && isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validateLogin(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    setServerError('')

    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      })
      navigate(from, { replace: true })
    } catch (error) {
      setServerError(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-blue-50 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
      <section className="hidden flex-col justify-between py-6 lg:flex">
        <BrandLogo />
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold text-blue-700">
            Welcome back
          </p>
          <h1 className="text-5xl font-bold leading-[1.08] text-slate-950">
            Continue building a resume that reads clearly.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Sign in to review your profile details, resume progress, and
            dashboard placeholders for upcoming analysis tools.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          ResumeAI Pro keeps private resume work behind a token-based session.
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 lg:hidden">
          <BrandLogo />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-blue-900/10 sm:p-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">Login</h2>
            <p className="mt-2 text-slate-600">
              Access your ResumeAI Pro dashboard.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <StatusMessage type="success">{successMessage}</StatusMessage>
            <StatusMessage>{serverError}</StatusMessage>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <FormInput
              id="email"
              label="Email"
              type="email"
              value={values.email}
              error={errors.email}
              autoComplete="email"
              placeholder="you@example.com"
              onChange={handleChange}
            />
            <PasswordField
              id="password"
              label="Password"
              value={values.password}
              error={errors.password}
              autoComplete="current-password"
              placeholder="Enter your password"
              showPassword={showPassword}
              onChange={handleChange}
              onToggleVisibility={() => setShowPassword((current) => !current)}
            />

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-blue-300"
            >
              {submitting ? (
                <>
                  <LoadingSpinner label="" size="sm" />
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to ResumeAI Pro?{' '}
            <Link
              to="/register"
              className="font-semibold text-blue-700 transition hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login
