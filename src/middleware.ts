import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from './lib/constants';

// Note: In middleware we cannot easily verify JWT and check user type without making it very slow
// So we rely on client-side protection and API route protection
// This middleware provides basic auth checks only

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isSchoolRoute = pathname.startsWith('/escola');
  const isLoginRoute = pathname.startsWith('/admin/login') || pathname.startsWith('/login');

  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  const hasAuthCookie = !!cookie?.value;

  // Admin Protection - require auth cookie
  if (isAdminRoute && !hasAuthCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // School Protection - require auth cookie
  if (isSchoolRoute && !hasAuthCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect if already logged in
  if (isLoginRoute && hasAuthCookie) {
    if (pathname.startsWith('/admin/login')) {
      const next = request.nextUrl.searchParams.get('next') || '/admin';
      return NextResponse.redirect(new URL(next, request.url));
    }
    if (pathname === '/login') {
      const next = request.nextUrl.searchParams.get('next') || '/escola';
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Note: Cross-access prevention (school trying to access /admin or admin trying to access /escola)
  // is handled client-side in each page through Firebase auth checks
  // This is because verifying JWT in middleware is expensive and slow

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Execute the middleware on admin and school routes, login pages, and root
  matcher: ['/', '/admin/:path*', '/escola/:path*', '/login', '/admin/login'],
};
