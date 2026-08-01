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
import { formatDateTime } from '../utils/resumeFormatters'

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
  const displayEmail = user?.email || 'Email unavailable'
  const completedAnalyses = analyses.filter(
    (analysis) => analysis.status === 'COMPLETED',
  )
  const latestCompletedAnalysis = completedAnalyses.find((analysis) =>
    Number.isFinite(analysis.atsScore),
  )
  const latestScore = latestCompletedAnalysis?.atsScore
  const latestScoreMeta = getScoreMeta(latestScore)
  const recentAnalyses = analyses.slice(0, 5)
  const completedJobMatches = jobMatches.filter(
    (match) => match.status === 'COMPLETED',
  )
  const latestCompletedJobMatch = completedJobMatches.find((match) =>
    Number.isFinite(match.matchScore),
  )
  const latestMatchScore = latestCompletedJobMatch?.matchScore
  const latestMatchScoreMeta = getJobMatchScoreMeta(latestMatchScore)
  const recentJobMatches = jobMatches.slice(0, 5)

  return (
    <AuthenticatedLayout>
      <div className="space-y-3">
        <StatusMessage>{refreshError}</StatusMessage>
        <StatusMessage>{dashboardError}</StatusMessage>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
        <p className="text-sm font-semibold text-blue-700">Dashboard</p>
        <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
              Welcome, {displayName}
            </h1>
            <p className="mt-2 text-slate-600">{displayEmail}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/job-matches/new"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              New Job Match
            </Link>
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              Authenticated session
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
          <h2 className="text-lg font-semibold text-slate-950">Resumes</h2>
          <MetricValue loading={loadingStats} value={resumes.length} />
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Uploaded PDF resumes saved to your history.
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
          <h2 className="text-lg font-semibold text-slate-950">Analyses</h2>
          <MetricValue loading={loadingStats} value={completedAnalyses.length} />
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Completed AI resume analysis reports.
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
          <h2 className="text-lg font-semibold text-slate-950">Latest ATS</h2>
          {loadingStats ? (
            <div className="mt-6">
              <LoadingSpinner label="Loading score" />
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-5xl font-bold text-slate-950">
                {Number.isFinite(latestScore) ? latestScore : '--'}
              </p>
              <span
                className={`mt-3 inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${latestScoreMeta.bg} ${latestScoreMeta.text}`}
              >
                {latestScoreMeta.label}
              </span>
            </div>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
          <h2 className="text-lg font-semibold text-slate-950">
            Job Matches
          </h2>
          <MetricValue loading={loadingStats} value={jobMatches.length} />
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Saved resume-to-job comparison reports.
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
          <h2 className="text-lg font-semibold text-slate-950">
            Latest Match
          </h2>
          {loadingStats ? (
            <div className="mt-6">
              <LoadingSpinner label="Loading score" />
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-5xl font-bold text-slate-950">
                {Number.isFinite(latestMatchScore) ? latestMatchScore : '--'}
              </p>
              <span
                className={`mt-3 inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${latestMatchScoreMeta.bg} ${latestMatchScoreMeta.text}`}
              >
                {latestMatchScoreMeta.label}
              </span>
            </div>
          )}
        </article>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_2fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
          <h2 className="text-lg font-semibold text-slate-950">Resume Upload</h2>
          <Link
            to="/resumes/upload"
            className="mt-5 grid min-h-40 place-items-center rounded-lg border border-dashed border-blue-200 bg-blue-50 px-5 text-center transition hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <div>
              <p className="font-semibold text-blue-800">Upload a resume</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add a PDF resume and save extracted text to your history.
              </p>
            </div>
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-950">
              Recent Analyses
            </h2>
            <Link
              to="/resumes"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Resume history
            </Link>
          </div>

          {loadingStats ? (
            <div className="mt-8 grid place-items-center py-8">
              <LoadingSpinner label="Loading analyses" />
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-6 text-sm text-slate-600">
              No resume analyses yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {recentAnalyses.map((analysis) => (
                <RecentAnalysisItem key={analysis.id} analysis={analysis} />
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-950">
            Recent Job Matches
          </h2>
          <Link
            to="/job-matches"
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Job match history
          </Link>
        </div>

        {loadingStats ? (
          <div className="mt-8 grid place-items-center py-8">
            <LoadingSpinner label="Loading matches" />
          </div>
        ) : recentJobMatches.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-6 text-sm text-slate-600">
            No job matches yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {recentJobMatches.map((match) => (
              <RecentJobMatchItem key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </AuthenticatedLayout>
  )
}

function MetricValue({ loading, value }) {
  if (loading) {
    return (
      <div className="mt-6">
        <LoadingSpinner label="Loading" />
      </div>
    )
  }

  return <p className="mt-5 text-5xl font-bold text-slate-950">{value}</p>
}

function RecentAnalysisItem({ analysis }) {
  const score = Number.isFinite(analysis.atsScore) ? analysis.atsScore : null
  const scoreMeta = getScoreMeta(score)

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold text-slate-950">
            {analysis.resumeFileName}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(analysis.analyzedAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${scoreMeta.bg} ${scoreMeta.text}`}
            >
              ATS {score ?? '--'}
            </span>
            <span
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                analysis.status,
              )}`}
            >
              {analysis.status}
            </span>
          </div>
        </div>
        <Link
          to={`/analyses/${analysis.id}`}
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
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
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold text-slate-950">
            {match.jobTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {match.companyName || 'Company unavailable'} · {match.resumeFileName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(match.createdAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${scoreMeta.bg} ${scoreMeta.text}`}
            >
              Match {score ?? '--'}
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
        <Link
          to={`/job-matches/${match.id}`}
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          View
        </Link>
      </div>
    </article>
  )
}

export default Dashboard
