import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/* ⬇️ 1.  async + await cookies() */
async function supabaseServer() {
  const store = await cookies();           // <-- ya NO es Promise

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          store.getAll().map(({ name, value }) => ({ name, value })), // tipado OK
      },
    }
  );
}

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json();

  /* ⬇️ 2.  espera la función */
  const supabase = await supabaseServer();

  // --- logout ---
  if (!access_token || !refresh_token) {
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  }

  // --- login ---
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
