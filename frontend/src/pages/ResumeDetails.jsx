import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import { deleteResume, getResumeById } from '../services/resumeService'
import { getApiErrorMessage } from '../utils/errorMessages'
import { formatDateTime, formatFileSize } from '../utils/resumeFormatters'

function ResumeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadResume() {
      try {
        const data = await getResumeById(id)
        if (isMounted) {
          setResume(data)
        }
      } catch (error) {
        if (isMounted) {
          setError(getApiErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadResume()

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleDelete() {
    if (!resume) {
      return
    }

    const confirmed = window.confirm(
      `Delete "${resume.originalFileName}" from your resume history?`,
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      await deleteResume(resume.id)
      navigate('/resumes', {
        replace: true,
        state: { message: 'Resume deleted successfully.' },
      })
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/resumes"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Back
          </Link>

          {resume ? (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:text-red-300"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          <StatusMessage>{error}</StatusMessage>
        </div>

        {loading ? (
          <div className="mt-10 grid place-items-center py-10">
            <LoadingSpinner label="Loading resume" size="lg" />
          </div>
        ) : resume ? (
          <>
            <div className="mt-6 border-b border-slate-200 pb-6">
              <p className="text-sm font-semibold text-blue-700">
                Resume Details
              </p>
              <h1 className="mt-2 break-words text-3xl font-bold text-slate-950">
                {resume.originalFileName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>{formatFileSize(resume.fileSize)}</span>
                <span>{formatDateTime(resume.uploadedAt)}</span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-950">
                Extracted resume text
              </h2>
              <pre className="mt-4 max-h-[65vh] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {resume.extractedText}
              </pre>
            </div>
          </>
        ) : null}
      </section>
    </AuthenticatedLayout>
  )
}

export default ResumeDetails
