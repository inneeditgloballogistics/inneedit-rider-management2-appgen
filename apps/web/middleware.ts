import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const parts = hostname.split('.');
  const subdomain = parts.length > 2 ? parts[0] : null;

  // Handle subdomain routing
  if (subdomain === 'hub') {
    // Hub Manager login
    if (!request.nextUrl.pathname.startsWith('/hub-manager-login')) {
      // Redirect to hub manager login page
      return NextResponse.rewrite(new URL('/hub-manager-login', request.url));
    }
  } else if (subdomain === 'tech') {
    // Technician login
    if (!request.nextUrl.pathname.startsWith('/technician-login')) {
      // Redirect to technician login page
      return NextResponse.rewrite(new URL('/technician-login', request.url));
    }
  } else if (subdomain === 'rider') {
    // Rider login
    if (!request.nextUrl.pathname.startsWith('/rider-login')) {
      // Redirect to rider login page
      return NextResponse.rewrite(new URL('/rider-login', request.url));
    }
  }

  // No subdomain - proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
