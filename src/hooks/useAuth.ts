// src/hooks/useAuth.ts  ── versión mínima, adáptala a tu gusto
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth(requireAdmin = false) {
  const [user,    setUser]    = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // subscripción a cambios de auth
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signOut };
}
