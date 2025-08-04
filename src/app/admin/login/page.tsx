'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

interface FormData {
  email: string;
  password: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');

  /* ───── Helpers ───── */
  const onChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((p) => ({ ...p, [field]: e.target.value }));

  /* ───── Submit ───── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Sign-in con Supabase JS (almacena en localStorage)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      if (!data.user) throw new Error('No se pudo obtener el usuario');

      // 2. Verificar rol admin
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      if (pErr) throw pErr;
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('No tienes permisos de administrador');
      }

      // 3. Puente → graba cookie HTTP-only para SSR
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token:  data.session?.access_token,
          refresh_token: data.session?.refresh_token,
        }),
      });

      // 4. Navega al dashboard
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  /* ───── UI ───── */
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="glass-card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          <span className="text-gradient-red">Oishi</span> Admin
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="label-premium">Email</label>
            <input
              type="email"
              required
              className="input-premium w-full"
              placeholder="admin@oishinipon.com"
              value={formData.email}
              onChange={onChange('email')}
            />
          </div>

          <div>
            <label className="label-premium">Contraseña</label>
            <input
              type="password"
              required
              className="input-premium w-full"
              placeholder="••••••••"
              value={formData.password}
              onChange={onChange('password')}
            />
          </div>

          {error && (
            <p className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm">
              {error}
            </p>
          )}

          <button
            className="btn-primary w-full justify-center disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <div className="spinner-mini mr-2" /> Iniciando…
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
