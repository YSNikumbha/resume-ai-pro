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
      <section className="page-enter">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Resume History</p>
            <h1 className="mt-3 text-3xl font-black text-white">
              Your career workspace
            </h1>
            <p className="mt-2 text-slate-400">
              Review uploaded PDFs, resume status, analysis readiness, and chat
              index state.
            </p>
          </div>
          <Link to="/resumes/upload" className="primary-button min-h-11 w-full px-5 sm:w-auto">
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
          <div className="mt-8 rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/10 p-8 text-center">
            <p className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/40 to-cyan-400/20 text-sm font-black text-cyan-100">
              PDF
            </p>
            <h2 className="mt-5 text-xl font-black text-white">
              Your career workspace is empty.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Upload your first PDF resume to unlock analysis, matching, and
              resume chat.
            </p>
            <Link to="/resumes/upload" className="primary-button mt-6 min-h-11 px-5">
              Upload Your First Resume
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_0.65fr_0.7fr_auto] gap-4 border-b border-slate-800 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 lg:grid">
              <span>Resume</span>
              <span>Uploaded</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                deleting={deletingId === resume.id}
                resume={resume}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </AuthenticatedLayout>
  )
}

function ResumeCard({ deleting, onDelete, resume }) {
  const indexStatus = resume.indexStatus || 'NOT_INDEXED'

  return (
    <article className="border-b border-slate-800 p-5 transition last:border-b-0 hover:bg-slate-900/60">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_0.65fr_0.7fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-300/20 bg-red-500/10 text-[11px] font-black text-red-100">
              PDF
            </span>
            <div className="min-w-0">
              <h2 className="break-words text-base font-black text-white">
                {resume.originalFileName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {formatFileSize(resume.fileSize)}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-400">
          <span className="lg:hidden">Uploaded </span>
          {formatDateTime(resume.uploadedAt)}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="status-pill status-cyan">Analysis ready</span>
          <span className={`status-pill ${getIndexStatusTone(indexStatus)}`}>
            {formatIndexStatus(indexStatus)}
          </span>
        </div>

        <div className="mobile-action-grid shrink-0 lg:justify-end">
          <Link to={`/resumes/${resume.id}`} className="primary-button min-h-10 px-4 py-2">
            View
          </Link>
          <Link to={`/resumes/${resume.id}`} className="secondary-button min-h-10 px-4 py-2">
            Analyze
          </Link>
          <Link
            to={`/job-matches/new?resumeId=${resume.id}`}
            className="secondary-button min-h-10 px-4 py-2"
          >
            Match
          </Link>
          <Link
            to={`/resumes/${resume.id}/chat`}
            className="secondary-button min-h-10 px-4 py-2"
          >
            Chat
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(resume)}
            className="danger-button min-h-10 px-4 py-2"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

function getIndexStatusTone(status) {
  switch (status) {
    case 'INDEXED':
      return 'status-green'
    case 'INDEXING':
      return 'status-cyan'
    case 'FAILED':
      return 'status-red'
    default:
      return 'status-slate'
  }
}

function formatIndexStatus(status) {
  switch (status) {
    case 'INDEXED':
      return 'Indexed'
    case 'INDEXING':
      return 'Indexing'
    case 'FAILED':
      return 'Index failed'
    default:
      return 'Not indexed'
  }
}

export default ResumeHistory
