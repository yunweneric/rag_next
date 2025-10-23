import { NextRequest } from 'next/server';
import { extractUserIdFromToken, isTokenExpired } from '@/lib/shared/utils/token-validation';

export interface AuthResult {
  user: { id: string; email: string } | null;
  error: string | null;
  accessToken: string | undefined;
}

export async function validateFirebaseToken(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization header', accessToken: undefined };
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      return { user: null, error: 'Token expired', accessToken: undefined };
    }
    
    // Extract user ID from token
    const userId = extractUserIdFromToken(token);
    if (!userId) {
      return { user: null, error: 'Invalid token format', accessToken: undefined };
    }
    
   
    
    // Try to verify with Firebase Admin SDK in production
    try {
      const { adminAuth } = await import('@/lib/shared/core/admin-config');
      
      if (adminAuth && typeof adminAuth.verifyIdToken === 'function') {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return { 
          user: { id: decodedToken.uid, email: decodedToken.email! }, 
          error: null, 
          accessToken: token 
        };
      }
    } catch (adminError) {
      console.error('Firebase Admin SDK error:', adminError);
    }
    
    return { user: null, error: 'Firebase token validation failed', accessToken: undefined };
  } catch (error) {
    console.error('Firebase token validation error:', error);
    return { user: null, error: 'Token validation failed', accessToken: undefined };
  }
}
