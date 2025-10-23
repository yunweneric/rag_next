import { adminAuth } from '@/lib/shared/core/admin-config';
import { NextRequest } from 'next/server';

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
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return { 
      user: { id: decodedToken.uid, email: decodedToken.email! }, 
      error: null, 
      accessToken: token 
    };
  } catch (error) {
    console.error('Firebase token validation error:', error);
    return { user: null, error: 'Token validation failed', accessToken: undefined };
  }
}
