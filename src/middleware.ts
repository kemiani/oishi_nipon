// src/middleware.ts -------------------------------------------------------
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function supabaseFromMiddleware(req: NextRequest, res: NextResponse) {
  const store = req.cookies;                       // RequestCookies

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          store.getAll().map(({ name, value }) => ({ name, value })),

        setAll: (all) =>
          all.forEach(({ name, value, options }) =>
            res.cookies.set({ name, value, ...options })
          ),
      },
    },
  );
}

export async function middleware(req: NextRequest) {
  const res       = NextResponse.next();
  const supabase  = supabaseFromMiddleware(req, res);

  const { data: { user } } = await supabase.auth.getUser();

  if (req.nextUrl.pathname.startsWith('/admin') &&
      !req.nextUrl.pathname.startsWith('/admin/login') &&
      !user) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  if (req.nextUrl.pathname === '/admin/login' && user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }
  return res;
}

export const config = { matcher: ['/admin/:path*'] };
