import { createClient } from '@supabase/supabase-js'
import { UserService, type AuthUser } from './user-service'
import { registerSchema } from '@/lib/shared/validations/auth'
import type { AuthError } from '@supabase/supabase-js'

// Re-export AuthUser from UserService for backward compatibility
export type { AuthUser }

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  username: string
  full_name?: string
}

export interface AuthResponse {
  user: AuthUser | null
  error: AuthError | null
  success: boolean
}

export interface OTPVerification {
  token: string
  email: string
  type: 'email' | 'sms'
}

/**
 * AuthService following official Supabase patterns and best practices
 * Based on the official Supabase documentation for authentication
 */
export class AuthService extends UserService {
  private authSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  private adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
      )
    : null

  constructor() {
    super()
  }

  /**
   * Get current user following official Supabase patterns
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.authSupabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // Get user profile using inherited method
      return await this.getUserById(user.id)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Get user profile by ID following official Supabase patterns
   */
  async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      return await this.getUserById(userId)
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  /**
   * Login with email and password following official Supabase patterns
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse & { token?: string; refreshToken?: string }> {
    try {
      const { data, error } = await this.authSupabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return {
          user: null,
          error,
          success: false
        }
      }

      if (data.user && data.session) {
        // Get user profile from database using inherited method
        const profile = await this.getUserById(data.user.id)

        if (!profile) {
          return {
            user: null,
            error: { message: 'Failed to get user profile' } as AuthError,
            success: false
          }
        }

        console.log("AuthService: User authenticated successfully", profile)

        return {
          user: profile,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          error: null,
          success: true
        }
      }

      return {
        user: null,
        error: null,
        success: false
      }
    } catch (error) {
      console.error('AuthService: Login error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  /**
   * Signup with email and password following official Supabase patterns
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponse & { token?: string; refreshToken?: string }> {
    try {
      // Validate input data using Zod
      const validationResult = registerSchema.safeParse(credentials)
      if (!validationResult.success) {
        return {
          user: null,
          error: { 
            message: validationResult.error.errors.map(e => e.message).join(', ') 
          } as AuthError,
          success: false
        }
      }

      // Check if user already exists by email
      const userExists = await this.userExistsByEmail(credentials.email)
      if (userExists) {
        return {
          user: null,
          error: { message: 'User already exists with this email address' } as AuthError,
          success: false
        }
      }

      // Use admin API to create user (bypasses auth.users table issues)
      console.log('AuthService: Using admin API to create user...')
      
      if (!this.adminSupabase) {
        return {
          user: null,
          error: { message: 'Admin client not available. Please set SUPABASE_SERVICE_ROLE_KEY' } as AuthError,
          success: false
        }
      }

      const { data: adminData, error: adminError } = await this.adminSupabase.auth.admin.createUser({
        email: credentials.email,
        password: credentials.password,
        email_confirm: true,
        user_metadata: {
          username: credentials.username,
          full_name: credentials.full_name || credentials.username
        }
      })

      console.log('AuthService: Admin user creation result:', { data: adminData, error: adminError })

      if (adminError || !adminData.user) {
        console.error('AuthService: Admin user creation error:', adminError)
        return {
          user: null,
          error: adminError || { message: 'Failed to create user' } as AuthError,
          success: false
        }
      }

      console.log('AuthService: Admin user created:', adminData.user.id)

      // Sign in to get session
      const { data: signInData, error: signInError } = await this.authSupabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (signInError || !signInData.session) {
        console.error('AuthService: Sign in error:', signInError)
        return {
          user: null,
          error: signInError || { message: 'Failed to create session' } as AuthError,
          success: false
        }
      }

      console.log('AuthService: User signed in successfully')

      // Create user profile in database using server-side client
      console.log('AuthService: Creating user profile with data:', {
        id: adminData.user.id,
        email: credentials.email,
        username: credentials.username,
        full_name: credentials.full_name || credentials.username
      })
      
      const profile = await this.createUser({
        id: adminData.user.id,
        email: credentials.email,
        username: credentials.username,
        full_name: credentials.full_name || credentials.username
      })

      console.log('AuthService: Profile creation result:', profile)

      if (!profile) {
        console.error('AuthService: Profile creation failed - returning error')
        return {
          user: null,
          error: { message: 'Failed to create user profile' } as AuthError,
          success: false
        }
      }

      return {
        user: profile,
        token: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('AuthService: Signup error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  /**
   * Verify OTP following official Supabase patterns
   */
  async verifyOTP(otpData: OTPVerification): Promise<AuthResponse> {
    try {
      const { data, error } = await this.authSupabase.auth.verifyOtp({
        token: otpData.token,
        type: otpData.type as any,
        email: otpData.email
      })

      if (error) {
        return {
          user: null,
          error,
          success: false
        }
      }

      if (data.user) {
        const profile = await this.getUserById(data.user.id)
        return {
          user: profile,
          error: null,
          success: true
        }
      }

      return {
        user: null,
        error: null,
        success: false
      }
    } catch (error) {
      console.error('AuthService: OTP verification error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  /**
   * Resend OTP following official Supabase patterns
   */
  async resendOTP(email: string, type: 'signup' | 'recovery' = 'signup'): Promise<AuthResponse> {
    try {
      const { error } = await this.authSupabase.auth.resend({
        type: type as any,
        email
      })

      if (error) {
        return {
          user: null,
          error,
          success: false
        }
      }

      return {
        user: null,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('AuthService: Resend OTP error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  /**
   * Logout following official Supabase patterns
   */
  async logout(): Promise<AuthResponse> {
    try {
      // Sign out from Supabase
      const { error } = await this.authSupabase.auth.signOut()

      if (error) {
        console.error('AuthService: Supabase logout error:', error)
        return {
          user: null,
          error,
          success: false
        }
      }

      return {
        user: null,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('AuthService: Logout error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  /**
   * Update user profile following official Supabase patterns
   */
  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthResponse> {
    try {
      const data = await this.updateUser(userId, updates)

      if (!data) {
        return {
          user: null,
          error: { message: 'Failed to update profile' } as AuthError,
          success: false
        }
      }

      return {
        user: data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('AuthService: Update profile error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  /**
   * Check if user is authenticated following official Supabase patterns
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch (error) {
      console.error('AuthService: Error checking authentication:', error)
      return false
    }
  }

  /**
   * Get auth session following official Supabase patterns
   */
  async getSession() {
    try {
      const { data: { session }, error } = await this.authSupabase.auth.getSession()
      
      if (error) {
        return null
      }

      return session
    } catch (error) {
      console.error('AuthService: Error getting session:', error)
      return null
    }
  }

  /**
   * Validate JWT token following official Supabase patterns
   */
  async validateToken(token: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: { user }, error } = await this.authSupabase.auth.getUser(token)
      
      if (error || !user) {
        return { user: null, error: 'Invalid token' }
      }

      // Get user profile using inherited method
      const profile = await this.getUserById(user.id)

      if (!profile) {
        return { user: null, error: 'User profile not found' }
      }

      return { user: profile, error: null }
    } catch (error) {
      console.error('AuthService: Token validation error:', error)
      return { user: null, error: 'Token validation failed' }
    }
  }

  /**
   * Refresh access token following official Supabase patterns
   */
  async refreshAccessToken(refreshToken: string): Promise<{ token?: string; refreshToken?: string; error: string | null }> {
    try {
      const { data, error } = await this.authSupabase.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (error || !data.session) {
        return { error: 'Failed to refresh token' }
      }

      return {
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        error: null
      }
    } catch (error) {
      console.error('AuthService: Token refresh error:', error)
      return { error: 'Token refresh failed' }
    }
  }

  /**
   * Get user statistics following official Supabase patterns
   */
  async getUserStatistics(): Promise<{
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
  }> {
    try {
      return await this.getUserStatistics()
    } catch (error) {
      console.error('AuthService: Error getting user statistics:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0
      }
    }
  }
}
