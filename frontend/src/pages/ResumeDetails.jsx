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
    setAnalysisMessage('Analyzing your resume. This may take a few seconds.')

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
    setIndexMessage('Indexing resume sections for chat. This may take a few seconds.')
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

  return (
    <AuthenticatedLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/resumes"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Back
          </Link>

          {resume ? (
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/job-matches/new?resumeId=${resume.id}`}
                className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Match With Job
              </Link>
              <button
                type="button"
                disabled={analyzing || deleting}
                onClick={handleAnalyze}
                className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-blue-300"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Resume'}
              </button>
              <button
                type="button"
                disabled={deleting || analyzing}
                onClick={handleDelete}
                className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:text-red-300"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          <StatusMessage>{error}</StatusMessage>
          <StatusMessage type="info">{analysisMessage}</StatusMessage>
          <StatusMessage type="success">{indexMessage}</StatusMessage>
        </div>

        {loading ? (
          <div className="mt-10 grid place-items-center py-10">
            <LoadingSpinner label="Loading resume" size="lg" />
          </div>
        ) : resume ? (
          <>
            <div className="mt-6 border-b border-slate-200 pb-6">
              <p className="text-sm font-semibold text-blue-700">
                Resume Details
              </p>
              <h1 className="mt-2 break-words text-3xl font-bold text-slate-950">
                {resume.originalFileName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>{formatFileSize(resume.fileSize)}</span>
                <span>{formatDateTime(resume.uploadedAt)}</span>
              </div>
            </div>

            <ResumeChatIndexSection
              deletingIndex={deletingIndex}
              indexInfo={indexInfo || toIndexInfo(resume)}
              indexing={indexing}
              onDeleteIndex={handleDeleteIndex}
              onIndexResume={handleIndexResume}
              resumeId={resume.id}
            />

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-950">
                Analysis History
              </h2>
              {analyses.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-5 text-sm text-slate-600">
                  No analyses for this resume yet.
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {analyses.map((analysis) => {
                    const score = Number.isFinite(analysis.atsScore)
                      ? analysis.atsScore
                      : null
                    const scoreMeta = getScoreMeta(score)

                    return (
                      <article
                        key={analysis.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {formatDateTime(analysis.analyzedAt)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${scoreMeta.bg} ${scoreMeta.text}`}
                              >
                                ATS {score ?? '--'} · {scoreMeta.label}
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
                  })}
                </div>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-950">
                Job Match History
              </h2>
              {jobMatches.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-5 text-sm text-slate-600">
                  No job matches for this resume yet.
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {jobMatches.map((match) => {
                    const score = Number.isFinite(match.matchScore)
                      ? match.matchScore
                      : null
                    const scoreMeta = getJobMatchScoreMeta(score)

                    return (
                      <article
                        key={match.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {match.jobTitle}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {match.companyName || 'Company unavailable'} ·{' '}
                              {formatDateTime(match.createdAt)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
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
                          <Link
                            to={`/job-matches/${match.id}`}
                            className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                          >
                            View
                          </Link>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-950">
                Extracted resume text
              </h2>
              <pre className="mt-4 max-h-[65vh] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {resume.extractedText}
              </pre>
            </div>
          </>
        ) : null}
      </section>
    </AuthenticatedLayout>
  )
}

function ResumeChatIndexSection({
  deletingIndex,
  indexInfo,
  indexing,
  onDeleteIndex,
  onIndexResume,
  resumeId,
}) {
  const status = indexInfo?.status || 'NOT_INDEXED'
  const statusClasses = getIndexStatusClasses(status)
  const isBusy = indexing || deletingIndex || status === 'INDEXING'
  const chunkCount = Number.isFinite(indexInfo?.chunkCount)
    ? indexInfo.chunkCount
    : 0

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            AI Resume Chat
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusClasses}`}
            >
              {formatIndexStatus(status)}
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              {chunkCount} chunks
            </span>
            {indexInfo?.indexedAt ? (
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                Indexed {formatDateTime(indexInfo.indexedAt)}
              </span>
            ) : null}
          </div>
          {status === 'FAILED' && indexInfo?.failureMessage ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-red-700">
              {indexInfo.failureMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {status === 'INDEXED' ? (
            <Link
              to={`/resumes/${resumeId}/chat`}
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Open Resume Chat
            </Link>
          ) : null}

          {status === 'NOT_INDEXED' || status === 'FAILED' ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={onIndexResume}
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-blue-300"
            >
              {indexing
                ? 'Indexing...'
                : status === 'FAILED'
                  ? 'Retry Indexing'
                  : 'Index Resume'}
            </button>
          ) : null}

          {status === 'INDEXED' ? (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={onIndexResume}
                className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:text-blue-300"
              >
                {indexing ? 'Indexing...' : 'Re-index Resume'}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={onDeleteIndex}
                className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:text-red-300"
              >
                {deletingIndex ? 'Deleting...' : 'Delete Index'}
              </button>
            </>
          ) : null}

          {status === 'INDEXING' ? (
            <button
              type="button"
              disabled
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg bg-blue-300 px-4 text-sm font-semibold text-white"
            >
              Indexing...
            </button>
          ) : null}
        </div>
      </div>
    </section>
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
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'FAILED') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  if (status === 'INDEXING') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-white text-slate-600'
}

function formatIndexStatus(status) {
  return String(status || 'NOT_INDEXED').replaceAll('_', ' ')
}

export default ResumeDetails
