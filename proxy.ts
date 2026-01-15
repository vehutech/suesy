import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session tokens
  const sessionToken = request.cookies.get('session_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  
  // DEBUG: Log cookie values
  console.log('🔍 Middleware Debug:', {
    pathname,
    hasSessionToken: !!sessionToken,
    hasAdminToken: !!adminToken,
  });
  
  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin-panel');
  
  // Redirect root to appropriate page
  if (pathname === '/') {
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin-panel', request.url));
    }
    if (sessionToken) {
      return NextResponse.redirect(new URL('/feed', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // IMPORTANT: Prevent admins from accessing student routes
  if (pathname === '/login' && adminToken) {
    console.log('⚠️ Admin trying to access /login, redirecting to /admin-panel');
    return NextResponse.redirect(new URL('/admin-panel', request.url));
  }
  
  // Redirect logged-in admin from admin login to admin panel
  if (pathname === '/admin' && adminToken) {
    console.log('✅ Admin has token, redirecting to panel from /admin');
    return NextResponse.redirect(new URL('/admin-panel', request.url));
  }
  
  // Redirect logged-in students from login page to feed
  if (pathname === '/login' && sessionToken) {
    console.log('✅ Student has token, redirecting to feed');
    return NextResponse.redirect(new URL('/feed', request.url));
  }
  
  // Protect admin routes - require admin token
  if (isAdminRoute && !adminToken) {
    console.log('❌ No admin token, redirecting to /admin');
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  // Protect student dashboard routes - require session token
  const protectedRoutes = ['/feed', '/dashboard', '/messages'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute && !sessionToken) {
    console.log('❌ No session token, redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  console.log('✅ Allowing request to continue');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin',
    '/feed/:path*',
    '/dashboard/:path*',
    '/messages/:path*',
    '/admin-panel/:path*',
  ],
};