'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/shared/hooks/use-auth'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

/**
 * AuthGuard component that handles authentication-based redirects
 * @param children - The content to render
 * @param redirectTo - Where to redirect if condition is met (default: '/chat')
 * @param requireAuth - If true, redirects unauthenticated users to login. If false, redirects authenticated users away from auth pages
 */
export function AuthGuard({ 
  children, 
  redirectTo = '/chat', 
  requireAuth = false 
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (loading) return

    if (requireAuth) {
      // If authentication is required but user is not authenticated
      if (!user) {
        router.replace('/login')
      }
    } else {
      // If user is authenticated but trying to access auth pages (login/signup)
      if (user) {
        router.replace(redirectTo)
      }
    }
  }, [user, loading, router, redirectTo, requireAuth])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If requireAuth is true and user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null
  }

  // If requireAuth is false and user is authenticated, don't render children (will redirect)
  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}

/**
 * Component specifically for protecting auth pages (login/signup)
 * Redirects authenticated users to chat
 */
export function AuthPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false} redirectTo="/chat">
      {children}
    </AuthGuard>
  )
}

/**
 * Component for protecting pages that require authentication
 * Redirects unauthenticated users to login
 */
export function ProtectedPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true}>
      {children}
    </AuthGuard>
  )
}
