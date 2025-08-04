// src/app/api/auth/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CookieOptions, createServerClient } from '@supabase/ssr';

type KV = { name: string; value: string; options?: CookieOptions };

async function supabaseServer(res: NextResponse) {
  /* 1️⃣ espera la promesa */
  const store = await cookies();          // RequestCookies

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /* 2️⃣ leer */
        getAll: () =>
          store.getAll().map(({ name, value }) => ({ name, value })),

        /* 3️⃣ escribir */
        setAll: (all: KV[]) =>
          all.forEach(({ name, value, options }) =>
            res.cookies.set({ name, value, ...options })
          ),
      },
    }
  );
}

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json();

  /* respuesta base en la que se añaden las Set-Cookie */
  const res = NextResponse.json({ ok: true });
  const supabase = await supabaseServer(res);

  // ─ logout ─
  if (!access_token || !refresh_token) {
    await supabase.auth.signOut();      // borra las cookies
    return res;
  }

  // ─ login ─
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return res;                           // cookies ya adjuntadas
}
