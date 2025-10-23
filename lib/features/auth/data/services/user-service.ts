import { BaseSupabaseService } from "@/lib/shared/data/services/base_supabase_service"

export interface AuthUser {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  website?: string
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  website?: string
}

export interface UpdateUserData {
  username?: string
  full_name?: string
  avatar_url?: string
  website?: string
}

export interface UserSearchOptions {
  query?: string
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'updated_at' | 'username' | 'full_name'
  orderDirection?: 'asc' | 'desc'
}

/**
 * UserService following official Supabase patterns and best practices
 * Based on the official Supabase documentation for TypeScript services
 */
export class UserService extends BaseSupabaseService<'profiles'> {
  constructor() {
    super({ tableName: 'profiles' })
  }

  /**
   * Helper method to map database record to AuthUser
   * Following official Supabase data mapping patterns
   */
  private mapToAuthUser(data: any): AuthUser {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      website: data.website,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  /**
   * Create a new user profile
   * Following official Supabase user creation patterns
   */
  async createUser(userData: CreateUserData): Promise<AuthUser | null> {
    try {
      console.log('UserService: Creating user with data:', userData)
      
      // Validate required fields
      if (!userData.id || !userData.email || !userData.username) {
        throw new Error('Missing required fields: id, email, or username')
      }

      const data = await this.create(userData)
      console.log('UserService: Create result:', data)
      
      if (!data) {
        console.error('UserService: Create returned null')
        return null
      }
      
      const mappedUser = this.mapToAuthUser(data)
      console.log('UserService: Mapped user:', mappedUser)
      return mappedUser
    } catch (error) {
      console.error('UserService: Error creating user:', error)
      return null
    }
  }

  /**
   * Get user by ID
   * Following official Supabase data retrieval patterns
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      const data = await this.getById(userId)
      return data ? this.mapToAuthUser(data) : null
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  /**
   * Get user by email
   * Following official Supabase data retrieval patterns
   */
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      if (!email) {
        throw new Error('Email is required')
      }

      const data = await this.getByEmail(email)
      return data ? this.mapToAuthUser(data) : null
    } catch (error) {
      console.error('Error getting user by email:', error)
      return null
    }
  }

  /**
   * Check if user exists by email
   * Following official Supabase existence check patterns
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    try {
      if (!email) {
        return false
      }

      return await this.existsByEmail(email)
    } catch (error) {
      console.error('Error checking if user exists by email:', error)
      return false
    }
  }

  /**
   * Check if user exists by ID
   * Following official Supabase existence check patterns
   */
  async userExistsById(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        return false
      }

      return await this.exists(userId)
    } catch (error) {
      console.error('Error checking if user exists by ID:', error)
      return false
    }
  }

  /**
   * Update user profile
   * Following official Supabase update patterns
   */
  async updateUser(userId: string, updates: UpdateUserData): Promise<AuthUser | null> {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Update data is required')
      }

      const data = await this.updateById(userId, updates)
      return data ? this.mapToAuthUser(data) : null
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  /**
   * Delete user profile
   * Following official Supabase deletion patterns
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      return await this.deleteById(userId)
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  /**
   * Get all users with pagination
   * Following official Supabase pagination patterns
   */
  async getAllUsers(page: number = 1, limit: number = 50): Promise<{
    users: AuthUser[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const result = await this.getPaginated(page, limit)
      
      if (!result) {
        return {
          users: [],
          total: 0,
          page,
          limit
        }
      }

      return {
        users: result.data.map(profile => this.mapToAuthUser(profile)),
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    } catch (error) {
      console.error('Error getting all users:', error)
      return {
        users: [],
        total: 0,
        page,
        limit
      }
    }
  }

  /**
   * Search users by username, email, or full name
   * Following official Supabase search patterns
   */
  async searchUsers(options: UserSearchOptions): Promise<AuthUser[]> {
    try {
      const { query, limit = 20, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = options

      if (!query || query.trim().length === 0) {
        return []
      }

      const profiles = await this.getByQuery((queryBuilder) => 
        queryBuilder
          .or(`username.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
          .order(orderBy, { ascending: orderDirection === 'asc' })
          .range(offset, offset + limit - 1)
      )
      
      return profiles?.map(profile => this.mapToAuthUser(profile)) || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  /**
   * Get user count
   * Following official Supabase counting patterns
   */
  async getUserCount(): Promise<number> {
    try {
      return await this.count()
    } catch (error) {
      console.error('Error getting user count:', error)
      return 0
    }
  }

  /**
   * Get users by multiple IDs
   * Following official Supabase batch retrieval patterns
   */
  async getUsersByIds(userIds: string[]): Promise<AuthUser[]> {
    try {
      if (!userIds || userIds.length === 0) {
        return []
      }

      const profiles = await this.getByQuery((queryBuilder) => 
        queryBuilder.in('id', userIds)
      )
      
      return profiles?.map(profile => this.mapToAuthUser(profile)) || []
    } catch (error) {
      console.error('Error getting users by IDs:', error)
      return []
    }
  }

  /**
   * Update multiple users
   * Following official Supabase batch update patterns
   */
  async updateMultipleUsers(userIds: string[], updates: UpdateUserData): Promise<boolean> {
    try {
      if (!userIds || userIds.length === 0) {
        return false
      }

      if (!updates || Object.keys(updates).length === 0) {
        return false
      }

      const result = await this.updateMany(userIds, updates)
      return result !== null
    } catch (error) {
      console.error('Error updating multiple users:', error)
      return false
    }
  }

  /**
   * Delete multiple users
   * Following official Supabase batch deletion patterns
   */
  async deleteMultipleUsers(userIds: string[]): Promise<boolean> {
    try {
      if (!userIds || userIds.length === 0) {
        return false
      }

      return await this.deleteMany(userIds)
    } catch (error) {
      console.error('Error deleting multiple users:', error)
      return false
    }
  }

  /**
   * Get user statistics
   * Following official Supabase analytics patterns
   */
  async getUserStatistics(): Promise<{
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
  }> {
    try {
      const totalUsers = await this.getUserCount()
      
      // Get users created this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const newUsersThisMonth = await this.getByQuery((queryBuilder) => 
        queryBuilder
          .gte('created_at', thisMonth.toISOString())
          .select('*', { count: 'exact', head: true })
      )

      return {
        totalUsers,
        activeUsers: totalUsers, // In a real app, you'd calculate this based on activity
        newUsersThisMonth: newUsersThisMonth?.length || 0
      }
    } catch (error) {
      console.error('Error getting user statistics:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0
      }
    }
  }
}
