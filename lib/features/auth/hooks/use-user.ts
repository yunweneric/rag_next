'use client'

import { useAuth } from './use-auth'
import type { AuthUser } from '../data/services/auth-service'

export interface UseUserReturn {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  updateProfile: (updates: Partial<AuthUser>) => Promise<boolean>
}

export function useUser(): UseUserReturn {
  const { user, loading, isAuthenticated, updateProfile } = useAuth()

  return {
    user,
    loading,
    isAuthenticated,
    updateProfile
  }
}
