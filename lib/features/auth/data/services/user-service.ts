import { BaseSupabaseService } from '@/lib/shared/data/services/base_supabase_service'

export interface AuthUser {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
}

export interface UpdateUserData {
  username?: string
  full_name?: string
  avatar_url?: string
}

export class UserService extends BaseSupabaseService<'profiles'> {
  constructor() {
    super({ tableName: 'profiles' })
  }

  // Helper method to map database record to AuthUser
  private mapToAuthUser(data: any): AuthUser {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // Create a new user profile
  async createUser(userData: CreateUserData): Promise<AuthUser | null> {
    try {
      const data = await this.create(userData)
      return data ? this.mapToAuthUser(data) : null
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const data = await this.getById(userId)
      return data ? this.mapToAuthUser(data) : null
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const data = await this.getByEmail(email)
      return data ? this.mapToAuthUser(data) : null
    } catch (error) {
      console.error('Error getting user by email:', error)
      return null
    }
  }

  // Check if user exists by email
  async userExistsByEmail(email: string): Promise<boolean> {
    try {
      return await this.existsByEmail(email)
    } catch (error) {
      console.error('Error checking if user exists by email:', error)
      return false
    }
  }

  // Check if user exists by ID
  async userExistsById(userId: string): Promise<boolean> {
    try {
      return await this.exists(userId)
    } catch (error) {
      console.error('Error checking if user exists by ID:', error)
      return false
    }
  }

  // Update user profile
  async updateUser(userId: string, updates: UpdateUserData): Promise<AuthUser | null> {
    try {
      const data = await this.updateById(userId, updates)
      return data ? this.mapToAuthUser(data) : null
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  // Delete user profile
  async deleteUser(userId: string): Promise<boolean> {
    try {
      return await this.deleteById(userId)
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  // Get all users
  async getAllUsers(): Promise<AuthUser[]> {
    try {
      const profiles = await this.getAll()
      return profiles?.map(profile => this.mapToAuthUser(profile)) || []
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  }

  // Search users by username, email, or full name
  async searchUsers(query: string): Promise<AuthUser[]> {
    try {
      const profiles = await this.getByQuery((queryBuilder) => 
        queryBuilder
          .or(`username.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
      )
      
      return profiles?.map(profile => this.mapToAuthUser(profile)) || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  // Get user count
  async getUserCount(): Promise<number> {
    try {
      return await this.count()
    } catch (error) {
      console.error('Error getting user count:', error)
      return 0
    }
  }
}
