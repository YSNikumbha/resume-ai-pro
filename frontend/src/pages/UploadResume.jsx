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
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-blue-900/5 sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">Upload Resume</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Add a PDF resume
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Upload one PDF up to 5 MB. The backend will store the file and
              extract readable text for your resume history.
            </p>
          </div>
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
            className={`rounded-lg border border-dashed px-6 py-10 text-center transition ${
              dragActive
                ? 'border-blue-500 bg-blue-100'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <input
              ref={fileInputRef}
              id="resume-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
            <label
              htmlFor="resume-file"
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus-within:outline-none focus-within:ring-4 focus-within:ring-blue-100"
            >
              Choose PDF
            </label>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Drag and drop your resume here
            </p>
            <p className="mt-2 text-sm text-slate-500">PDF only, 5 MB max</p>
          </div>

          {selectedFile ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : null}

          {uploading ? (
            <div>
              <div className="h-3 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {uploadProgress}% uploaded
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            aria-busy={uploading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-blue-300 sm:w-auto"
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
        </form>
      </section>
    </AuthenticatedLayout>
  )
}

export default UploadResume
