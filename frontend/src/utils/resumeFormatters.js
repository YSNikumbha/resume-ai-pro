export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return '0 B'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ['KB', 'MB', 'GB']
  let size = bytes / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

export function formatDateTime(value) {
  if (!value) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function validateResumeFile(file) {
  if (!file) {
    return 'Select a PDF resume to upload.'
  }

  if (file.size === 0) {
    return 'Uploaded file cannot be empty.'
  }

  if (file.size > MAX_RESUME_FILE_SIZE) {
    return 'File size must not exceed 5 MB.'
  }

  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf')
  const hasPdfType = !file.type || file.type === 'application/pdf'

  if (!hasPdfExtension || !hasPdfType) {
    return 'Only PDF files are allowed.'
  }

  return ''
}
