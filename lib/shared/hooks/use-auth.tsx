'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/shared/core/config'
import { toast } from 'sonner'
import { setAuthCookie, clearAuthCookie } from '@/lib/shared/utils/cookie-utils'

interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload()
        const currentUser = auth.currentUser
        const token = await currentUser.getIdToken()
        
        // Update stored token using utility
        setAuthCookie(token)
        
        setUser({
          id: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
        })
      } catch (error) {
        console.error('Error refreshing user:', error)
      }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      clearAuthCookie()
      toast.success('Successfully signed out')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Get fresh token and set cookie
          const token = await firebaseUser.getIdToken()
          setAuthCookie(token)
          
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          })
        } catch (error) {
          console.error('Error getting user token:', error)
          setUser(null)
        }
      } else {
        setUser(null)
        clearAuthCookie()
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for getting just the user info
export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}

// Hook for authentication status
export function useAuthStatus() {
  const { user, loading } = useAuth()
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  }
}
