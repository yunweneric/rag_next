import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateFirebaseToken } from '@/lib/shared/utils/token-validation';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow all API routes to pass through without authentication
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
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
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware check:', {
      pathname,
      hasToken: !!firebaseToken,
      tokenLength: firebaseToken?.length || 0,
      cookies: request.cookies.getAll().map(c => c.name)
    });
  }
  
  // If no token found, redirect to login
  if (!firebaseToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // For protected pages, check if user is authenticated
  try {
    // Use the token validation utility
    const isValidToken = await validateFirebaseToken(firebaseToken);
    
    if (isValidToken) {
      console.log('Token validation successful, allowing access');
      return NextResponse.next();
    } else {
      console.log('Token validation failed, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error('Token validation error:', error);
    
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