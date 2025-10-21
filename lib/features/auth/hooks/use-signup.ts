'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'
import type { SignupCredentials } from '../data/services/auth-service'

export interface UseSignupReturn {
  signup: (credentials: SignupCredentials) => Promise<boolean>
  loading: boolean
  error: string | null
  clearError: () => void
}

export function useSignup(): UseSignupReturn {
  const { signup: authSignup, loading, error, clearError } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const signup = useCallback(async (credentials: SignupCredentials): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      return await authSignup(credentials)
    } finally {
      setIsSubmitting(false)
    }
  }, [authSignup])

  return {
    signup,
    loading: loading || isSubmitting,
    error,
    clearError
  }
}
