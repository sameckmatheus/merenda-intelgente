
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from './src/lib/constants';

// Note: We import from src/lib/constants using relative path if possible, 
// but middleware runs in edge runtime where imports might be tricky.
// If import fails, we'll hardcode the cookie name 'menu-planner-auth'.

export function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('menu-planner-auth'); // using hardcoded name to be safe
    const { pathname } = request.nextUrl;

    // Protect Admin Routes
    if (pathname.startsWith('/admin')) {
        // Exclude login page itself if it's under admin (e.g. /admin/login)
        if (pathname === '/admin/login') {
            return NextResponse.next();
        }

        if (!sessionCookie) {
            const loginUrl = new URL('/login', request.url); // Or /admin/login if it exists
            // loginUrl.searchParams.set('next', pathname); // Optional: redirect back
            return NextResponse.redirect(loginUrl);
        }
    }

    // Protect School Routes
    if (pathname.startsWith('/escola')) {
        if (pathname === '/escola/login') { // if exists
            return NextResponse.next();
        }

        if (!sessionCookie) {
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/escola/:path*',
    ],
};
