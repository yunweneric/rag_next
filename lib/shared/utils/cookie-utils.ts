/**
 * Utility functions for setting cookies that work with Next.js middleware
 */

export function setAuthCookie(token: string) {
  // Set cookie with proper attributes for middleware
  const cookieValue = `firebase_token=${token}; path=/; max-age=86400; samesite=strict`
  
  // Set the cookie
  document.cookie = cookieValue
  
  // Also try setting it with different attributes for better compatibility
  document.cookie = `firebase_token=${token}; path=/; max-age=86400`
  
  // Set a flag to indicate auth is complete
  localStorage.setItem('auth_complete', 'true')
  localStorage.setItem('firebase_token', token)
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Cookie set:', {
      token: token.substring(0, 20) + '...',
      cookieValue,
      allCookies: document.cookie
    })
  }
}

export function clearAuthCookie() {
  // Clear the cookie
  document.cookie = 'firebase_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = 'firebase_token=; path=/; max-age=0'
  
  // Clear localStorage
  localStorage.removeItem('firebase_token')
  localStorage.removeItem('auth_complete')
}
