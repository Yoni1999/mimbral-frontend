import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  console.log("🔍 TOKEN EN MIDDLEWARE:", token);

  if (!token) {
    return NextResponse.redirect(new URL('/authentication/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/', // dashboard principal
    '/admin/:path*',
    '/utilities/:path*',
    '/informes/:path*',
    '/sugerencias/:path*',
    '/metas/:path*',
  ],
};
