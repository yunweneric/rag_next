'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuthService, type AuthUser, type LoginCredentials, type SignupCredentials, type OTPVerification } from '../data/services/auth-service'

export interface UseAuthReturn {
  user: AuthUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  signup: (credentials: SignupCredentials) => Promise<boolean>
  logout: () => Promise<boolean>
  verifyOTP: (otpData: OTPVerification) => Promise<boolean>
  resendOTP: (email: string, type?: 'signup' | 'recovery') => Promise<boolean>
  updateProfile: (updates: Partial<AuthUser>) => Promise<boolean>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authService] = useState(() => new AuthService())

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)
        
        // First try to get user from localStorage session
        if (typeof window !== 'undefined') {
          const { sessionManager } = await import('@/lib/shared/utils/session-manager')
          const sessionUser = sessionManager.getCurrentUser()
          
          if (sessionUser && sessionManager.isSessionValid()) {
            setUser(sessionUser)
            setLoading(false)
            return
          }
        }
        
        // Fallback to Supabase auth
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [authService])

  // Listen for auth state changes
  useEffect(() => {
    const { createClient } = require('@/lib/shared/utils/supabase/client')
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await authService.getUserProfile(session.user.id)
          setUser(userProfile)
          
          // Store session in localStorage
          if (userProfile && typeof window !== 'undefined') {
            const { sessionManager } = await import('@/lib/shared/utils/session-manager')
            sessionManager.setSession(userProfile, 24)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          
          // Clear session from localStorage
          if (typeof window !== 'undefined') {
            const { sessionManager } = await import('@/lib/shared/utils/session-manager')
            sessionManager.clearSession()
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [authService])

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authService.login(credentials)
      
      if (response.success && response.user) {
        setUser(response.user)
        return true
      } else {
        setError(response.error?.message || 'Login failed')
        return false
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred during login')
      return false
    } finally {
      setLoading(false)
    }
  }, [authService])

  // Signup function
  const signup = useCallback(async (credentials: SignupCredentials): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authService.signup(credentials)
      
      if (response.success && response.user) {
        setUser(response.user)
        return true
      } else {
        setError(response.error?.message || 'Signup failed')
        return false
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred during signup')
      return false
    } finally {
      setLoading(false)
    }
  }, [authService])

  // Logout function
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      // Clear session from localStorage first
      if (typeof window !== 'undefined') {
        const { sessionManager } = await import('@/lib/shared/utils/session-manager')
        sessionManager.clearSession()
      }
      
      const response = await authService.logout()
      
      // Always clear user state regardless of response
      setUser(null)
      
      if (response.success) {
        return true
      } else {
        // Even if logout fails, we've cleared local session
        console.warn('Supabase logout failed, but local session cleared:', response.error?.message)
        return true
      }
    } catch (err) {
      console.error('Logout error:', err)
      // Clear user state even on error
      setUser(null)
      return true // Consider successful since we cleared local session
    } finally {
      setLoading(false)
    }
  }, [authService])

  // Verify OTP function
  const verifyOTP = useCallback(async (otpData: OTPVerification): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authService.verifyOTP(otpData)
      
      if (response.success && response.user) {
        setUser(response.user)
        return true
      } else {
        setError(response.error?.message || 'OTP verification failed')
        return false
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setError('An unexpected error occurred during OTP verification')
      return false
    } finally {
      setLoading(false)
    }
  }, [authService])

  // Resend OTP function
  const resendOTP = useCallback(async (email: string, type: 'signup' | 'recovery' = 'signup'): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authService.resendOTP(email, type)
      
      if (response.success) {
        return true
      } else {
        setError(response.error?.message || 'Failed to resend OTP')
        return false
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('An unexpected error occurred while resending OTP')
      return false
    } finally {
      setLoading(false)
    }
  }, [authService])

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<AuthUser>): Promise<boolean> => {
    if (!user) {
      setError('No user logged in')
      return false
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await authService.updateProfile(user.id, updates)
      
      if (response.success && response.user) {
        setUser(response.user)
        return true
      } else {
        setError(response.error?.message || 'Profile update failed')
        return false
      }
    } catch (err) {
      console.error('Profile update error:', err)
      setError('An unexpected error occurred during profile update')
      return false
    } finally {
      setLoading(false)
    }
  }, [authService, user])

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    verifyOTP,
    resendOTP,
    updateProfile,
    clearError
  }
}
