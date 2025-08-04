// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth(requireAdmin = false) {
  const [user,    setUser]    = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      let u = data.session?.user ?? null;

      // ✅ si el caller exige admin, valida el perfil
      if (requireAdmin && u) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', u.id)
          .single();
        if (profile?.role !== 'admin') u = null;
      }

      setUser(u);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) =>
      setUser(session?.user ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, [requireAdmin]);   // <- dependency

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signOut };
}
