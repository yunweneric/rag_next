import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
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
    
    // Create Supabase client to verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: 'Invalid token' }
    }
    
    return { user, error: null }
  } catch (error) {
    return { user: null, error: 'Token validation failed' }
  }
}
