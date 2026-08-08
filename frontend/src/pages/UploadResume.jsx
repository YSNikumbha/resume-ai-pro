import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusMessage from '../components/StatusMessage'
import { uploadResume } from '../services/resumeService'
import { getApiErrorMessage } from '../utils/errorMessages'
import {
  formatFileSize,
  validateResumeFile,
} from '../utils/resumeFormatters'

function UploadResume() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [validationError, setValidationError] = useState('')
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  function selectFile(file) {
    const error = validateResumeFile(file)
    setSelectedFile(error ? null : file)
    setValidationError(error)
    setServerError('')
    setSuccessMessage('')
    setUploadProgress(0)
  }

  function handleFileChange(event) {
    selectFile(event.target.files?.[0])
  }

  function handleDragOver(event) {
    event.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setDragActive(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)
    selectFile(event.dataTransfer.files?.[0])
  }

  async function handleUpload(event) {
    event.preventDefault()

    const error = validateResumeFile(selectedFile)
    setValidationError(error)

    if (error) {
      return
    }

    setUploading(true)
    setServerError('')
    setSuccessMessage('')
    setUploadProgress(0)

    try {
      const resume = await uploadResume(selectedFile, (progressEvent) => {
        if (!progressEvent.total) {
          return
        }

        setUploadProgress(
          Math.round((progressEvent.loaded * 100) / progressEvent.total),
        )
      })

      setSuccessMessage('Resume uploaded successfully.')
      setTimeout(() => {
        navigate(`/resumes/${resume.id}`, { replace: true })
      }, 650)
    } catch (error) {
      setServerError(getApiErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <section className="page-enter mx-auto max-w-3xl">
        <div className="text-center">
          <p className="eyebrow">Upload Resume</p>
          <h1 className="mt-3 text-3xl font-black text-white">
            Upload your resume
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
            Upload a text-based PDF to begin AI analysis.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <StatusMessage>{validationError || serverError}</StatusMessage>
          <StatusMessage type="success">{successMessage}</StatusMessage>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleUpload} noValidate>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`grid min-h-[15rem] place-items-center rounded-2xl border border-dashed px-6 py-9 text-center transition ${
              dragActive
                ? 'scale-[1.01] border-cyan-300 bg-cyan-300/10 shadow-[0_0_32px_rgba(34,211,238,0.12)]'
                : 'border-slate-700 bg-slate-900/50 hover:border-cyan-300/40 hover:bg-slate-900/70'
            }`}
          >
            <div>
              <input
                ref={fileInputRef}
                id="resume-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-red-300/20 bg-red-500/10 text-xs font-black text-red-100">
                PDF
              </span>
              <p className="mt-5 text-base font-black text-white">
                Drag and drop your resume here
              </p>
              <p className="mt-2 text-sm text-slate-500">or browse files</p>
              <label
                htmlFor="resume-file"
                className="secondary-button mt-5 min-h-11 cursor-pointer px-5 focus-within:outline-none focus-within:ring-4 focus-within:ring-cyan-300/20"
              >
                Browse PDF
              </label>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="status-pill status-slate">PDF only</span>
                <span className="status-pill status-slate">Maximum 5 MB</span>
              </div>
            </div>
          </div>

          {selectedFile ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-[11px] font-black text-cyan-100">
                  PDF
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-black text-white">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <span className="ml-auto hidden status-pill status-green sm:inline-flex">
                  Selected
                </span>
              </div>
            </div>
          ) : null}

          {uploading ? (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-400 to-cyan-300 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-300">
                {uploadProgress}% uploaded
              </p>
            </div>
          ) : null}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              aria-busy={uploading}
              className="primary-button w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <LoadingSpinner label="" size="sm" />
                  Uploading...
                </>
              ) : (
                'Upload Resume'
              )}
            </button>
          </div>
        </form>
      </section>
    </AuthenticatedLayout>
  )
}

export default UploadResume
