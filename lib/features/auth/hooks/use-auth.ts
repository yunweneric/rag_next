'use client'

import { useState, useEffect, useCallback } from 'react'
import { type AuthUser, type LoginCredentials, type SignupCredentials, type OTPVerification } from '../data/services/auth-service'

export interface UseAuthReturn {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  signup: (credentials: SignupCredentials) => Promise<boolean>
  logout: () => Promise<boolean>
  refreshTokens: () => Promise<boolean>
  verifyOTP: (otpData: OTPVerification) => Promise<boolean>
  resendOTP: (email: string, type?: 'signup' | 'recovery') => Promise<boolean>
  updateProfile: (updates: Partial<AuthUser>) => Promise<boolean>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        setLoading(true)
        
        // Get stored auth data from localStorage
        const storedUser = localStorage.getItem('auth_user')
        const storedToken = localStorage.getItem('auth_token')
        const storedRefreshToken = localStorage.getItem('auth_refresh_token')
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser))
          setToken(storedToken)
          setRefreshToken(storedRefreshToken)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!refreshToken) return

    const refreshInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken })
        })

        if (response.ok) {
          const data = await response.json()
          setToken(data.token)
          setRefreshToken(data.refreshToken)
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('auth_refresh_token', data.refreshToken)
        } else {
          // Refresh failed, logout user
          setUser(null)
          setToken(null)
          setRefreshToken(null)
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_refresh_token')
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
      }
    }, 50 * 60 * 1000) // Refresh every 50 minutes

    return () => clearInterval(refreshInterval)
  }, [refreshToken])

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setUser(data.user)
        setToken(data.token)
        setRefreshToken(data.refreshToken)
        
        // Store in localStorage
        localStorage.setItem('auth_user', JSON.stringify(data.user))
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_refresh_token', data.refreshToken)
        
        return true
      } else {
        setError(data.error || 'Login failed')
        return false
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred during login')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Signup function
  const signup = useCallback(async (credentials: SignupCredentials): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setUser(data.user)
        setToken(data.token)
        setRefreshToken(data.refreshToken)
        
        // Store in localStorage
        localStorage.setItem('auth_user', JSON.stringify(data.user))
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_refresh_token', data.refreshToken)
        
        return true
      } else {
        setError(data.error || 'Signup failed')
        return false
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred during signup')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      // Clear user state and tokens
      setUser(null)
      setToken(null)
      setRefreshToken(null)
      
      // Clear localStorage
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_refresh_token')
      
      return true
    } catch (err) {
      console.error('Logout error:', err)
      // Clear user state and token even on error
      setUser(null)
      setToken(null)
      setRefreshToken(null)
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_refresh_token')
      return true
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh tokens function
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      setError('No refresh token available')
      return false
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setToken(data.token)
        setRefreshToken(data.refreshToken)
        
        // Update localStorage
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_refresh_token', data.refreshToken)
        
        return true
      } else {
        setError(data.error || 'Token refresh failed')
        // If refresh fails, logout user
        setUser(null)
        setToken(null)
        setRefreshToken(null)
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh_token')
        return false
      }
    } catch (err) {
      console.error('Token refresh error:', err)
      setError('An unexpected error occurred during token refresh')
      return false
    } finally {
      setLoading(false)
    }
  }, [refreshToken])

  // Verify OTP function (placeholder - would need API endpoint)
  const verifyOTP = useCallback(async (otpData: OTPVerification): Promise<boolean> => {
    setError('OTP verification not implemented with new API structure')
    return false
  }, [])

  // Resend OTP function (placeholder - would need API endpoint)
  const resendOTP = useCallback(async (email: string, type: 'signup' | 'recovery' = 'signup'): Promise<boolean> => {
    setError('Resend OTP not implemented with new API structure')
    return false
  }, [])

  // Update profile function (placeholder - would need API endpoint)
  const updateProfile = useCallback(async (updates: Partial<AuthUser>): Promise<boolean> => {
    if (!user) {
      setError('No user logged in')
      return false
    }

    setError('Profile update not implemented with new API structure')
    return false
  }, [user])

  return {
    user,
    token,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshTokens,
    verifyOTP,
    resendOTP,
    updateProfile,
    clearError
  }
}
