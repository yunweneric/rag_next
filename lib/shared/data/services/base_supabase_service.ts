import { createClient } from '@/lib/shared/utils/supabase/server'
import type { Database } from '@/lib/shared/types/database'

export type TableName = keyof Database['public']['Tables']

export interface BaseSupabaseServiceConfig {
  tableName: TableName
}

/**
 * Base service class following official Supabase patterns and best practices
 * Based on the official Supabase documentation for TypeScript services
 */
export class BaseSupabaseService<T extends TableName> {
  protected tableName: T
  protected supabase: any

  constructor(config: BaseSupabaseServiceConfig) {
    this.tableName = config.tableName as T
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    // Use server-side client for proper authentication handling
    this.supabase = await createClient()
  }

  /**
   * Create a single record following official Supabase patterns
   */
  async create(data: any): Promise<any | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      console.log(`Creating ${this.tableName} with data:`, data)
      
      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error(`Error creating ${this.tableName}:`, error)
        return null
      }

      console.log(`Successfully created ${this.tableName}:`, result)
      return result
    } catch (error) {
      console.error(`Error in create method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Create multiple records
   */
  async createMany(data: any[]): Promise<any[] | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .insert(data)
        .select()

      if (error) {
        console.error(`Error creating multiple ${this.tableName}:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in createMany method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Get a single record by ID
   */
  async getById(id: string): Promise<any | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      console.log(`Looking up ${this.tableName} with ID:`, id)
      
      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error(`Error fetching ${this.tableName} by ID:`, error)
        return null
      }

      console.log(`Found ${this.tableName}:`, result)
      return result
    } catch (error) {
      console.error(`Error in getById method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Get all records with optional filtering
   */
  async getAll(filters?: Record<string, any>): Promise<any[] | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      let query = this.supabase
        .from(this.tableName as any)
        .select('*')

      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      const { data: result, error } = await query

      if (error) {
        console.error(`Error fetching all ${this.tableName}:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in getAll method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Get records with custom query builder
   */
  async getByQuery(queryBuilder: (query: any) => any): Promise<any[] | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const query = this.supabase
        .from(this.tableName as any)
        .select('*')

      const { data: result, error } = await queryBuilder(query)

      if (error) {
        console.error(`Error fetching ${this.tableName} with custom query:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in getByQuery method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Update a record by ID
   */
  async updateById(id: string, data: any): Promise<any | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error(`Error updating ${this.tableName}:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in updateById method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Update multiple records
   */
  async updateMany(ids: string[], data: any): Promise<any[] | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .update(data)
        .in('id', ids)
        .select()

      if (error) {
        console.error(`Error updating multiple ${this.tableName}:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in updateMany method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { error } = await this.supabase
        .from(this.tableName as any)
        .delete()
        .eq('id', id)

      if (error) {
        console.error(`Error deleting ${this.tableName}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error in deleteById method for ${this.tableName}:`, error)
      return false
    }
  }

  /**
   * Delete multiple records
   */
  async deleteMany(ids: string[]): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { error } = await this.supabase
        .from(this.tableName as any)
        .delete()
        .in('id', ids)

      if (error) {
        console.error(`Error deleting multiple ${this.tableName}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error in deleteMany method for ${this.tableName}:`, error)
      return false
    }
  }

  /**
   * Upsert a record (insert or update)
   */
  async upsert(data: any, conflictColumns: string[] = ['id']): Promise<any | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .upsert(data, { 
          onConflict: conflictColumns.join(',') 
        })
        .select()
        .single()

      if (error) {
        console.error(`Error upserting ${this.tableName}:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in upsert method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Count records
   */
  async count(): Promise<number> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { count, error } = await this.supabase
        .from(this.tableName as any)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error(`Error counting ${this.tableName}:`, error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error(`Error in count method for ${this.tableName}:`, error)
      return 0
    }
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data, error } = await this.supabase
        .from(this.tableName as any)
        .select('id')
        .eq('id', id)
        .single()

      if (error) {
        return false
      }

      return !!data
    } catch (error) {
      console.error(`Error in exists method for ${this.tableName}:`, error)
      return false
    }
  }

  /**
   * Check if record exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data, error } = await this.supabase
        .from(this.tableName as any)
        .select('id')
        .eq('email', email)
        .single()

      if (error) {
        return false
      }

      return !!data
    } catch (error) {
      console.error(`Error in existsByEmail method for ${this.tableName}:`, error)
      return false
    }
  }

  /**
   * Get record by email
   */
  async getByEmail(email: string): Promise<any | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        console.error(`Error fetching ${this.tableName} by email:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in getByEmail method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Get paginated results
   */
  async getPaginated(
    page: number = 1, 
    limit: number = 10, 
    filters?: Record<string, any>
  ): Promise<{ data: any[]; total: number; page: number; limit: number } | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const offset = (page - 1) * limit

      let query = this.supabase
        .from(this.tableName as any)
        .select('*', { count: 'exact' })

      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      const { data, count, error } = await query
        .range(offset, offset + limit - 1)

      if (error) {
        console.error(`Error fetching paginated ${this.tableName}:`, error)
        return null
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error(`Error in getPaginated method for ${this.tableName}:`, error)
      return null
    }
  }

  /**
   * Execute a raw SQL query (use with caution)
   */
  async executeRawQuery(query: string): Promise<any[] | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data, error } = await this.supabase.rpc('execute_sql', { query })

      if (error) {
        console.error(`Error executing raw query:`, error)
        return null
      }

      return data
    } catch (error) {
      console.error(`Error in executeRawQuery method:`, error)
      return null
    }
  }
}
