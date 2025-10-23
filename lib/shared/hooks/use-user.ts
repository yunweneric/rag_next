'use client'

import { useState, useEffect } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/shared/core/config'

export interface UserInfo {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  createdAt?: string
  lastLoginAt?: string
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: User | null) => {
        if (firebaseUser) {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            createdAt: firebaseUser.metadata.creationTime || undefined,
            lastLoginAt: firebaseUser.metadata.lastSignInTime || undefined,
          })
          setError(null)
        } else {
          setUser(null)
        }
        setLoading(false)
      },
      (error) => {
        console.error('Auth state change error:', error)
        setError(error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const refreshUser = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload()
        const currentUser = auth.currentUser
        setUser({
          id: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
          createdAt: currentUser.metadata.creationTime || undefined,
          lastLoginAt: currentUser.metadata.lastSignInTime || undefined,
        })
      } catch (error) {
        console.error('Error refreshing user:', error)
        setError('Failed to refresh user data')
      }
    }
  }

  return {
    user,
    loading,
    error,
    refreshUser,
    isAuthenticated: !!user,
  }
}
