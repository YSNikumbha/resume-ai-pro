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
const EMPTY_STATE_PROMPTS = [
  'What are my strongest skills?',
  'Summarize my experience',
  'Which projects use Java?',
  'What technologies are listed?',
  'What education is mentioned?',
  'What achievements are included?',
]

const INSUFFICIENT_CONTEXT_PROMPTS = [
  'What are my strongest technical skills?',
  'Summarize my experience.',
  'Which projects use Java?',
  'What education is listed?',
  'What technologies appear in my projects?',
  'What achievements are mentioned?',
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
    () => formatIndexStatus(indexInfo?.status || 'UNKNOWN'),
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

  function handlePromptSelect(prompt) {
    setQuestion(prompt)
    setFieldError('')
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
        <section className="glass-card p-6 sm:p-8">
          <StatusMessage>{error}</StatusMessage>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={loadChat} className="primary-button min-h-10 px-4 py-2">
              Try again
            </button>
            <Link to={`/resumes/${resumeId}`} className="secondary-button min-h-10 px-4 py-2">
              Back to Resume
            </Link>
          </div>
        </section>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="page-enter mx-auto flex max-w-5xl flex-col gap-6">
        <section className="border-b border-slate-800/80 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Resume Chat</p>
              <h1 className="mt-3 text-3xl font-black text-white">
                Resume Chat
              </h1>
              <p className="mt-2 break-words text-lg font-semibold text-slate-300">
                {indexInfo?.resumeFileName || 'Resume'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="status-pill status-cyan">
                  Grounded in your resume
                </span>
                <span className={`status-pill ${getIndexStatusClasses(indexInfo?.status)}`}>
                  {statusLabel}
                </span>
                <span className="status-pill status-slate">
                  {indexInfo?.chunkCount ?? 0} chunks
                </span>
                {indexInfo?.indexedAt ? (
                  <span className="status-pill status-slate">
                    Indexed {formatDateTime(indexInfo.indexedAt)}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Answers are generated only from retrieved resume sections.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={`/resumes/${resumeId}`} className="secondary-button min-h-10 px-4 py-2">
                Back to Resume
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

        <section className="glass-card overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">Conversation</h2>
              <span className="status-pill status-cyan">RAG grounded</span>
            </div>
          </div>

          <div className="min-h-[24rem] space-y-5 px-5 py-6 sm:px-6">
              {!displayedResponse && !asking ? (
                <div className="grid min-h-[18rem] place-items-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
                  <div>
                    <p className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-black text-cyan-100">
                      AI
                    </p>
                    <h3 className="mt-5 text-xl font-black text-white">
                      Ask your resume anything.
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                      Explore your skills, experience, projects, education,
                      technologies, and achievements.
                    </p>
                    <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
                      {EMPTY_STATE_PROMPTS.map((example) => (
                        <button
                          key={example}
                          type="button"
                          disabled={!canChat || asking}
                          onClick={() => handlePromptSelect(example)}
                          className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-left text-xs font-bold text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/20 focus:outline-none focus:ring-4 focus:ring-cyan-300/20 disabled:border-slate-700/60 disabled:bg-slate-800/40 disabled:text-slate-500"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {displayedResponse ? (
                <ChatResponseCard
                  onSelectPrompt={handlePromptSelect}
                  response={displayedResponse}
                />
              ) : null}

              {asking ? (
                <div className="page-enter flex justify-start">
                  <div className="max-w-[86%] rounded-3xl rounded-bl-md border border-slate-700/70 bg-slate-900/80 px-5 py-4 text-sm text-slate-200">
                    <p className="font-bold text-cyan-100">
                      Searching relevant resume sections...
                      <span className="loading-dots ml-1" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}
          </div>

          <div className="sticky bottom-0 border-t border-slate-800 bg-slate-950/90 p-4 backdrop-blur-2xl sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="resume-question" className="ai-label mb-0">
                  Question
                </label>
                <span
                  className={`text-xs font-black ${
                    isQuestionTooLong ? 'text-red-300' : 'text-slate-500'
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
              rows={2}
              className={`ai-textarea min-h-20 rounded-2xl text-sm leading-7 disabled:opacity-60 ${
                fieldError ? '!border-red-400/70' : ''
              }`}
              placeholder="Ask about skills, projects, experience, education, or achievements..."
            />
            {fieldError ? (
              <p className="mt-2 text-sm font-semibold text-red-300">{fieldError}</p>
            ) : null}

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={
                  !canChat ||
                  asking ||
                  !question.trim() ||
                  isQuestionTooLong
                }
                onClick={handleSend}
                className="primary-button w-full sm:w-auto"
              >
                {asking ? 'Generating...' : 'Send'}
              </button>
              {asking ? (
                <LoadingSpinner label="Searching relevant resume sections..." />
              ) : null}
            </div>
          </div>
        </section>

        {history.length > 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">Chat History</h2>
              <span className="status-pill status-slate">{history.length}</span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {history.map((item) => (
                <button
                  key={item.id || `${item.createdAt}-${item.question}`}
                  type="button"
                  onClick={() => setActiveResponse(item)}
                  className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-cyan-300/20 ${
                    activeResponse?.id === item.id
                      ? 'border-cyan-300/40 bg-cyan-300/10'
                      : 'border-slate-700/60 bg-slate-950/50 hover:border-indigo-300/40'
                  }`}
                >
                  <p className="line-clamp-2 text-sm font-black text-white">
                    {item.question}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </p>
                  {item.insufficientContext ? (
                    <span className="status-pill status-amber mt-3">
                      Insufficient context
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AuthenticatedLayout>
  )
}

function ChatResponseCard({ onSelectPrompt, response }) {
  return (
    <div className="space-y-5">
      <div className="page-enter flex justify-end">
        <div className="max-w-[86%] rounded-3xl rounded-br-md bg-gradient-to-br from-indigo-500 to-cyan-400 px-5 py-4 text-sm font-semibold leading-7 text-white shadow-lg shadow-indigo-950/30">
          {response.question}
        </div>
      </div>

      <div className="page-enter flex justify-start">
        <div className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/80 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-white">ResumeAI</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Resume-grounded answer
              </p>
            </div>
            <span
              className={`status-pill ${
                response.insufficientContext ? 'status-amber' : 'status-green'
              }`}
            >
              {response.insufficientContext
                ? 'Insufficient context'
                : 'Resume-grounded answer'}
            </span>
          </div>
          {response.insufficientContext ? (
            <InsufficientContextPanel onSelectPrompt={onSelectPrompt} />
          ) : (
            <>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {response.answer}
              </p>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Answers are generated only from retrieved resume content and may
                miss information if the resume is incomplete.
              </p>
            </>
          )}
        </div>
      </div>

      <SourceCards
        insufficientContext={response.insufficientContext}
        sources={response.sources || []}
      />
    </div>
  )
}

function InsufficientContextPanel({ onSelectPrompt }) {
  return (
    <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
      <h3 className="font-black text-amber-100">
        This question goes beyond your resume.
      </h3>
      <p className="mt-2 text-sm leading-7 text-amber-50/85">
        Resume Chat answers questions using only information retrieved from your
        uploaded resume. Try asking about your skills, experience, education,
        projects, technologies, or achievements.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {INSUFFICIENT_CONTEXT_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="rounded-full border border-amber-300/25 bg-slate-950/35 px-3 py-2 text-left text-xs font-bold text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-300/10 focus:outline-none focus:ring-4 focus:ring-amber-300/20"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

function SourceCards({ insufficientContext = false, sources }) {
  const [expandedSources, setExpandedSources] = useState({})

  if (!sources.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/50 p-4 text-sm text-slate-500">
        {insufficientContext
          ? 'No relevant resume sections were found.'
          : 'No source sections were returned.'}
      </div>
    )
  }

  function toggleSource(key) {
    setExpandedSources((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sources.map((source, index) => {
        const key = `${source.chunkIndex}-${index}`
        const isExpanded = Boolean(expandedSources[key])
        const excerpt = source.excerpt || 'Excerpt unavailable.'
        const shouldCollapse = excerpt.length > 220
        const displayedExcerpt =
          shouldCollapse && !isExpanded ? `${excerpt.slice(0, 220)}...` : excerpt

        return (
          <article
            key={key}
            className="rounded-2xl border border-cyan-300/20 bg-slate-950/50 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-pill status-cyan">Source {index + 1}</span>
              <span className="status-pill status-slate">
                Section: {source.sectionName || 'GENERAL'}
              </span>
              <span className="status-pill status-green">
                Similarity: {formatSimilarity(source.similarityScore)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {displayedExcerpt}
            </p>
            {shouldCollapse ? (
              <button
                type="button"
                onClick={() => toggleSource(key)}
                className="ghost-button mt-3 min-h-9 px-3 py-2"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

function formatSimilarity(score) {
  if (!Number.isFinite(score)) {
    return 'Unavailable'
  }

  const percentage = score <= 1 ? score * 100 : score
  return `${Math.round(Math.min(100, Math.max(0, percentage)))}%`
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
    case 'NOT_INDEXED':
      return 'Not indexed'
    default:
      return 'Unknown'
  }
}

export default ResumeChat
