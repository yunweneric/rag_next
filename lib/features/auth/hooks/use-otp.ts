'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'
import type { OTPVerification } from '../data/services/auth-service'

export interface UseOTPReturn {
  verifyOTP: (otpData: OTPVerification) => Promise<boolean>
  resendOTP: (email: string, type?: 'signup' | 'recovery') => Promise<boolean>
  loading: boolean
  error: string | null
  clearError: () => void
}

export function useOTP(): UseOTPReturn {
  const { verifyOTP: authVerifyOTP, resendOTP: authResendOTP, loading, error, clearError } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const verifyOTP = useCallback(async (otpData: OTPVerification): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      return await authVerifyOTP(otpData)
    } finally {
      setIsSubmitting(false)
    }
  }, [authVerifyOTP])

  const resendOTP = useCallback(async (email: string, type: 'signup' | 'recovery' = 'signup'): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      return await authResendOTP(email, type)
    } finally {
      setIsSubmitting(false)
    }
  }, [authResendOTP])

  return {
    verifyOTP,
    resendOTP,
    loading: loading || isSubmitting,
    error,
    clearError
  }
}
