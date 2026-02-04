import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isSchoolRoute = pathname.startsWith('/escola');

  const isLoginRoute = pathname.startsWith('/admin/login') || pathname.startsWith('/login');

  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  const hasAuthCookie = !!cookie?.value;

  // Admin Protection
  if (isAdminRoute && !hasAuthCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // School Protection
  if (isSchoolRoute && !hasAuthCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect if already logged in (Simple logic, could be improved by checking *what* type of user)
  if (isLoginRoute && hasAuthCookie) {
    // We cannot easily determine if it's admin or school without verifying token (which is expensive in middleware)
    // So we just let them stay or redirect to a default.
    // Ideally:
    // If accessing /admin/login -> redirect to /admin
    // If accessing /login -> redirect to /escola

    if (pathname.startsWith('/admin/login')) {
      const next = request.nextUrl.searchParams.get('next') || '/admin';
      return NextResponse.redirect(new URL(next, request.url));
    }
    if (pathname === '/login') {
      const next = request.nextUrl.searchParams.get('next') || '/escola';
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Execute the middleware on admin and school routes, and login pages
  matcher: ['/admin/:path*', '/escola/:path*', '/login', '/admin/login'],
};
