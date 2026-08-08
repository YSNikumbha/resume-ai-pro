import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import { analyzeResume, getResumeAnalyses } from '../services/analysisService'
import { getResumeJobMatches } from '../services/jobMatchService'
import {
  deleteResumeIndex,
  indexResume,
} from '../services/ragService'
import { deleteResume, getResumeById } from '../services/resumeService'
import { getScoreMeta, getStatusClasses } from '../utils/analysisFormatters'
import { getApiErrorMessage } from '../utils/errorMessages'
import { getJobMatchScoreMeta } from '../utils/jobMatchFormatters'
import { formatDateTime, formatFileSize } from '../utils/resumeFormatters'

function ResumeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisMessage, setAnalysisMessage] = useState('')
  const [indexing, setIndexing] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState(false)
  const [indexMessage, setIndexMessage] = useState('')
  const [indexInfo, setIndexInfo] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [jobMatches, setJobMatches] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadResume() {
      try {
        const [resumeData, analysisData, matchData] = await Promise.all([
          getResumeById(id),
          getResumeAnalyses(id),
          getResumeJobMatches(id),
        ])
        if (isMounted) {
          setResume(resumeData)
          setIndexInfo(toIndexInfo(resumeData))
          setAnalyses(analysisData)
          setJobMatches(matchData)
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

    loadResume()

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleAnalyze() {
    if (!resume || analyzing) {
      return
    }

    setAnalyzing(true)
    setError('')
    setAnalysisMessage('Analyzing your resume with AI...')

    try {
      const analysis = await analyzeResume(resume.id)
      navigate(`/analyses/${analysis.id}`)
    } catch (error) {
      setError(getApiErrorMessage(error))
      setAnalysisMessage('')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleIndexResume() {
    if (!resume || indexing || deletingIndex) {
      return
    }

    setIndexing(true)
    setError('')
    setIndexMessage('Creating semantic resume index...')
    setIndexInfo((current) => ({
      ...(current || toIndexInfo(resume)),
      status: 'INDEXING',
      failureMessage: '',
    }))

    try {
      const result = await indexResume(resume.id)
      applyIndexResult(result)
      setIndexMessage('Resume index is ready for chat.')
    } catch (error) {
      const message = getApiErrorMessage(error)
      setError(message)
      setIndexMessage('')
      setIndexInfo((current) => ({
        ...(current || toIndexInfo(resume)),
        status: 'FAILED',
        failureMessage: message,
      }))
    } finally {
      setIndexing(false)
    }
  }

  async function handleDeleteIndex() {
    if (!resume || deletingIndex || indexing) {
      return
    }

    const confirmed = window.confirm(
      `Delete the chat index for "${resume.originalFileName}"?`,
    )

    if (!confirmed) {
      return
    }

    setDeletingIndex(true)
    setError('')
    setIndexMessage('')

    try {
      await deleteResumeIndex(resume.id)
      const resetInfo = {
        resumeId: resume.id,
        resumeFileName: resume.originalFileName,
        status: 'NOT_INDEXED',
        chunkCount: 0,
        indexedAt: null,
        failureMessage: '',
      }
      applyIndexResult(resetInfo)
      setIndexMessage('Resume index deleted successfully.')
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setDeletingIndex(false)
    }
  }

  function applyIndexResult(result) {
    setIndexInfo(result)
    setResume((current) =>
      current
        ? {
            ...current,
            indexStatus: result.status,
            indexedAt: result.indexedAt,
            indexedChunkCount: result.chunkCount,
            indexingFailureMessage: result.failureMessage,
          }
        : current,
    )
  }

  async function handleDelete() {
    if (!resume) {
      return
    }

    const confirmed = window.confirm(
      `Delete "${resume.originalFileName}" from your resume history?`,
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      await deleteResume(resume.id)
      navigate('/resumes', {
        replace: true,
        state: { message: 'Resume deleted successfully.' },
      })
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  const currentIndexInfo = resume ? indexInfo || toIndexInfo(resume) : null

  return (
    <AuthenticatedLayout>
      <div className="space-y-3">
        <StatusMessage>{error}</StatusMessage>
        <StatusMessage type="info">{analysisMessage}</StatusMessage>
        <StatusMessage type="success">{indexMessage}</StatusMessage>
      </div>

      {loading ? (
        <section className="glass-card mt-6 grid place-items-center p-10">
          <LoadingSpinner label="Loading resume" size="lg" />
        </section>
      ) : resume ? (
        <div className="page-enter">
          <section className="mt-6 border-b border-slate-800/80 pb-6">
            <Link to="/resumes" className="ghost-button min-h-10 w-fit px-3 py-2">
              Back to Resumes
            </Link>

            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex min-w-0 items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-red-300/20 bg-red-500/10 text-xs font-black text-red-100">
                  PDF
                </span>
                <div className="min-w-0">
                  <p className="eyebrow">Resume Details</p>
                  <h1 className="mt-3 break-words text-3xl font-black text-white sm:text-4xl">
                    {resume.originalFileName}
                  </h1>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                    <span className="rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5">
                      Uploaded {formatDateTime(resume.uploadedAt)}
                    </span>
                    <span className="rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5">
                      {formatFileSize(resume.fileSize)}
                    </span>
                    <span className={`status-pill ${getIndexStatusClasses(currentIndexInfo?.status)}`}>
                      {formatIndexStatus(currentIndexInfo?.status)}
                    </span>
                  </div>
                </div>
              </div>

              <ResumeActionsPanel
                analyzing={analyzing}
                deleting={deleting}
                deletingIndex={deletingIndex}
                indexInfo={currentIndexInfo}
                indexing={indexing}
                onAnalyze={handleAnalyze}
                onDeleteIndex={handleDeleteIndex}
                onDeleteResume={handleDelete}
                onIndexResume={handleIndexResume}
                resumeId={resume.id}
              />
            </div>
          </section>

          <nav className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Resume detail sections">
            {[
              ['Overview', '#overview'],
              ['AI Analysis', '#ai-analysis'],
              ['Job Matches', '#job-matches'],
              ['Resume Chat', '#resume-chat'],
              ['Extracted Text', '#extracted-text'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="shrink-0 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-cyan-300/30 hover:text-white focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
              >
                {label}
              </a>
            ))}
          </nav>

          <section id="overview" className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="glass-card p-6">
              <h2 className="text-xl font-black text-white">Overview</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                This resume is ready for analysis, role matching, and grounded
                chat once its semantic index is available.
              </p>
              <p className="mt-5 line-clamp-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-7 text-slate-400">
                {resume.extractedText || 'No extracted text is available for this resume.'}
              </p>
            </article>
            <article className="glass-card p-6">
              <h2 className="text-xl font-black text-white">Current status</h2>
              <div className="mt-5 grid gap-3">
                <StatusRow label="AI analysis reports" value={analyses.length} />
                <StatusRow label="Job match reports" value={jobMatches.length} />
                <StatusRow
                  label="Chat index"
                  value={formatIndexStatus(currentIndexInfo?.status)}
                />
              </div>
            </article>
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-2">
            <HistoryPanel
              id="ai-analysis"
              title="AI Analysis"
              emptyText="No AI analyses yet."
              action={
                <button
                  type="button"
                  disabled={analyzing || deleting}
                  onClick={handleAnalyze}
                  className="primary-button min-h-10 px-4 py-2"
                >
                  {analyzing ? 'Analyzing...' : 'Run Analysis'}
                </button>
              }
            >
              {analyses.map((analysis) => (
                <AnalysisHistoryItem key={analysis.id} analysis={analysis} />
              ))}
            </HistoryPanel>
            <HistoryPanel
              id="job-matches"
              title="Job Matches"
              emptyText="No job matches yet."
              action={
                <Link
                  to={`/job-matches/new?resumeId=${resume.id}`}
                  className="secondary-button min-h-10 px-4 py-2"
                >
                  Match Resume
                </Link>
              }
            >
              {jobMatches.map((match) => (
                <JobMatchHistoryItem key={match.id} match={match} />
              ))}
            </HistoryPanel>
          </section>

          <section id="resume-chat" className="mt-6">
            <ResumeChatIndexSection
              indexInfo={currentIndexInfo}
            />
          </section>

          <section id="extracted-text" className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Extracted Text</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Parsed resume content used by analysis and chat workflows.
                </p>
              </div>
              <span className="status-pill status-slate">Secondary detail</span>
            </div>
            <pre className="mt-5 max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm leading-7 text-slate-400">
              {resume.extractedText}
            </pre>
          </section>
        </div>
      ) : null}
    </AuthenticatedLayout>
  )
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  )
}

function ResumeActionsPanel({
  analyzing,
  deleting,
  deletingIndex,
  indexInfo,
  indexing,
  onAnalyze,
  onDeleteIndex,
  onDeleteResume,
  onIndexResume,
  resumeId,
}) {
  const status = indexInfo?.status || 'NOT_INDEXED'
  const isIndexBusy = indexing || deletingIndex || status === 'INDEXING'
  const chatReady = status === 'INDEXED'
  const chatMessage = getResumeChatMessage(status)

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
            AI Tools
          </h2>
          <span className={`status-pill ${getIndexStatusClasses(status)}`}>
            {formatIndexStatus(status)}
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            disabled={analyzing || deleting}
            onClick={onAnalyze}
            className="primary-button min-h-10 w-full px-4 py-2"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Resume'}
          </button>
          <Link
            to={`/job-matches/new?resumeId=${resumeId}`}
            className="secondary-button min-h-10 w-full px-4 py-2"
          >
            Match With Job
          </Link>
          {chatReady ? (
            <Link
              to={`/resumes/${resumeId}/chat`}
              className="secondary-button min-h-10 w-full px-4 py-2"
            >
              Open Resume Chat
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="secondary-button min-h-10 w-full px-4 py-2"
            >
              Open Resume Chat
            </button>
          )}
        </div>

        <p
          className={`mt-4 rounded-2xl border p-3 text-sm leading-6 ${
            status === 'FAILED'
              ? 'border-red-400/25 bg-red-500/10 text-red-100'
              : status === 'INDEXING'
                ? 'border-amber-400/25 bg-amber-500/10 text-amber-100'
                : chatReady
                  ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
                  : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100'
          }`}
        >
          {chatMessage}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
          Resume Management
        </h2>
        <div className="mt-4 grid gap-2">
          {status === 'INDEXING' ? (
            <button
              type="button"
              disabled
              className="secondary-button min-h-10 w-full px-4 py-2"
            >
              Creating semantic resume index...
            </button>
          ) : (
            <button
              type="button"
              disabled={isIndexBusy}
              onClick={onIndexResume}
              className="secondary-button min-h-10 w-full px-4 py-2"
            >
              {status === 'INDEXED'
                ? 'Re-index Resume'
                : status === 'FAILED'
                  ? 'Retry Indexing'
                  : 'Index Resume'}
            </button>
          )}

          {status === 'INDEXED' ? (
            <button
              type="button"
              disabled={isIndexBusy}
              onClick={onDeleteIndex}
              className="secondary-button min-h-10 w-full px-4 py-2"
            >
              {deletingIndex ? 'Deleting index...' : 'Delete Index'}
            </button>
          ) : null}

          <button
            type="button"
            disabled={deleting || analyzing}
            onClick={onDeleteResume}
            className="danger-button min-h-10 w-full px-4 py-2"
          >
            {deleting ? 'Deleting...' : 'Delete Resume'}
          </button>
        </div>
      </section>
    </div>
  )
}

function HistoryPanel({ action, children, emptyText, id, title }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <section id={id} className="glass-card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black text-white">{title}</h2>
        {action}
      </div>
      {!hasItems ? (
        <div className="mt-4 rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/10 p-5 text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="mt-4 grid gap-3">{children}</div>
      )}
    </section>
  )
}

function AnalysisHistoryItem({ analysis }) {
  const score = Number.isFinite(analysis.atsScore) ? analysis.atsScore : null
  const scoreMeta = getScoreMeta(score)

  return (
    <article className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4 transition hover:border-cyan-300/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-white">
            {formatDateTime(analysis.analyzedAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${scoreMeta.bg} ${scoreMeta.text}`}
            >
              ATS {score ?? '--'} · {scoreMeta.label}
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
        <Link to={`/analyses/${analysis.id}`} className="secondary-button min-h-10 w-fit px-4 py-2">
          View
        </Link>
      </div>
    </article>
  )
}

function JobMatchHistoryItem({ match }) {
  const score = Number.isFinite(match.matchScore) ? match.matchScore : null
  const scoreMeta = getJobMatchScoreMeta(score)

  return (
    <article className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4 transition hover:border-cyan-300/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-white">{match.jobTitle}</p>
          <p className="mt-1 text-xs text-slate-500">
            {match.companyName || 'Company unavailable'} · {formatDateTime(match.createdAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${scoreMeta.bg} ${scoreMeta.text}`}
            >
              Match {score ?? '--'} · {scoreMeta.label}
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
        <Link to={`/job-matches/${match.id}`} className="secondary-button min-h-10 w-fit px-4 py-2">
          View
        </Link>
      </div>
    </article>
  )
}

function ResumeChatIndexSection({ indexInfo }) {
  const status = indexInfo?.status || 'NOT_INDEXED'
  const statusClasses = getIndexStatusClasses(status)
  const chunkCount = Number.isFinite(indexInfo?.chunkCount)
    ? indexInfo.chunkCount
    : 0

  return (
    <article className="glass-card hover-lift p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/15 text-xs font-black text-purple-100">
          RAG
        </span>
        <span className={`status-pill ${statusClasses}`}>
          {formatIndexStatus(status)}
        </span>
      </div>
      <h2 className="mt-5 text-xl font-black text-white">Resume AI Chat</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="status-pill status-slate">{chunkCount} chunks</span>
        {indexInfo?.indexedAt ? (
          <span className="status-pill status-slate">
            Indexed {formatDateTime(indexInfo.indexedAt)}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        {getResumeChatMessage(status)}
      </p>
      {status === 'FAILED' && indexInfo?.failureMessage ? (
        <p className="mt-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-6 text-red-200">
          {indexInfo.failureMessage}
        </p>
      ) : null}
    </article>
  )
}

function toIndexInfo(resume) {
  return {
    resumeId: resume?.id,
    resumeFileName: resume?.originalFileName,
    status: resume?.indexStatus || 'NOT_INDEXED',
    chunkCount: resume?.indexedChunkCount ?? 0,
    indexedAt: resume?.indexedAt || null,
    failureMessage: resume?.indexingFailureMessage || '',
  }
}

function getIndexStatusClasses(status) {
  if (status === 'INDEXED') {
    return 'status-green'
  }

  if (status === 'FAILED') {
    return 'status-red'
  }

  if (status === 'INDEXING') {
    return 'status-amber'
  }

  return 'status-slate'
}

function formatIndexStatus(status) {
  switch (status) {
    case 'INDEXED':
      return 'Indexed'
    case 'INDEXING':
      return 'Indexing'
    case 'FAILED':
      return 'Failed'
    default:
      return 'Not indexed'
  }
}

function getResumeChatMessage(status) {
  switch (status) {
    case 'INDEXED':
      return 'Resume Chat is ready and grounded in this resume.'
    case 'INDEXING':
      return 'Creating semantic resume index...'
    case 'FAILED':
      return 'Resume indexing failed.'
    default:
      return 'Index this resume before starting AI Resume Chat.'
  }
}

export default ResumeDetails
