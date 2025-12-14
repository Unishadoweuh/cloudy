import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token');
    // Protect /dashboard and root (if redirects to dashboard)
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

    if (isDashboard && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect /login to /dashboard if already authenticated
    if (request.nextUrl.pathname === '/login' && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
