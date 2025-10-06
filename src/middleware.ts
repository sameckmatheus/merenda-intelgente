import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {AUTH_COOKIE_NAME} from './lib/constants';

async function verifyAuth(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!cookie?.value) {
    return {isAuthenticated: false};
  }

  try {
    // The URL for the verification must be an absolute URL.
    const url = new URL('/api/auth/verify', request.url);
    const response = await fetch(url, {
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=${cookie.value}`,
      },
    });
    if (response.ok) {
      const user = await response.json();
      return {isAuthenticated: true, user};
    }
    return {isAuthenticated: false};
  } catch (e) {
    console.error('Auth verification failed:', e);
    return {isAuthenticated: false};
  }
}

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  const isAdminRoute =
    pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isLoginRoute = pathname.startsWith('/admin/login');

  const {isAuthenticated} = await verifyAuth(request);

  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && isAuthenticated) {
    const adminUrl = new URL(
      request.nextUrl.searchParams.get('next') || '/admin',
      request.url
    );
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Execute the middleware on admin routes and the API verification route
  matcher: ['/admin/:path*', '/admin/login', '/api/auth/verify'],
};
