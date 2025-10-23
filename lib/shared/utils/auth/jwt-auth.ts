// This file is deprecated - use firebase-auth.ts instead
// Keeping for backward compatibility during migration
export interface AuthResult {
  user: { id: string; email: string } | null
  error: string | null
  accessToken: string | undefined
}

// This function is deprecated - use validateFirebaseToken from firebase-auth.ts
export async function validateJWTToken(): Promise<AuthResult> {
  throw new Error('validateJWTToken is deprecated. Use validateFirebaseToken from firebase-auth.ts instead.')
}