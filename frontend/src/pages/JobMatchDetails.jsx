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
        <section className="glass-card p-6 sm:p-8">
          <StatusMessage>{error}</StatusMessage>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={loadMatch} className="primary-button min-h-10 px-4 py-2">
              Try again
            </button>
            <Link to="/job-matches" className="secondary-button min-h-10 px-4 py-2">
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
      <div className="page-enter flex flex-col gap-6">
        <section className="glass-card glow-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Job Match</p>
              <h1 className="mt-3 break-words text-3xl font-black text-white sm:text-4xl">
                {match.jobTitle}
              </h1>
              <p className="mt-2 text-lg font-semibold text-slate-400">
                {match.companyName || 'Company unavailable'}
              </p>
              <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                <MetaItem label="Resume" value={match.resumeFileName} />
                <MetaItem label="Date" value={formatDateTime(match.createdAt)} />
                <MetaItem label="Model" value={match.modelName || 'Model unavailable'} />
                <MetaItem label="Status label" value={scoreMeta.label} />
              </dl>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`inline-flex min-h-10 items-center rounded-xl border px-4 text-sm font-bold ${getStatusClasses(
                  match.status,
                )}`}
              >
                {match.status}
              </span>
              <Link to={`/resumes/${match.resumeId}`} className="secondary-button min-h-10 px-4 py-2">
                Back to Resume
              </Link>
              <Link to="/job-matches" className="secondary-button min-h-10 px-4 py-2">
                Back
              </Link>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="danger-button min-h-10 px-4 py-2"
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

        <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <article className="glass-card p-6">
            <MatchScore score={score} scoreMeta={scoreMeta} />
            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              This match score is AI-generated guidance and does not guarantee
              interview selection.
            </p>
          </article>

          <ReportSection title="Executive Summary" tone="cyan">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {match.summary || 'No summary returned.'}
            </p>
          </ReportSection>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ReportSection title="Matched Skills" tone="green">
            <TagList
              items={match.matchedSkills}
              emptyText="No matched skills returned."
              tone="green"
            />
          </ReportSection>

          <ReportSection title="Missing Skills" tone="amber">
            <TagList
              items={match.missingSkills}
              emptyText="No missing skills returned."
              tone="danger"
            />
          </ReportSection>

          <MatchSectionCard title="Experience Alignment" section={match.experienceMatch} />
          <MatchSectionCard title="Education Alignment" section={match.educationMatch} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ReportSection title="Why You Match" tone="green">
            <BulletList
              items={match.strengths}
              emptyText="No strengths returned."
              tone="green"
            />
          </ReportSection>

          <ReportSection title="Gaps To Address" tone="amber">
            <BulletList items={match.gaps} emptyText="No gaps returned." tone="amber" />
          </ReportSection>

          <ReportSection title="Recommended Resume Changes" tone="indigo">
            <NumberedList
              items={match.recommendations}
              emptyText="No recommendations returned."
            />
          </ReportSection>

          <ReportSection title="Suggested Keywords" tone="cyan">
            <TagList
              items={match.keywordSuggestions}
              emptyText="No keyword suggestions returned."
              tone="cyan"
            />
          </ReportSection>
        </section>
      </div>
    </AuthenticatedLayout>
  )
}

function MetaItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
      <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-bold text-slate-200">{value}</dd>
    </div>
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
        className="score-ring grid h-48 w-48 place-items-center rounded-full p-2 shadow-[0_0_44px_rgba(34,211,238,0.12)]"
        style={{
          background: `conic-gradient(${scoreMeta.color} ${degrees}deg, rgba(148, 163, 184, 0.14) 0deg)`,
        }}
      >
        <div className="grid h-full w-full place-items-center rounded-full border border-slate-700/60 bg-slate-950/95">
          <div>
            <p className="text-5xl font-black text-white">{displayedScore}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Match score
            </p>
          </div>
        </div>
      </div>
      <span
        className={`mt-5 rounded-xl px-3 py-2 text-sm font-bold ${scoreMeta.bg} ${scoreMeta.text}`}
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
    <ReportSection title={title} tone="purple">
      <div className="flex flex-wrap items-center gap-2">
        <span className="status-pill status-slate">Score {score ?? '--'}</span>
        <span
          className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.08em] ${getSectionStatusClasses(
            status,
          )}`}
        >
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">
        {section?.explanation || 'No explanation returned.'}
      </p>
    </ReportSection>
  )
}

function ReportSection({ children, title, tone = 'indigo' }) {
  return (
    <section className={`glass-card p-6 ${getSectionAccent(tone)}`}>
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function TagList({ emptyText, items = [], tone = 'cyan' }) {
  if (!items.length) {
    return <EmptyText>{emptyText}</EmptyText>
  }

  const classes = {
    amber: 'skill-pill warning-pill',
    cyan: 'skill-pill cyan-pill',
    danger: 'skill-pill danger-pill',
    green: 'skill-pill success-pill',
    indigo: 'skill-pill',
  }[tone]

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={classes}>
          {item}
        </span>
      ))}
    </div>
  )
}

function BulletList({ emptyText, items = [], tone = 'indigo' }) {
  if (!items.length) {
    return <EmptyText>{emptyText}</EmptyText>
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-3 text-sm leading-6 text-slate-300"
        >
          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${getBulletTone(tone)}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function NumberedList({ emptyText, items = [] }) {
  if (!items.length) {
    return <EmptyText>{emptyText}</EmptyText>
  }

  return (
    <ol className="grid gap-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-3 rounded-2xl border border-indigo-300/20 bg-indigo-500/10 p-4 text-sm leading-6 text-slate-300"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-black text-white">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function EmptyText({ children }) {
  return <p className="text-sm leading-6 text-slate-500">{children}</p>
}

function getSectionAccent(tone) {
  const tones = {
    amber: 'border-amber-300/20',
    cyan: 'border-cyan-300/20',
    green: 'border-emerald-300/20',
    indigo: 'border-indigo-300/20',
    purple: 'border-purple-300/20',
  }

  return tones[tone] || tones.indigo
}

function getBulletTone(tone) {
  const tones = {
    amber: 'bg-amber-400',
    cyan: 'bg-cyan-300',
    green: 'bg-emerald-400',
    indigo: 'bg-indigo-400',
    purple: 'bg-purple-400',
  }

  return tones[tone] || tones.indigo
}

export default JobMatchDetails
