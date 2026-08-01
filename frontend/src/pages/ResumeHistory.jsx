import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import { deleteResume, getResumes } from '../services/resumeService'
import { getApiErrorMessage } from '../utils/errorMessages'
import { formatDateTime, formatFileSize } from '../utils/resumeFormatters'

function ResumeHistory() {
  const location = useLocation()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || '',
  )
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadResumes() {
      try {
        const data = await getResumes()
        if (isMounted) {
          setResumes(data)
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

    loadResumes()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleDelete(resume) {
    const confirmed = window.confirm(
      `Delete "${resume.originalFileName}" from your resume history?`,
    )

    if (!confirmed) {
      return
    }

    setDeletingId(resume.id)
    setError('')
    setSuccessMessage('')

    try {
      await deleteResume(resume.id)
      setResumes((current) => current.filter((item) => item.id !== resume.id))
      setSuccessMessage('Resume deleted successfully.')
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AuthenticatedLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              Resume History
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Your uploaded resumes
            </h1>
            <p className="mt-2 text-slate-600">
              Review PDF uploads and their extracted text previews.
            </p>
          </div>
          <Link
            to="/resumes/upload"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Upload Resume
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          <StatusMessage>{error}</StatusMessage>
          <StatusMessage type="success">{successMessage}</StatusMessage>
        </div>

        {loading ? (
          <div className="mt-10 grid place-items-center py-10">
            <LoadingSpinner label="Loading resumes" size="lg" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              No resumes uploaded yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Upload your first PDF resume to start building your history.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {resumes.map((resume) => (
              <article
                key={resume.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-blue-900/5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold text-slate-950">
                      {resume.originalFileName}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{formatFileSize(resume.fileSize)}</span>
                      <span>{formatDateTime(resume.uploadedAt)}</span>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {resume.extractedTextPreview}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      to={`/resumes/${resume.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === resume.id}
                      onClick={() => handleDelete(resume)}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:text-red-300"
                    >
                      {deletingId === resume.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AuthenticatedLayout>
  )
}

export default ResumeHistory
