// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(requireAdmin: boolean = false): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          if (requireAdmin) {
            router.push('/admin/login');
          }
          setLoading(false);
          return;
        }

        setUser(user);

        // Verificar rol de admin si es necesario
        if (requireAdmin) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile?.role === 'admin') {
            setIsAdmin(true);
          } else {
            router.push('/admin/login');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (requireAdmin) {
          router.push('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        if (requireAdmin) {
          router.refresh();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        if (requireAdmin) {
          router.push('/admin/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, requireAdmin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return { user, loading, isAdmin, signOut };
}