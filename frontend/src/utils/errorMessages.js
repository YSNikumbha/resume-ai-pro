import { API_BASE_URL } from '../constants/auth'

export function getApiErrorMessage(error) {
  if (!error?.response) {
    if (error?.isAxiosError) {
      return `Network error. Check that the backend is running at ${API_BASE_URL}.`
    }

    if (error?.message) {
      return error.message
    }

    return `Network error. Check that the backend is running at ${API_BASE_URL}.`
  }

  const status = error.response.status
  const backendMessage = error.response.data?.message

  if (status === 401) {
    return backendMessage || 'Invalid email or password.'
  }

  if (status === 403) {
    return backendMessage || 'You do not have permission to access this page.'
  }

  if (status === 500) {
    return backendMessage || 'Server error. Please try again in a moment.'
  }

  return backendMessage || 'Something went wrong. Please try again.'
}
