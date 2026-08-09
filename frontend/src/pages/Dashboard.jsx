import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import useAuth from '../hooks/useAuth'
import { getAllAnalyses } from '../services/analysisService'
import { getJobMatches } from '../services/jobMatchService'
import { getResumes } from '../services/resumeService'
import { getScoreMeta, getStatusClasses } from '../utils/analysisFormatters'
import { getApiErrorMessage } from '../utils/errorMessages'
import { getJobMatchScoreMeta } from '../utils/jobMatchFormatters'
import { formatDateTime, formatFileSize } from '../utils/resumeFormatters'

const quickActions = [
  {
    label: 'Analyze Resume',
    description: 'Review uploaded resumes and run AI analysis.',
    to: '/resumes',
    icon: 'AI',
  },
  {
    label: 'Match With Job',
    description: 'Compare your resume against a target role.',
    to: '/job-matches/new',
    icon: 'JM',
  },
  {
    label: 'Choose Resume',
    description: 'Select a resume to analyze, index, or chat.',
    to: '/resumes',
    icon: 'CV',
  },
  {
    label: 'Upload Resume',
    description: 'Add a PDF and begin analysis.',
    to: '/resumes/upload',
    icon: 'PDF',
  },
]

function Dashboard() {
  const { currentUser, user } = useAuth()
  const [refreshError, setRefreshError] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const [resumes, setResumes] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [jobMatches, setJobMatches] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    let isMounted = true

    if (!user) {
      currentUser().catch((error) => {
        if (isMounted) {
          setRefreshError(getApiErrorMessage(error))
        }
      })
    }

    return () => {
      isMounted = false
    }
  }, [currentUser, user])

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      try {
        const [resumeData, analysisData, matchData] = await Promise.all([
          getResumes(),
          getAllAnalyses(),
          getJobMatches(),
        ])

        if (isMounted) {
          setResumes(resumeData)
          setAnalyses(analysisData)
          setJobMatches(matchData)
        }
      } catch (error) {
        if (isMounted) {
          setDashboardError(getApiErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setLoadingStats(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const displayName = user?.fullName || 'ResumeAI user'
  const firstName = displayName.split(' ')[0] || displayName
  const completedAnalyses = analyses.filter(
    (analysis) => analysis.status === 'COMPLETED',
  )
  const latestCompletedAnalysis = completedAnalyses.find((analysis) =>
    Number.isFinite(analysis.atsScore),
  )
  const latestScore = latestCompletedAnalysis?.atsScore
  const latestScoreMeta = getScoreMeta(latestScore)
  const recentResumes = resumes.slice(0, 4)
  const recentAnalyses = analyses.slice(0, 4)
  const recentJobMatches = jobMatches.slice(0, 4)

  return (
    <AuthenticatedLayout>
      <div className="space-y-3">
        <StatusMessage>{refreshError}</StatusMessage>
        <StatusMessage>{dashboardError}</StatusMessage>
      </div>

      <section className="page-enter mt-6 flex flex-col justify-between gap-5 border-b border-slate-800/80 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Your AI-powered career workspace</p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Track your resume performance and AI insights.
          </p>
        </div>
        <Link to="/resumes/upload" className="primary-button min-h-11 w-full px-5 sm:w-auto">
          + Upload Resume
        </Link>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="PDF" label="Resumes" loading={loadingStats} value={resumes.length} />
        <StatCard icon="AI" label="Analyses" loading={loadingStats} value={completedAnalyses.length} />
        <ScoreStatCard
          icon="ATS"
          label="Latest ATS Score"
          loading={loadingStats}
          score={latestScore}
          meta={latestScoreMeta}
        />
        <StatCard icon="JM" label="Job Matches" loading={loadingStats} value={jobMatches.length} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section>
          <SectionTitle
            title="Recent Resumes"
            description="Recently uploaded resumes ready for analysis, matching, or chat indexing."
            action={<Link to="/resumes" className="secondary-button min-h-10 w-full px-4 py-2 sm:w-auto">View All</Link>}
          />
          {loadingStats ? (
            <PanelLoading label="Loading resumes" />
          ) : recentResumes.length === 0 ? (
            <EmptyState
              title="Your career workspace is empty."
              description="Upload your first resume to start generating AI insights."
              action={<Link to="/resumes/upload" className="primary-button mt-5 min-h-10 w-full px-4 py-2 sm:w-auto">Upload Your First Resume</Link>}
            />
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
              {recentResumes.map((resume) => (
                <RecentResumeItem key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </section>

        <aside>
          <SectionTitle
            title="Quick Actions"
            description="Move directly into the next resume workflow."
          />
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-cyan-300/30 hover:bg-slate-900/70 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-700 bg-slate-950/60 text-[11px] font-black text-cyan-100 transition group-hover:border-cyan-300/40">
                    {action.icon}
                  </span>
                  <div>
                    <h3 className="font-black text-white">{action.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <SectionTitle
            title="Recent AI Analysis"
            description="Latest generated resume reports and ATS score status."
            action={<Link to="/resumes" className="secondary-button min-h-10 w-full px-4 py-2 sm:w-auto">Resume History</Link>}
          />
          {loadingStats ? (
            <PanelLoading label="Loading analyses" />
          ) : recentAnalyses.length === 0 ? (
            <EmptyState
              title="No AI analyses yet."
              description="Run an analysis from any resume details page."
            />
          ) : (
            <div className="mt-4 grid gap-3">
              {recentAnalyses.map((analysis) => (
                <RecentAnalysisItem key={analysis.id} analysis={analysis} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle
            title="Recent Job Matches"
            description="Saved resume-to-job comparisons and match quality."
            action={<Link to="/job-matches" className="secondary-button min-h-10 w-full px-4 py-2 sm:w-auto">Match History</Link>}
          />
          {loadingStats ? (
            <PanelLoading label="Loading matches" />
          ) : recentJobMatches.length === 0 ? (
            <EmptyState
              title="No job matches yet."
              description="Compare your resume against a real job description."
            />
          ) : (
            <div className="mt-4 grid gap-3">
              {recentJobMatches.map((match) => (
                <RecentJobMatchItem key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
      </section>
    </AuthenticatedLayout>
  )
}

function SectionTitle({ action, description, title }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-black text-white">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function StatCard({ icon, label, loading, value }) {
  return (
    <article className="stat-shell hover-lift p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </h2>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950/60 text-[11px] font-black text-cyan-100">
          {icon}
        </span>
      </div>
      <MetricValue loading={loading} value={value} />
    </article>
  )
}

function ScoreStatCard({ icon, label, loading, meta, score }) {
  return (
    <article className="stat-shell hover-lift p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </h2>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950/60 text-[11px] font-black text-cyan-100">
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="mt-5">
          <LoadingSpinner label="Loading score" />
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-4xl font-black text-white">
            {Number.isFinite(score) ? score : '--'}
          </p>
          <span
            className={`mt-3 inline-flex rounded-xl px-3 py-2 text-xs font-black ${meta.bg} ${meta.text}`}
          >
            {meta.label}
          </span>
        </div>
      )}
    </article>
  )
}

function MetricValue({ loading, value }) {
  if (loading) {
    return (
      <div className="mt-5">
        <LoadingSpinner label="Loading" />
      </div>
    )
  }

  return <p className="mt-4 text-4xl font-black text-white">{value}</p>
}

function PanelLoading({ label }) {
  return (
    <div className="mt-4 grid min-h-44 place-items-center rounded-2xl border border-slate-800 bg-slate-900/50">
      <LoadingSpinner label={label} />
    </div>
  )
}

function EmptyState({ action, description, title }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6">
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {action}
    </div>
  )
}

function RecentResumeItem({ resume }) {
  return (
    <article className="border-b border-slate-800 p-4 last:border-b-0">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-300/20 bg-red-500/10 text-[11px] font-black text-red-100">
              PDF
            </span>
            <div className="min-w-0">
              <h3 className="break-words font-black text-white">
                {resume.originalFileName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {formatFileSize(resume.fileSize)} · Uploaded {formatDateTime(resume.uploadedAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="mobile-action-grid lg:justify-end">
          <Link to={`/resumes/${resume.id}`} className="secondary-button min-h-10 px-4 py-2">
            Open
          </Link>
          <Link to={`/job-matches/new?resumeId=${resume.id}`} className="ghost-button min-h-10 px-4 py-2">
            Match
          </Link>
        </div>
      </div>
    </article>
  )
}

function RecentAnalysisItem({ analysis }) {
  const score = Number.isFinite(analysis.atsScore) ? analysis.atsScore : null
  const scoreMeta = getScoreMeta(score)

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-cyan-300/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-black text-white">
            {analysis.resumeFileName}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(analysis.analyzedAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${scoreMeta.bg} ${scoreMeta.text}`}
            >
              ATS {score ?? '--'}
            </span>
            <span
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                analysis.status,
              )}`}
            >
              {analysis.status}
            </span>
          </div>
        </div>
        <Link to={`/analyses/${analysis.id}`} className="secondary-button min-h-10 w-full px-4 py-2 sm:w-fit">
          View
        </Link>
      </div>
    </article>
  )
}

function RecentJobMatchItem({ match }) {
  const score = Number.isFinite(match.matchScore) ? match.matchScore : null
  const scoreMeta = getJobMatchScoreMeta(score)

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-cyan-300/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-black text-white">
            {match.jobTitle}
          </h3>
          <p className="mt-1 break-words text-xs text-slate-500">
            {match.companyName || 'Company unavailable'} · {match.resumeFileName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(match.createdAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${scoreMeta.bg} ${scoreMeta.text}`}
            >
              Match {score ?? '--'}
            </span>
            <span
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                match.status,
              )}`}
            >
              {match.status}
            </span>
          </div>
        </div>
        <Link to={`/job-matches/${match.id}`} className="secondary-button min-h-10 w-full px-4 py-2 sm:w-fit">
          View
        </Link>
      </div>
    </article>
  )
}

export default Dashboard
