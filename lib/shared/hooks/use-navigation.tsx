'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from './use-auth'
import { useEffect, useState } from 'react'

export function useAuthNavigation() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isNavigating, setIsNavigating] = useState(false)

  const navigateToChat = async () => {
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      // Wait for auth state to be ready
      if (loading) {
        // Wait for auth to finish loading
        await new Promise(resolve => {
          const checkAuth = () => {
            if (!loading) {
              resolve(true)
            } else {
              setTimeout(checkAuth, 50)
            }
          }
          checkAuth()
        })
      }
      
      // Ensure user is authenticated
      if (!user) {
        console.error('User not authenticated, cannot navigate to chat')
        return
      }
      
      // Longer delay to ensure cookie is set and middleware can read it
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Force a full page reload to ensure middleware gets the updated cookie
      window.location.href = '/chat'
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to window.location
      window.location.href = '/chat'
    } finally {
      setIsNavigating(false)
    }
  }

  return {
    navigateToChat,
    isNavigating,
    user,
    loading
  }
}
