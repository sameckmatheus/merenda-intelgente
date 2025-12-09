import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute =
    pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isLoginRoute = pathname.startsWith('/admin/login');

  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  const hasAuthCookie = !!cookie?.value;

  if (isAdminRoute && !hasAuthCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && hasAuthCookie) {
    const adminUrl = new URL(
      request.nextUrl.searchParams.get('next') || '/admin',
      request.url
    );
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Execute the middleware on admin routes
  matcher: ['/admin/:path*', '/admin/login'],
};
