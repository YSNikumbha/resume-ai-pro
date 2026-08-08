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
      <section className="glass-card glow-card page-enter p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Job Matching</p>
            <h1 className="mt-3 text-3xl font-black text-white">
              Match Resume With Job
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Paste the full opportunity details so AI can compare skills,
              experience, education, and keywords with your selected resume.
            </p>
          </div>
          <Link to="/job-matches" className="secondary-button min-h-10 w-fit px-4 py-2">
            Match History
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
          <div className="mt-8 rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/10 p-8">
            <p className="text-lg font-black text-white">No resumes available.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Upload a PDF resume before creating a job match.
            </p>
            <Link to="/resumes/upload" className="primary-button mt-5 min-h-10 px-4 py-2">
              Upload Resume
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6">
              <div className="glass-card p-5">
                <label htmlFor="resumeId" className="ai-label">
                  Resume
                </label>
                <select
                  id="resumeId"
                  value={form.resumeId}
                  onChange={(event) => updateField('resumeId', event.target.value)}
                  className={`ai-select ${
                    fieldErrors.resumeId ? '!border-red-400/70' : ''
                  }`}
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.originalFileName}
                    </option>
                  ))}
                </select>
                {fieldErrors.resumeId ? (
                  <p className="mt-2 text-sm font-semibold text-red-300">
                    {fieldErrors.resumeId}
                  </p>
                ) : null}
                {selectedResume ? (
                  <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
                    <p className="text-sm font-black text-white">
                      {selectedResume.originalFileName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Uploaded {formatDateTime(selectedResume.uploadedAt)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="glass-card p-5">
                <TextField
                  error={fieldErrors.title}
                  id="title"
                  label="Job title"
                  onChange={(value) => updateField('title', value)}
                  placeholder="Senior Java Developer"
                  value={form.title}
                />
              </div>

              <div className="glass-card p-5">
                <TextField
                  error={fieldErrors.companyName}
                  id="companyName"
                  label="Company name"
                  onChange={(value) => updateField('companyName', value)}
                  placeholder="Acme"
                  value={form.companyName}
                />
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="description" className="ai-label mb-0">
                  Job description
                </label>
                <span
                  className={`text-xs font-black ${
                    descriptionLength > DESCRIPTION_MAX_LENGTH
                      ? 'text-red-300'
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
                rows={17}
                className={`ai-textarea min-h-[28rem] text-sm leading-7 ${
                  fieldErrors.description ? '!border-red-400/70' : ''
                }`}
              />
              {fieldErrors.description ? (
                <p className="mt-2 text-sm font-semibold text-red-300">
                  {fieldErrors.description}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={submitting || resumes.length === 0}
                  aria-busy={submitting}
                  className="primary-button w-full sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner label="" size="sm" />
                      Matching...
                    </>
                  ) : (
                    'Create Match'
                  )}
                </button>
                {submitting ? (
                  <p className="text-sm font-semibold text-slate-300">
                    AI is comparing your resume with this opportunity
                    <span className="loading-dots ml-1 text-cyan-200" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  </p>
                ) : null}
              </div>
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
      <label htmlFor={id} className="ai-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`ai-input ${error ? '!border-red-400/70' : ''}`}
      />
      {error ? <p className="mt-2 text-sm font-semibold text-red-300">{error}</p> : null}
    </div>
  )
}

export default CreateJobMatch
