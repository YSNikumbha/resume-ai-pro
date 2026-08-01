import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import { createJobMatch } from '../services/jobMatchService'
import { getResumes } from '../services/resumeService'
import { getApiErrorMessage } from '../utils/errorMessages'
import { formatDateTime } from '../utils/resumeFormatters'

const DESCRIPTION_MIN_LENGTH = 50
const DESCRIPTION_MAX_LENGTH = 20000

function CreateJobMatch() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [resumes, setResumes] = useState([])
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    resumeId: '',
    title: '',
    companyName: '',
    description: '',
  })

  useEffect(() => {
    let isMounted = true

    async function loadResumes() {
      try {
        const resumeData = await getResumes()
        if (!isMounted) {
          return
        }

        const requestedResumeId = searchParams.get('resumeId')
        const selectedResumeId = resumeData.some(
          (resume) => String(resume.id) === requestedResumeId,
        )
          ? requestedResumeId
          : String(resumeData[0]?.id || '')

        setResumes(resumeData)
        setForm((current) => ({
          ...current,
          resumeId: current.resumeId || selectedResumeId,
        }))
      } catch (error) {
        if (isMounted) {
          setError(getApiErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setLoadingResumes(false)
        }
      }
    }

    loadResumes()

    return () => {
      isMounted = false
    }
  }, [searchParams])

  const descriptionLength = form.description.length
  const selectedResume = useMemo(
    () => resumes.find((resume) => String(resume.id) === form.resumeId),
    [form.resumeId, resumes],
  )

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
  }

  function validate() {
    const nextErrors = {}
    const description = form.description.trim()

    if (!form.resumeId) {
      nextErrors.resumeId = 'Choose a resume.'
    }

    if (!form.title.trim()) {
      nextErrors.title = 'Job title is required.'
    } else if (form.title.trim().length > 160) {
      nextErrors.title = 'Job title must be 160 characters or fewer.'
    }

    if (form.companyName.trim().length > 160) {
      nextErrors.companyName = 'Company name must be 160 characters or fewer.'
    }

    if (!description) {
      nextErrors.description = 'Job description is required.'
    } else if (description.length < DESCRIPTION_MIN_LENGTH) {
      nextErrors.description = `Job description must be at least ${DESCRIPTION_MIN_LENGTH} characters.`
    } else if (description.length > DESCRIPTION_MAX_LENGTH) {
      nextErrors.description = `Job description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting || resumes.length === 0 || !validate()) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const match = await createJobMatch({
        resumeId: Number(form.resumeId),
        title: form.title.trim(),
        companyName: form.companyName.trim() || null,
        description: form.description.trim(),
      })
      navigate(`/job-matches/${match.id}`)
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Job Matching</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Match Resume With Job
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Paste the complete job description for a more accurate comparison.
            </p>
          </div>
          <Link
            to="/job-matches"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Match history
          </Link>
        </div>

        <div className="mt-6">
          <StatusMessage>{error}</StatusMessage>
        </div>

        {loadingResumes ? (
          <div className="mt-10 grid place-items-center py-12">
            <LoadingSpinner label="Loading resumes" size="lg" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-6">
            <p className="text-sm leading-6 text-slate-700">
              Upload a PDF resume before creating a job match.
            </p>
            <Link
              to="/resumes/upload"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Upload Resume
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
            <div>
              <label
                htmlFor="resumeId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Resume
              </label>
              <select
                id="resumeId"
                value={form.resumeId}
                onChange={(event) => updateField('resumeId', event.target.value)}
                className={`h-12 w-full rounded-lg border bg-white px-4 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
                  fieldErrors.resumeId ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.originalFileName}
                  </option>
                ))}
              </select>
              {fieldErrors.resumeId ? (
                <p className="mt-2 text-sm text-red-600">
                  {fieldErrors.resumeId}
                </p>
              ) : null}
              {selectedResume ? (
                <p className="mt-2 text-sm text-slate-500">
                  Uploaded {formatDateTime(selectedResume.uploadedAt)}
                </p>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <TextField
                error={fieldErrors.title}
                id="title"
                label="Job title"
                onChange={(value) => updateField('title', value)}
                placeholder="Senior Java Developer"
                value={form.title}
              />
              <TextField
                error={fieldErrors.companyName}
                id="companyName"
                label="Company name"
                onChange={(value) => updateField('companyName', value)}
                placeholder="Acme"
                value={form.companyName}
              />
            </div>

            <div>
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-700"
                >
                  Job description
                </label>
                <span
                  className={`text-xs font-semibold ${
                    descriptionLength > DESCRIPTION_MAX_LENGTH
                      ? 'text-red-600'
                      : 'text-slate-500'
                  }`}
                >
                  {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                placeholder="Paste the full role description, responsibilities, required skills, preferred skills, qualifications, and company context."
                rows={14}
                className={`w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
                  fieldErrors.description ? 'border-red-300' : 'border-slate-200'
                }`}
              />
              {fieldErrors.description ? (
                <p className="mt-2 text-sm text-red-600">
                  {fieldErrors.description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitting || resumes.length === 0}
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-blue-300"
              >
                {submitting ? 'Matching...' : 'Create Match'}
              </button>
              {submitting ? (
                <p className="text-sm text-slate-600">
                  Comparing your resume with this role. This may take a few
                  seconds.
                </p>
              ) : null}
            </div>
          </form>
        )}
      </section>
    </AuthenticatedLayout>
  )
}

function TextField({ error, id, label, onChange, placeholder, value }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-12 w-full rounded-lg border bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export default CreateJobMatch
