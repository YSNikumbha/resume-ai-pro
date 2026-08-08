import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import {
  deleteJobMatch,
  getJobMatches,
} from '../services/jobMatchService'
import { getStatusClasses } from '../utils/analysisFormatters'
import { getApiErrorMessage } from '../utils/errorMessages'
import { getJobMatchScoreMeta } from '../utils/jobMatchFormatters'
import { formatDateTime } from '../utils/resumeFormatters'

function JobMatchHistory() {
  const location = useLocation()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.message || '')

  const loadMatches = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getJobMatches()
      setMatches(data)
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  async function handleDelete(match) {
    if (deletingId) {
      return
    }

    const confirmed = window.confirm(
      `Delete the match for "${match.jobTitle}"?`,
    )

    if (!confirmed) {
      return
    }

    setDeletingId(match.id)
    setError('')
    setMessage('')

    try {
      await deleteJobMatch(match.id)
      setMatches((current) =>
        current.filter((item) => item.id !== match.id),
      )
      setMessage('Job match deleted successfully.')
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AuthenticatedLayout>
      <section className="page-enter">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Job Matching</p>
            <h1 className="mt-3 text-3xl font-black text-white">
              Job Match History
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Review saved resume-to-job comparisons, scores, statuses, and
              recommendations.
            </p>
          </div>
          <Link to="/job-matches/new" className="primary-button min-h-10 w-fit px-4 py-2">
            New Job Match
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          <StatusMessage type="success">{message}</StatusMessage>
          <StatusMessage>{error}</StatusMessage>
        </div>

        {loading ? (
          <div className="mt-10 grid place-items-center py-12">
            <LoadingSpinner label="Loading job matches" size="lg" />
          </div>
        ) : matches.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/10 p-8">
            <p className="text-xl font-black text-white">No job matches yet.</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Compare a resume with a job description to create your first AI
              match report.
            </p>
            <Link to="/job-matches/new" className="primary-button mt-5 min-h-10 px-4 py-2">
              Create Match
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="hidden grid-cols-[minmax(0,1.25fr)_0.9fr_0.65fr_auto] gap-4 border-b border-slate-800 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 lg:grid">
              <span>Role</span>
              <span>Resume</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {matches.map((match) => (
              <MatchHistoryItem
                key={match.id}
                deleting={deletingId === match.id}
                match={match}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </AuthenticatedLayout>
  )
}

function MatchHistoryItem({ deleting, match, onDelete }) {
  const score = Number.isFinite(match.matchScore) ? match.matchScore : null
  const scoreMeta = getJobMatchScoreMeta(score)

  return (
    <article className="border-b border-slate-800 p-5 transition last:border-b-0 hover:bg-slate-900/60">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_0.9fr_0.65fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-[11px] font-black text-cyan-100">
              JM
            </span>
            <div className="min-w-0">
              <h2 className="break-words text-base font-black text-white">
                {match.jobTitle}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {match.companyName || 'Company unavailable'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTime(match.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <p className="break-words text-sm font-semibold text-slate-400">
          {match.resumeFileName}
        </p>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${scoreMeta.bg} ${scoreMeta.text}`}
          >
            {score ?? '--'}% · {scoreMeta.label}
          </span>
          <span
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
              match.status,
            )}`}
          >
            {match.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link to={`/job-matches/${match.id}`} className="primary-button min-h-10 px-4 py-2">
            View
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(match)}
            className="danger-button min-h-10 px-4 py-2"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default JobMatchHistory
