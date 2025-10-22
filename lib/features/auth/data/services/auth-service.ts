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

  // Get current user
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

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      return await this.getUserById(userId)
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  // Login with email and password (server-side)
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

        console.log("auth user", profile)

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
      console.error('Login error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  // Signup with email and password (server-side)
  async signup(credentials: SignupCredentials): Promise<AuthResponse & { token?: string; refreshToken?: string }> {
    try {
      
      // Check if user already exists by email
      const userExists = await this.userExistsByEmail(credentials.email)
      if (userExists) {
        return {
          user: null,
          error: { message: 'User already exists with this email address' } as AuthError,
          success: false
        }
      }

      // Preferred path: use admin client to ensure session via immediate sign-in
      if (this.adminSupabase) {
        const { data: adminData, error: adminError } = await this.adminSupabase.auth.admin.createUser({
          email: credentials.email,
          password: credentials.password,
          email_confirm: true,
          user_metadata: {
            username: credentials.username,
            full_name: credentials.full_name || credentials.username
          }
        })

        if (adminError || !adminData.user) {
          return {
            user: null,
            error: (adminError as unknown as AuthError) || ({ message: 'Failed to create user' } as AuthError),
            success: false
          }
        }

        // Sign in to get a valid session
        const { data: signInData, error: signInError } = await this.authSupabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        })

        if (signInError || !signInData.session) {
          // Optional rollback
          try { await this.adminSupabase.auth.admin.deleteUser(adminData.user.id) } catch {}
          return {
            user: null,
            error: (signInError as unknown as AuthError) || ({ message: 'Failed to create session' } as AuthError),
            success: false
          }
        }

        // Create profile
        const profile = await this.createUser({
          id: adminData.user.id,
          email: credentials.email,
          username: credentials.username,
          full_name: credentials.full_name || credentials.username
        })

        if (!profile) {
          try { await this.adminSupabase.auth.admin.deleteUser(adminData.user.id) } catch {}
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
      }

      // Fallback: anon signUp; attempt immediate signIn if session is null
      const { data, error } = await this.authSupabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
            full_name: credentials.full_name || credentials.username
          }
        }
      })

      if (error) {
        return {
          user: null,
          error,
          success: false
        }
      }

      let session = data.session
      let authUserId = data.user?.id
      if (!session) {
        const { data: signInData } = await this.authSupabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        })
        session = signInData?.session || null
        authUserId = signInData?.user?.id || authUserId
      }

      if (!authUserId) {
        return {
          user: null,
          error: { message: 'Signup created user without id' } as AuthError,
          success: false
        }
      }

      const profile = await this.createUser({
        id: authUserId,
        email: credentials.email,
        username: credentials.username,
        full_name: credentials.full_name || credentials.username
      })

      if (!profile) {
        return {
          user: null,
          error: { message: 'Failed to create user profile' } as AuthError,
          success: false
        }
      }

      return {
        user: profile,
        token: session?.access_token || undefined,
        refreshToken: session?.refresh_token || undefined,
        error: null,
        success: Boolean(session)
      }
    } catch (error) {
      console.error('Signup error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  // Verify OTP
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
      console.error('OTP verification error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  // Resend OTP
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
      console.error('Resend OTP error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  // Logout
  async logout(): Promise<AuthResponse> {
    try {
      // Sign out from Supabase
      const { error } = await this.authSupabase.auth.signOut()

      if (error) {
        console.error('Supabase logout error:', error)
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
      console.error('Logout error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  // Update user profile
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
      console.error('Update profile error:', error)
      return {
        user: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }

  // Get auth session
  async getSession() {
    try {
      const { data: { session }, error } = await this.authSupabase.auth.getSession()
      
      if (error) {
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  // Note: All profile management methods are now inherited from UserService
  // You can use: getAllUsers(), searchUsers(), deleteUser(), userExistsById(), getUserCount()

  // Validate JWT token (for API routes)
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
      console.error('Token validation error:', error)
      return { user: null, error: 'Token validation failed' }
    }
  }

  // Refresh access token using refresh token
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
      console.error('Token refresh error:', error)
      return { error: 'Token refresh failed' }
    }
  }
}