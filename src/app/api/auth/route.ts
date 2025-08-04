import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

async function supabaseServer() {
  // cookies() en Next 14 es Promise
  const store = await cookies();               // RequestCookies (solo read)
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /** Versión 0.6.x SOLO necesita `getAll` */
        getAll: () => store.getAll().map(c => ({ name: c.name, value: c.value })),
      },
    },
  );
}

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json();
  const supabase = await supabaseServer();

  // Logout → limpiar cookie vía signOut
  if (!access_token || !refresh_token) {
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  }

  // Login → setSession escribe cookie vía Supabase
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
