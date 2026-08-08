import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import BrandLogo from '../components/BrandLogo'
import FormInput from '../components/FormInput'
import LoadingSpinner from '../components/LoadingSpinner'
import PasswordField from '../components/PasswordField'
import StatusMessage from '../components/StatusMessage'
import useAuth from '../hooks/useAuth'
import { getApiErrorMessage } from '../utils/errorMessages'
import { validateRegister } from '../utils/validators'

const initialValues = {
  confirmPassword: '',
  email: '',
  fullName: '',
  password: '',
}

function Register() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

    const nextErrors = validateRegister(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    setServerError('')

    try {
      await apiClient.post('/auth/register', {
        email: values.email.trim(),
        fullName: values.fullName.trim(),
        password: values.password,
      })
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. You can now login.' },
      })
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
          <p className="eyebrow mb-4">Start strong</p>
          <h1 className="text-5xl font-black leading-[1.08] text-white">
            Create your modern{' '}
            <span className="gradient-text">resume intelligence workspace.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Register once, then keep uploads, analyses, job matches, and resume
            chat in one polished AI workspace.
          </p>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-500">
          Your dashboard is protected and ready for resume analysis, matching,
          and source-grounded chat.
        </p>
      </section>

      <section className="ai-main mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 lg:hidden">
          <BrandLogo />
        </div>
        <div className="glass-card glow-card page-enter p-6 sm:p-8">
          <div>
            <p className="eyebrow">Create account</p>
            <h2 className="mt-3 text-3xl font-black text-white">Register</h2>
            <p className="mt-2 text-slate-400">
              Create your ResumeAI Pro account.
            </p>
          </div>

          <div className="mt-6">
            <StatusMessage>{serverError}</StatusMessage>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <FormInput
              id="fullName"
              label="Full Name"
              value={values.fullName}
              error={errors.fullName}
              autoComplete="name"
              placeholder="Yash Nikumbha"
              onChange={handleChange}
            />
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
              autoComplete="new-password"
              placeholder="Create a password"
              showPassword={showPassword}
              onChange={handleChange}
              onToggleVisibility={() => setShowPassword((current) => !current)}
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              value={values.confirmPassword}
              error={errors.confirmPassword}
              autoComplete="new-password"
              placeholder="Confirm your password"
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
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-cyan-200 transition hover:text-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
            >
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Register
