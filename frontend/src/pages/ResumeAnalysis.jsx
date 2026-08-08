import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import { getAnalysis } from '../services/analysisService'
import { getScoreMeta, getStatusClasses } from '../utils/analysisFormatters'
import { getApiErrorMessage } from '../utils/errorMessages'
import { formatDateTime } from '../utils/resumeFormatters'

function ResumeAnalysis() {
  const { analysisId } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalysis = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAnalysis(analysisId)
      setAnalysis(data)
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [analysisId])

  useEffect(() => {
    loadAnalysis()
  }, [loadAnalysis])

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="grid min-h-96 place-items-center">
          <LoadingSpinner label="Loading analysis" size="lg" />
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <section className="glass-card p-6 sm:p-8">
          <StatusMessage>{error}</StatusMessage>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={loadAnalysis} className="primary-button min-h-10 px-4 py-2">
              Try again
            </button>
            <Link to="/resumes" className="secondary-button min-h-10 px-4 py-2">
              Resume history
            </Link>
          </div>
        </section>
      </AuthenticatedLayout>
    )
  }

  if (!analysis) {
    return null
  }

  const score = Number.isFinite(analysis.atsScore) ? analysis.atsScore : null
  const scoreMeta = getScoreMeta(score)
  const statusClasses = getStatusClasses(analysis.status)

  return (
    <AuthenticatedLayout>
      <div className="page-enter flex flex-col gap-6">
        <section className="glass-card glow-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Resume Analysis</p>
              <h1 className="mt-3 break-words text-3xl font-black text-white sm:text-4xl">
                {analysis.resumeFileName}
              </h1>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <MetaItem label="Analysis date" value={formatDateTime(analysis.analyzedAt)} />
                <MetaItem label="Model" value={analysis.modelName || 'Model unavailable'} />
                <MetaItem label="Status" value={analysis.status} />
              </dl>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`inline-flex min-h-10 items-center rounded-xl border px-4 text-sm font-bold ${statusClasses}`}
              >
                {analysis.status}
              </span>
              <Link to={`/resumes/${analysis.resumeId}`} className="secondary-button min-h-10 px-4 py-2">
                Back to Resume
              </Link>
            </div>
          </div>

          {analysis.status === 'FAILED' ? (
            <div className="mt-6">
              <StatusMessage>
                {analysis.failureMessage || 'Analysis failed. Please try again.'}
              </StatusMessage>
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <article className="glass-card p-6">
            <AtsScore score={score} scoreMeta={scoreMeta} />
            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              This score is AI-generated guidance and may differ from employer
              ATS systems.
            </p>
          </article>

          <ReportSection title="Summary" tone="cyan">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {analysis.summary || 'No summary returned.'}
            </p>
          </ReportSection>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ReportSection title="Strengths" tone="green">
            <BulletList
              items={analysis.strengths}
              emptyText="No strengths returned."
              tone="green"
            />
          </ReportSection>

          <ReportSection title="Improvements" tone="amber">
            <BulletList
              items={analysis.weaknesses}
              emptyText="No improvements returned."
              tone="amber"
            />
          </ReportSection>
        </section>

        <ReportSection title="Actionable Recommendations" tone="cyan">
          <NumberedList
            items={analysis.suggestions}
            emptyText="No suggestions returned."
          />
        </ReportSection>

        <ReportSection title="Skills" tone="indigo">
          <TagList items={analysis.skills} emptyText="No skills identified." />
        </ReportSection>

        <section className="grid gap-5 xl:grid-cols-2">
          <ReportSection title="Experience" tone="purple">
            <ExperienceList items={analysis.experience} />
          </ReportSection>

          <ReportSection title="Education" tone="indigo">
            <EducationList items={analysis.education} />
          </ReportSection>
        </section>

        <ReportSection title="Projects" tone="cyan">
          <ProjectList items={analysis.projects} />
        </ReportSection>
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

function AtsScore({ score, scoreMeta }) {
  const displayedScore = Number.isFinite(score) ? score : '--'
  const degrees = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) * 3.6 : 0

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
              ATS score
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

function ReportSection({ children, title, tone = 'indigo' }) {
  return (
    <section className={`glass-card p-6 ${getSectionAccent(tone)}`}>
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function TagList({ items = [], emptyText }) {
  if (!items.length) {
    return <EmptyText>{emptyText}</EmptyText>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="skill-pill">
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
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
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
          className="flex gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-slate-300"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-black text-cyan-100">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function EducationList({ items = [] }) {
  if (!items.length) {
    return <EmptyText>No education details returned.</EmptyText>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, index) => (
        <article
          key={`${item.institution || 'education'}-${index}`}
          className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4"
        >
          <h3 className="font-black text-white">
            {item.institution || 'Institution unavailable'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {[item.qualification, item.field].filter(Boolean).join(', ') ||
              'Qualification unavailable'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {formatYearRange(item.startYear, item.endYear)}
          </p>
        </article>
      ))}
    </div>
  )
}

function ExperienceList({ items = [] }) {
  if (!items.length) {
    return <EmptyText>No experience details returned.</EmptyText>
  }

  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <article
          key={`${item.organization || 'experience'}-${index}`}
          className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-black text-white">
                {item.role || 'Role unavailable'}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {item.organization || 'Organization unavailable'}
              </p>
            </div>
            <p className="text-sm text-slate-500">{item.duration || ''}</p>
          </div>
          <div className="mt-4">
            <BulletList
              items={item.responsibilities || []}
              emptyText="No responsibilities returned."
              tone="cyan"
            />
          </div>
        </article>
      ))}
    </div>
  )
}

function ProjectList({ items = [] }) {
  if (!items.length) {
    return <EmptyText>No project details returned.</EmptyText>
  }

  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <article
          key={`${item.name || 'project'}-${index}`}
          className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4"
        >
          <h3 className="font-black text-white">
            {item.name || 'Project unavailable'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {item.description || 'No description returned.'}
          </p>
          <div className="mt-4">
            <TagList
              items={item.technologies || []}
              emptyText="No technologies returned."
            />
          </div>
          <div className="mt-4">
            <BulletList
              items={item.highlights || []}
              emptyText="No highlights returned."
              tone="green"
            />
          </div>
        </article>
      ))}
    </div>
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

function formatYearRange(startYear, endYear) {
  if (startYear && endYear) {
    return `${startYear} - ${endYear}`
  }

  if (startYear) {
    return `${startYear} - Present`
  }

  if (endYear) {
    return `${endYear}`
  }

  return 'Dates unavailable'
}

export default ResumeAnalysis
