import { createClient } from '@supabase/supabase-js'
import { BaseSupabaseService } from '@/lib/shared/data/services/base_supabase_service'
import type { User, AuthError } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

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

export class AuthService extends BaseSupabaseService<'profiles'> {
  private authSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  constructor() {
    super({ tableName: 'profiles' })
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.authSupabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // Get user profile
      const profile = await this.getUserProfile(user.id)
      return profile
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const data = await this.getById(userId)
      
      if (!data) {
        return null
      }

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
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
        // Get user profile from database
        const { data: profile, error: profileError } = await this.authSupabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          return {
            user: null,
            error: { message: 'Failed to get user profile' } as AuthError,
            success: false
          }
        }

        const authUser: AuthUser = {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }

        return {
          user: authUser,
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

      if (data.user) {
        // Create user profile in database
        const { data: profile, error: profileError } = await this.authSupabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: credentials.email,
            username: credentials.username,
            full_name: credentials.full_name || credentials.username
          })
          .select()
          .single()

        if (profileError) {
          console.error('Profile creation error:', profileError)
          return {
            user: null,
            error: { message: 'Failed to create user profile' } as AuthError,
            success: false
          }
        }

        const authUser: AuthUser = {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }

        return {
          user: authUser,
          token: data.session?.access_token || undefined,
          refreshToken: data.session?.refresh_token || undefined,
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
        const profile = await this.getUserProfile(data.user.id)
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
      const data = await this.updateById(userId, updates)

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

  // Create user profile
  private async createUserProfile(userId: string, profileData: {
    email: string
    username: string
    full_name: string
  }): Promise<void> {
    try {
      await this.create({
        id: userId,
        email: profileData.email,
        username: profileData.username,
        full_name: profileData.full_name
      })
    } catch (error) {
      console.error('Error creating user profile:', error)
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

  // Get all user profiles (admin function)
  async getAllProfiles(): Promise<AuthUser[]> {
    try {
      const profiles = await this.getAll()
      return profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      })) || []
    } catch (error) {
      console.error('Error getting all profiles:', error)
      return []
    }
  }

  // Search profiles by username or email
  async searchProfiles(query: string): Promise<AuthUser[]> {
    try {
      const profiles = await this.getByQuery((queryBuilder) => 
        queryBuilder
          .or(`username.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
      )
      
      return profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      })) || []
    } catch (error) {
      console.error('Error searching profiles:', error)
      return []
    }
  }

  // Delete user profile
  async deleteProfile(userId: string): Promise<boolean> {
    try {
      return await this.deleteById(userId)
    } catch (error) {
      console.error('Error deleting profile:', error)
      return false
    }
  }

  // Check if profile exists
  async profileExists(userId: string): Promise<boolean> {
    try {
      return await this.exists(userId)
    } catch (error) {
      console.error('Error checking profile existence:', error)
      return false
    }
  }

  // Get profile count
  async getProfileCount(): Promise<number> {
    try {
      return await this.count()
    } catch (error) {
      console.error('Error getting profile count:', error)
      return 0
    }
  }

  // Validate JWT token (for API routes)
  async validateToken(token: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: { user }, error } = await this.authSupabase.auth.getUser(token)
      
      if (error || !user) {
        return { user: null, error: 'Invalid token' }
      }

      // Get user profile
      const { data: profile, error: profileError } = await this.authSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { user: null, error: 'User profile not found' }
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }

      return { user: authUser, error: null }
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