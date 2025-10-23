import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/verify-otp', '/error'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check for Firebase token in cookies or headers
  const firebaseToken = request.cookies.get('firebase_token')?.value || 
                       request.headers.get('authorization')?.replace('Bearer ', '');
  
  // If no token found, redirect to login
  if (!firebaseToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // For API routes, let them handle their own auth validation
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // For protected pages, check if user is authenticated
  try {
    // Import Firebase Admin SDK for token verification
    const { adminAuth } = await import('@/lib/shared/core/admin-config');
    
    // Check if adminAuth is properly initialized
    if (!adminAuth || typeof adminAuth.verifyIdToken !== 'function') {
      console.warn('Firebase Admin SDK not properly initialized, allowing access for development');
      return NextResponse.next();
    }
    
    // Verify the Firebase token
    const decodedToken = await adminAuth.verifyIdToken(firebaseToken);
    
    // Token is valid, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    // Token is invalid, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
