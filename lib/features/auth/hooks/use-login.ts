'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'
import type { LoginCredentials } from '../data/services/auth-service'

export interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<boolean>
  loading: boolean
  error: string | null
  clearError: () => void
}

export function useLogin(): UseLoginReturn {
  const { login: authLogin, loading, error, clearError } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      return await authLogin(credentials)
    } finally {
      setIsSubmitting(false)
    }
  }, [authLogin])

  return {
    login,
    loading: loading || isSubmitting,
    error,
    clearError
  }
}
