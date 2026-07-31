import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../constants/auth'
import apiClient from '../services/apiClient'
import AuthContext from './AuthContext'

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

function getStoredUser() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedUser = window.localStorage.getItem(AUTH_USER_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

function setAuthorizationHeader(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete apiClient.defaults.headers.common.Authorization
}

function persistUser(user) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken())
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
      window.localStorage.removeItem(AUTH_USER_KEY)
    }

    setAuthorizationHeader(null)
    setToken(null)
    setUser(null)
  }, [])

  const currentUser = useCallback(async () => {
    const response = await apiClient.get('/auth/me')
    setUser(response.data)
    persistUser(response.data)
    return response.data
  }, [])

  const login = useCallback(
    async ({ email, password }) => {
      const response = await apiClient.post('/auth/login', { email, password })
      const nextToken = response.data?.token

      if (!nextToken) {
        throw new Error('Login response did not include an access token.')
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
      }

      setAuthorizationHeader(nextToken)
      setToken(nextToken)

      const nextUser = await currentUser()

      return {
        message: response.data?.message || 'Login successful',
        token: nextToken,
        user: nextUser,
      }
    },
    [currentUser],
  )

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const isAuthenticated = useCallback(() => {
    return Boolean(token || getStoredToken())
  }, [token])

  useEffect(() => {
    let isMounted = true
    const storedToken = getStoredToken()

    async function bootstrapSession() {
      if (!storedToken) {
        setLoading(false)
        return
      }

      setAuthorizationHeader(storedToken)

      try {
        const response = await apiClient.get('/auth/me')

        if (isMounted) {
          setToken(storedToken)
          setUser(response.data)
          persistUser(response.data)
        }
      } catch (error) {
        const status = error.response?.status

        if (isMounted && (status === 401 || status === 403)) {
          clearSession()
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [clearSession])

  useEffect(() => {
    function handleAuthError(event) {
      if (event.detail?.status === 401 && getStoredToken()) {
        clearSession()
      }
    }

    window.addEventListener('resumeai:auth-error', handleAuthError)

    return () => {
      window.removeEventListener('resumeai:auth-error', handleAuthError)
    }
  }, [clearSession])

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated,
      loading,
      login,
      logout,
      token,
      user,
    }),
    [currentUser, isAuthenticated, loading, login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
