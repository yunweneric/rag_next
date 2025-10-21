'use client'

import type { AuthUser } from '@/lib/features/auth/data/services/auth-service'

const SESSION_KEY = 'swiss_legal_user_session'
const SESSION_EXPIRY_KEY = 'swiss_legal_session_expiry'

export interface SessionData {
  user: AuthUser
  timestamp: number
  expiresAt: number
}

export class SessionManager {
  private static instance: SessionManager
  private sessionData: SessionData | null = null

  private constructor() {
    this.loadFromStorage()
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Store session in localStorage
  public setSession(user: AuthUser, expiresInHours: number = 24): void {
    const now = Date.now()
    const expiresAt = now + (expiresInHours * 60 * 60 * 1000) // Convert hours to milliseconds

    const sessionData: SessionData = {
      user,
      timestamp: now,
      expiresAt
    }

    this.sessionData = sessionData
    
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
      localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt.toString())
    } catch (error) {
      console.error('Failed to store session in localStorage:', error)
    }
  }

  // Get session from localStorage
  public getSession(): SessionData | null {
    if (this.sessionData) {
      return this.sessionData
    }

    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return null

      const sessionData: SessionData = JSON.parse(stored)
      
      // Check if session is expired
      if (Date.now() > sessionData.expiresAt) {
        this.clearSession()
        return null
      }

      this.sessionData = sessionData
      return sessionData
    } catch (error) {
      console.error('Failed to load session from localStorage:', error)
      this.clearSession()
      return null
    }
  }

  // Get current user from session
  public getCurrentUser(): AuthUser | null {
    const session = this.getSession()
    return session?.user || null
  }

  // Check if session is valid
  public isSessionValid(): boolean {
    const session = this.getSession()
    return session !== null && Date.now() < session.expiresAt
  }

  // Clear session from localStorage
  public clearSession(): void {
    this.sessionData = null
    
    try {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(SESSION_EXPIRY_KEY)
    } catch (error) {
      console.error('Failed to clear session from localStorage:', error)
    }
  }

  // Update user data in session
  public updateUser(user: AuthUser): void {
    const session = this.getSession()
    if (session) {
      session.user = user
      this.setSession(user, 24) // Refresh expiry
    }
  }

  // Load session from storage on initialization
  private loadFromStorage(): void {
    this.getSession()
  }

  // Get session expiry time
  public getSessionExpiry(): number | null {
    try {
      const expiry = localStorage.getItem(SESSION_EXPIRY_KEY)
      return expiry ? parseInt(expiry, 10) : null
    } catch (error) {
      console.error('Failed to get session expiry:', error)
      return null
    }
  }

  // Check if session is about to expire (within 1 hour)
  public isSessionExpiringSoon(): boolean {
    const expiry = this.getSessionExpiry()
    if (!expiry) return false
    
    const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
    return Date.now() > (expiry - oneHour)
  }

  // Refresh session (extend expiry)
  public refreshSession(): void {
    const session = this.getSession()
    if (session) {
      this.setSession(session.user, 24) // Refresh for another 24 hours
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()
