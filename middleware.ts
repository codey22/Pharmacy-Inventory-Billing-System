import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

// 1. Specify public routes
const publicRoutes = ['/sign-in', '/api/auth/login'];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;

  // Skip middleware for static files, Next.js internals, and common assets
  // This prevents infinite loops on static assets or dev server files (like /@vite/client)
  if (
    path.startsWith('/_next') || 
    path.startsWith('/static') || 
    path.includes('.') || // Files with extensions (css, js, ico, etc.)
    path.startsWith('/@vite') // Turbopack/Vite HMR
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = (await cookies()).get('session')?.value;
  let session = null;
  if (cookie) {
      try {
        session = await decrypt(cookie);
      } catch (e) {
        // Invalid session
      }
  }

  // 4. Redirect to /sign-in if the user is NOT authenticated and the route is NOT public
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl));
  }

  // 5. Redirect to / (Dashboard) if the user IS authenticated and tries to access /sign-in
  if (
    path === '/sign-in' &&
    session
  ) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
