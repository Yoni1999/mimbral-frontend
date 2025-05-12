import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // 🔍 Log para verificar si el token llega correctamente
  console.log("🔍 TOKEN EN MIDDLEWARE:", token);

  if (!token) {
    // Redirigir al login si no hay token
    return NextResponse.redirect(new URL('/authentication/login', request.url));
  }

  return NextResponse.next();
}

// ✅ Rutas protegidas (asegúrate que coincidan con tus vistas reales)
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
