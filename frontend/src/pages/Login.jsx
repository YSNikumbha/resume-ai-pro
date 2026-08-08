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
    <main className="ai-page grid min-h-screen px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
      <section className="ai-main hidden flex-col justify-between py-6 lg:flex">
        <BrandLogo />
        <div className="max-w-xl">
          <p className="eyebrow mb-4">Welcome back</p>
          <h1 className="text-5xl font-black leading-[1.08] text-white">
            Continue building your{' '}
            <span className="gradient-text">AI-powered career edge.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Sign in to analyze resumes, monitor ATS signals, match against
            roles, and reopen your resume chat history.
          </p>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-500">
          ResumeAI Pro keeps private resume work inside your protected career
          workspace.
        </p>
      </section>

      <section className="ai-main mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 lg:hidden">
          <BrandLogo />
        </div>
        <div className="glass-card glow-card page-enter p-6 sm:p-8">
          <div>
            <p className="eyebrow">Secure access</p>
            <h2 className="mt-3 text-3xl font-black text-white">Login</h2>
            <p className="mt-2 text-slate-400">
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
              className="primary-button w-full"
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

          <p className="mt-6 text-center text-sm text-slate-400">
            New to ResumeAI Pro?{' '}
            <Link
              to="/register"
              className="font-bold text-cyan-200 transition hover:text-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
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
