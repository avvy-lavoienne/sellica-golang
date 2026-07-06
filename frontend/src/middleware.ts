import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected route prefixes
const PROTECTED_ROUTES = [
  '/dashboard',
  '/admin',
  '/silpana-admin',
  '/profile',
  '/data-rekam',
  '/aktivitas-user',
  '/monitoring',
];

// Routes that should be accessible without auth
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/privacy',
  '/terms',
  '/cookies',
  '/error',
  '/maintenance',
  '/silpana',
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - restrict sensitive APIs
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Remove X-Powered-By header
  response.headers.delete('X-Powered-By');

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response with security headers
  const response = NextResponse.next();
  addSecurityHeaders(response);

  // For protected routes: check auth cookies
  // NOTE: Current auth uses localStorage (client-side). Middleware checks cookies
  // as first line of defense. Client-side auth check in layout.tsx is the fallback.
  // For full server-side protection, migrate auth to httpOnly cookies.
  if (isProtectedRoute(pathname)) {
    // Check for Supabase auth cookie (sb-<project>-auth-token)
    const hasSupabaseCookie = request.cookies
      .getAll()
      .some(
        (cookie) =>
          cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
      );

    // Check for custom auth cookie (selly_auth_token)
    const hasCustomAuthCookie = request.cookies.has('selly_auth_token');

    // Check for Go backend auth token cookie
    const hasGoAuthToken = request.cookies.has('go_auth_token');

    const isAuthenticated =
      hasSupabaseCookie || hasCustomAuthCookie || hasGoAuthToken;

    if (!isAuthenticated) {
      // No auth cookie found — but auth may be in localStorage (client-side).
      // Add a header so client-side code can detect middleware couldn't verify auth.
      // The client-side layout.tsx auth check remains the primary guard.
      response.headers.set('X-Auth-Verified', 'false');
    } else {
      response.headers.set('X-Auth-Verified', 'true');
    }
  }

  return response;
}

export const config = {
  // Match all routes except static files, api routes, and _next
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
