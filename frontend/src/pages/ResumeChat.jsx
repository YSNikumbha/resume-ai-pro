import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import {
  askResume,
  getChatHistory,
  getIndexStatus,
} from '../services/ragService'
import { getApiErrorMessage } from '../utils/errorMessages'
import { formatDateTime } from '../utils/resumeFormatters'

const MAX_QUESTION_LENGTH = 1000
const EXAMPLE_QUESTIONS = [
  'What are my strongest technical skills?',
  'Summarize my experience.',
  'Which projects use Java?',
  'What achievements are mentioned?',
  'Which technologies appear in my projects?',
  'What education is listed?',
  'What should I discuss in an interview?',
]

function ResumeChat() {
  const { resumeId } = useParams()
  const [indexInfo, setIndexInfo] = useState(null)
  const [history, setHistory] = useState([])
  const [activeResponse, setActiveResponse] = useState(null)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(true)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  const loadChat = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [statusData, historyData] = await Promise.all([
        getIndexStatus(resumeId),
        getChatHistory(resumeId),
      ])
      setIndexInfo(statusData)
      setHistory(historyData)
      setActiveResponse(historyData[0] || null)
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [resumeId])

  useEffect(() => {
    loadChat()
  }, [loadChat])

  const canChat = indexInfo?.status === 'INDEXED'
  const displayedResponse = activeResponse || history[0] || null
  const questionLength = question.length
  const isQuestionTooLong = questionLength > MAX_QUESTION_LENGTH

  const statusLabel = useMemo(
    () => String(indexInfo?.status || 'UNKNOWN').replaceAll('_', ' '),
    [indexInfo?.status],
  )

  async function handleSend() {
    const cleanedQuestion = question.trim()

    if (asking || !canChat) {
      return
    }

    if (cleanedQuestion.length < 3) {
      setFieldError('Question must be at least 3 characters.')
      return
    }

    if (cleanedQuestion.length > MAX_QUESTION_LENGTH) {
      setFieldError(`Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`)
      return
    }

    setAsking(true)
    setError('')
    setFieldError('')

    try {
      const response = await askResume(resumeId, cleanedQuestion)
      setActiveResponse(response)
      setHistory((current) => [response, ...current])
      setQuestion('')
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setAsking(false)
    }
  }

  function handleQuestionKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="grid min-h-96 place-items-center">
          <LoadingSpinner label="Loading resume chat" size="lg" />
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error && !indexInfo) {
    return (
      <AuthenticatedLayout>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
          <StatusMessage>{error}</StatusMessage>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadChat}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Try again
            </button>
            <Link
              to={`/resumes/${resumeId}`}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Back to resume
            </Link>
          </div>
        </section>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700">Resume Chat</p>
              <h1 className="mt-2 break-words text-3xl font-bold text-slate-950">
                {indexInfo?.resumeFileName || 'Resume'}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${getIndexStatusClasses(
                    indexInfo?.status,
                  )}`}
                >
                  {statusLabel}
                </span>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {indexInfo?.chunkCount ?? 0} chunks
                </span>
                {indexInfo?.indexedAt ? (
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Indexed {formatDateTime(indexInfo.indexedAt)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/resumes/${resumeId}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Back to resume
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <StatusMessage>{error}</StatusMessage>
            {!canChat ? (
              <StatusMessage type="info">
                Index this resume before opening chat.
              </StatusMessage>
            ) : null}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
              <h2 className="text-lg font-semibold text-slate-950">
                Ask a Question
              </h2>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="resume-question"
                    className="text-sm font-medium text-slate-700"
                  >
                    Question
                  </label>
                  <span
                    className={`text-xs font-semibold ${
                      isQuestionTooLong ? 'text-red-600' : 'text-slate-500'
                    }`}
                  >
                    {questionLength}/{MAX_QUESTION_LENGTH}
                  </span>
                </div>
                <textarea
                  id="resume-question"
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value)
                    setFieldError('')
                  }}
                  onKeyDown={handleQuestionKeyDown}
                  disabled={!canChat || asking}
                  rows={4}
                  className={`w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 ${
                    fieldError ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="Ask about skills, experience, projects, education, or achievements in this resume."
                />
                {fieldError ? (
                  <p className="mt-2 text-sm text-red-600">{fieldError}</p>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={
                    !canChat ||
                    asking ||
                    !question.trim() ||
                    isQuestionTooLong
                  }
                  onClick={handleSend}
                  className="inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-blue-300"
                >
                  {asking ? 'Generating...' : 'Send'}
                </button>
                {asking ? (
                  <LoadingSpinner label="Retrieving resume sections" />
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {EXAMPLE_QUESTIONS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={!canChat || asking}
                    onClick={() => setQuestion(example)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </article>

            <ChatResponseCard response={displayedResponse} />
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">
                Chat History
              </h2>
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {history.length}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-slate-600">
                No resume chat messages yet.
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {history.map((item) => (
                  <button
                    key={item.id || `${item.createdAt}-${item.question}`}
                    type="button"
                    onClick={() => setActiveResponse(item)}
                    className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      activeResponse?.id === item.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-200'
                    }`}
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-slate-950">
                      {item.question}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </p>
                    {item.insufficientContext ? (
                      <span className="mt-3 inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Insufficient context
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </aside>
        </section>
      </div>
    </AuthenticatedLayout>
  )
}

function ChatResponseCard({ response }) {
  if (!response) {
    return (
      <article className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-6 text-sm leading-6 text-slate-600">
        Ask a question to retrieve relevant resume sections and generate an answer.
      </article>
    )
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Answer</h2>
          <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
            Generated from retrieved resume sections.
          </p>
        </div>
        <span
          className={`w-fit rounded-lg px-3 py-1.5 text-xs font-semibold ${
            response.insufficientContext
              ? 'bg-amber-50 text-amber-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {response.insufficientContext ? 'Insufficient context' : 'Answered'}
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {response.answer}
        </p>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Answers are generated only from retrieved resume content and may miss
        information if the resume is incomplete.
      </p>

      <SourceCards sources={response.sources || []} />
    </article>
  )
}

function SourceCards({ sources }) {
  if (!sources.length) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No source sections were returned.
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      {sources.map((source, index) => (
        <article
          key={`${source.chunkIndex}-${index}`}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Source {index + 1}
            </span>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {source.sectionName || 'GENERAL'}
            </span>
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {formatSimilarity(source.similarityScore)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {source.excerpt || 'Excerpt unavailable.'}
          </p>
        </article>
      ))}
    </div>
  )
}

function formatSimilarity(score) {
  if (!Number.isFinite(score)) {
    return 'Similarity unavailable'
  }

  const percentage = score <= 1 ? score * 100 : score
  return `${Math.round(Math.min(100, Math.max(0, percentage)))}% match`
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

  return 'border-slate-200 bg-slate-50 text-slate-600'
}

export default ResumeChat
