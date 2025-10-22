import { NextRequest } from 'next/server'
import { AuthService } from '@/lib/features/auth/data/services/auth-service'
import type { AuthUser } from '@/lib/features/auth/data/services/auth-service'

export interface AuthResult {
  user: AuthUser | null
  error: string | null
}

export async function validateJWTToken(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization header' }
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Use AuthService to validate token and get user profile
    const authService = new AuthService()
    const { user, error } = await authService.validateToken(token)
    
    return { user, error }
  } catch (error) {
    console.error('Token validation error:', error)
    return { user: null, error: 'Token validation failed' }
  }
}
