import { createClient } from '@/lib/shared/utils/supabase/client'
import type { Database } from '@/lib/shared/types/database'

export type TableName = keyof Database['public']['Tables']

export interface BaseSupabaseServiceConfig {
  tableName: TableName
}

export class BaseSupabaseService<T extends TableName> {
  protected tableName: T
  protected supabase = createClient()

  constructor(config: BaseSupabaseServiceConfig) {
    this.tableName = config.tableName as T
  }

  // Create a single record
  async create(data: any): Promise<any | null> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error(`Error creating ${this.tableName}:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in create method for ${this.tableName}:`, error)
      return null
    }
  }

  // Create multiple records
  async createMany(data: any[]): Promise<any[] | null> {
    try {
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

  // Get a single record by ID
  async getById(id: string): Promise<any | null> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error(`Error fetching ${this.tableName} by ID:`, error)
        return null
      }

      return result
    } catch (error) {
      console.error(`Error in getById method for ${this.tableName}:`, error)
      return null
    }
  }

  // Get all records
  async getAll(): Promise<any[] | null> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName as any)
        .select('*')

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

  // Get records with custom query
  async getByQuery(query: (query: any) => any): Promise<any[] | null> {
    try {
      const { data: result, error } = await query(this.supabase.from(this.tableName as any).select('*'))

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

  // Update a record by ID
  async updateById(id: string, data: any): Promise<any | null> {
    try {
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

  // Update multiple records
  async updateMany(ids: string[], data: any): Promise<any[] | null> {
    try {
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

  // Delete a record by ID
  async deleteById(id: string): Promise<boolean> {
    try {
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

  // Delete multiple records
  async deleteMany(ids: string[]): Promise<boolean> {
    try {
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

  // Upsert a record (insert or update)
  async upsert(data: any, conflictColumns: string[] = ['id']): Promise<any | null> {
    try {
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

  // Count records
  async count(): Promise<number> {
    try {
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

  // Check if record exists
  async exists(id: string): Promise<boolean> {
    try {
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
}