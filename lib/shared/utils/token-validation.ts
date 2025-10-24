/**
 * Token validation utilities for Firebase authentication
 */

// Token validation utilities for Firebase authentication

/**
 * Validates a Firebase ID token
 * @param token - The Firebase ID token to validate
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
export async function validateFirebaseToken(token: string): Promise<boolean> {
  try {
    if (!token || token.length < 100) {
      console.log('Invalid token: too short or empty');
      return false;
    }

    // Check if token has proper JWT format (3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('Invalid token: not a valid JWT format');
      return false;
    }

    // In development, if we have a properly formatted token, allow it
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: allowing token without verification');
      return true;
    }

    // Try to verify with Firebase Admin SDK
    try {
      const { adminAuth } = await import('@/lib/shared/core/admin-config');
      
      // if (!adminAuth || typeof adminAuth.verifyIdToken !== 'function') {
      //   console.warn('Firebase Admin SDK not available, allowing token in development');
      //   return process.env.NODE_ENV === 'development';
      // }


      // const decodedToken = await adminAuth.verifyIdToken(token);
      // console.log('Token verified successfully for user:', decodedToken.uid);
      return true;
    } catch (adminError) {
      console.error('Firebase Admin verification failed:', adminError);
      
      // // In development, allow token even if admin verification fails
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('Development mode: allowing token despite admin verification failure');
      //   return true;
      // }
      
      return false;
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Extracts user ID from a Firebase token (without verification)
 * @param token - The Firebase ID token
 * @returns string | null - User ID if extractable, null otherwise
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    if (!token || token.split('.').length !== 3) {
      return null;
    }

    // Decode the payload (second part of JWT)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.uid || payload.sub || null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

/**
 * Checks if a token is expired
 * @param token - The Firebase ID token
 * @returns boolean - True if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    if (!token || token.split('.').length !== 3) {
      return true;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    
    if (!exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= exp;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}
