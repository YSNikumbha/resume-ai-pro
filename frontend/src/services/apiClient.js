import axios from 'axios'
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../constants/auth'

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (typeof window !== 'undefined' && (status === 401 || status === 403)) {
      window.dispatchEvent(
        new CustomEvent('resumeai:auth-error', {
          detail: { status },
        }),
      )
    }

    return Promise.reject(error)
  },
)

export default apiClient
