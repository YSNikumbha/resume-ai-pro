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
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
          <StatusMessage>{error}</StatusMessage>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadAnalysis}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Try again
            </button>
            <Link
              to="/resumes"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
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
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700">
                Resume Analysis
              </p>
              <h1 className="mt-2 break-words text-3xl font-bold text-slate-950">
                {analysis.resumeFileName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                <span>{formatDateTime(analysis.analyzedAt)}</span>
                <span>{analysis.modelName || 'Model unavailable'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold ${statusClasses}`}
              >
                {analysis.status}
              </span>
              <Link
                to={`/resumes/${analysis.resumeId}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Back to resume
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

        <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
            <AtsScore score={score} scoreMeta={scoreMeta} />
            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              This score is AI-generated guidance and may differ from employer
              ATS systems.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
            <h2 className="text-lg font-semibold text-slate-950">Summary</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {analysis.summary || 'No summary returned.'}
            </p>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ReportSection title="Skills">
            <TagList items={analysis.skills} emptyText="No skills identified." />
          </ReportSection>

          <ReportSection title="Strengths">
            <BulletList
              items={analysis.strengths}
              emptyText="No strengths returned."
            />
          </ReportSection>

          <ReportSection title="Weaknesses">
            <BulletList
              items={analysis.weaknesses}
              emptyText="No weaknesses returned."
            />
          </ReportSection>

          <ReportSection title="Suggestions">
            <BulletList
              items={analysis.suggestions}
              emptyText="No suggestions returned."
            />
          </ReportSection>
        </section>

        <ReportSection title="Education">
          <EducationList items={analysis.education} />
        </ReportSection>

        <ReportSection title="Experience">
          <ExperienceList items={analysis.experience} />
        </ReportSection>

        <ReportSection title="Projects">
          <ProjectList items={analysis.projects} />
        </ReportSection>
      </div>
    </AuthenticatedLayout>
  )
}

function AtsScore({ score, scoreMeta }) {
  const displayedScore = Number.isFinite(score) ? score : '--'
  const degrees = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) * 3.6 : 0

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
              ATS score
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

function ReportSection({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
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
        <span
          key={item}
          className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
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
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
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
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <h3 className="font-semibold text-slate-950">
            {item.institution || 'Institution unavailable'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
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
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                {item.role || 'Role unavailable'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {item.organization || 'Organization unavailable'}
              </p>
            </div>
            <p className="text-sm text-slate-500">{item.duration || ''}</p>
          </div>
          <BulletList
            items={item.responsibilities || []}
            emptyText="No responsibilities returned."
          />
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
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <h3 className="font-semibold text-slate-950">
            {item.name || 'Project unavailable'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
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
