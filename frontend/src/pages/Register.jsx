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
    <main className="grid min-h-screen bg-blue-50 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
      <section className="hidden flex-col justify-between py-6 lg:flex">
        <BrandLogo />
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold text-blue-700">
            Start strong
          </p>
          <h1 className="text-5xl font-bold leading-[1.08] text-slate-950">
            Create a clean account for your resume workflow.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Register once, then keep your profile, activity, and future resume
            intelligence tools in one place.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Your dashboard is protected and ready for upcoming resume workflows.
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 lg:hidden">
          <BrandLogo />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-blue-900/10 sm:p-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">Register</h2>
            <p className="mt-2 text-slate-600">
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
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-blue-300"
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

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-700 transition hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
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
