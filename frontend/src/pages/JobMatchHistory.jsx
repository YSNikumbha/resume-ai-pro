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
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Job Matching</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Job Match History
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review saved resume-to-job comparisons and re-run matching from
              any resume details page.
            </p>
          </div>
          <Link
            to="/job-matches/new"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
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
          <div className="mt-8 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-6">
            <p className="text-sm leading-6 text-slate-700">
              No job matches yet.
            </p>
            <Link
              to="/job-matches/new"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Create Match
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
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
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-base font-semibold text-slate-950">
            {match.jobTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {match.companyName || 'Company unavailable'} · {match.resumeFileName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(match.createdAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${scoreMeta.bg} ${scoreMeta.text}`}
            >
              Match {score ?? '--'} · {scoreMeta.label}
            </span>
            <span
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                match.status,
              )}`}
            >
              {match.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/job-matches/${match.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            View
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(match)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:text-red-300"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default JobMatchHistory
