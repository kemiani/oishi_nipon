// src/middleware.ts - Middleware para proteger rutas admin
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si intenta acceder a /admin sin estar autenticado
  if (req.nextUrl.pathname.startsWith('/admin') && 
      !req.nextUrl.pathname.startsWith('/admin/login') &&
      !user) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // Si está autenticado e intenta acceder a login, redirigir a admin
  if (req.nextUrl.pathname === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};