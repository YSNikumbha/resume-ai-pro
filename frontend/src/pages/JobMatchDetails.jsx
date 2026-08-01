import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import {
  deleteJobMatch,
  getJobMatchById,
} from '../services/jobMatchService'
import { getStatusClasses } from '../utils/analysisFormatters'
import { getApiErrorMessage } from '../utils/errorMessages'
import {
  getJobMatchScoreMeta,
  getSectionStatusClasses,
} from '../utils/jobMatchFormatters'
import { formatDateTime } from '../utils/resumeFormatters'

function JobMatchDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const loadMatch = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getJobMatchById(id)
      setMatch(data)
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadMatch()
  }, [loadMatch])

  async function handleDelete() {
    if (!match || deleting) {
      return
    }

    const confirmed = window.confirm(
      `Delete the match for "${match.jobTitle}"?`,
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      await deleteJobMatch(match.id)
      navigate('/job-matches', {
        replace: true,
        state: { message: 'Job match deleted successfully.' },
      })
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="grid min-h-96 place-items-center">
          <LoadingSpinner label="Loading job match" size="lg" />
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error && !match) {
    return (
      <AuthenticatedLayout>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
          <StatusMessage>{error}</StatusMessage>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadMatch}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Try again
            </button>
            <Link
              to="/job-matches"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Job match history
            </Link>
          </div>
        </section>
      </AuthenticatedLayout>
    )
  }

  if (!match) {
    return null
  }

  const score = Number.isFinite(match.matchScore) ? match.matchScore : null
  const scoreMeta = getJobMatchScoreMeta(score)

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700">Job Match</p>
              <h1 className="mt-2 break-words text-3xl font-bold text-slate-950">
                {match.jobTitle}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                <span>{match.companyName || 'Company unavailable'}</span>
                <span>{match.resumeFileName}</span>
                <span>{formatDateTime(match.createdAt)}</span>
                <span>{match.modelName || 'Model unavailable'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold ${getStatusClasses(
                  match.status,
                )}`}
              >
                {match.status}
              </span>
              <Link
                to={`/resumes/${match.resumeId}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Back to resume
              </Link>
              <Link
                to="/job-matches"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Back
              </Link>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:text-red-300"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <StatusMessage>{error}</StatusMessage>
            {match.status === 'FAILED' ? (
              <StatusMessage>
                {match.failureMessage || 'Job matching failed. Please try again.'}
              </StatusMessage>
            ) : null}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
            <MatchScore score={score} scoreMeta={scoreMeta} />
            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              This match score is AI-generated guidance and does not guarantee
              interview selection.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
            <h2 className="text-lg font-semibold text-slate-950">Summary</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {match.summary || 'No summary returned.'}
            </p>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ReportSection title="Matched Skills">
            <TagList
              items={match.matchedSkills}
              emptyText="No matched skills returned."
            />
          </ReportSection>

          <ReportSection title="Missing Skills">
            <TagList
              items={match.missingSkills}
              emptyText="No missing skills returned."
              tone="amber"
            />
          </ReportSection>

          <MatchSectionCard title="Experience Match" section={match.experienceMatch} />
          <MatchSectionCard title="Education Match" section={match.educationMatch} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ReportSection title="Strengths">
            <BulletList items={match.strengths} emptyText="No strengths returned." />
          </ReportSection>

          <ReportSection title="Gaps">
            <BulletList items={match.gaps} emptyText="No gaps returned." />
          </ReportSection>

          <ReportSection title="Recommendations">
            <BulletList
              items={match.recommendations}
              emptyText="No recommendations returned."
            />
          </ReportSection>

          <ReportSection title="Keyword Suggestions">
            <TagList
              items={match.keywordSuggestions}
              emptyText="No keyword suggestions returned."
              tone="emerald"
            />
          </ReportSection>
        </section>
      </div>
    </AuthenticatedLayout>
  )
}

function MatchScore({ score, scoreMeta }) {
  const displayedScore = Number.isFinite(score) ? score : '--'
  const degrees = Number.isFinite(score)
    ? Math.min(100, Math.max(0, score)) * 3.6
    : 0

  return (
    <div className="grid place-items-center text-center">
      <div
        className="grid h-44 w-44 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${scoreMeta.color} ${degrees}deg, #e2e8f0 0deg)`,
        }}
      >
        <div className="grid h-32 w-32 place-items-center rounded-full bg-white">
          <div>
            <p className="text-4xl font-bold text-slate-950">
              {displayedScore}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
              Match score
            </p>
          </div>
        </div>
      </div>
      <span
        className={`mt-5 rounded-lg px-3 py-2 text-sm font-semibold ${scoreMeta.bg} ${scoreMeta.text}`}
      >
        {scoreMeta.label}
      </span>
    </div>
  )
}

function MatchSectionCard({ title, section }) {
  const score = Number.isFinite(section?.score) ? section.score : null
  const status = section?.status || 'NOT_FOUND'

  return (
    <ReportSection title={title}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          Score {score ?? '--'}
        </span>
        <span
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${getSectionStatusClasses(
            status,
          )}`}
        >
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-700">
        {section?.explanation || 'No explanation returned.'}
      </p>
    </ReportSection>
  )
}

function ReportSection({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function TagList({ items = [], emptyText, tone = 'blue' }) {
  if (!items.length) {
    return <EmptyText>{emptyText}</EmptyText>
  }

  const classes = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }[tone]

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${classes}`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function BulletList({ items = [], emptyText }) {
  if (!items.length) {
    return <EmptyText>{emptyText}</EmptyText>
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-3 text-sm leading-6 text-slate-700"
        >
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function EmptyText({ children }) {
  return <p className="text-sm leading-6 text-slate-500">{children}</p>
}

export default JobMatchDetails
