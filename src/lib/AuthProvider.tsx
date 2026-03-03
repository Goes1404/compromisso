'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/app/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  name: string;
  email: string;
  profile_type: string;
  role?: string;
  status?: string;
  [key: string]: any;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (!initialSession) {
          setLoading(false);
        }
      } catch (e) {
        console.error("Erro ao obter sessão inicial:", e);
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        router.replace('/login');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          if (data.status === 'suspended') {
            setProfile(data as Profile);
            router.replace('/suspended');
            return;
          }
          setProfile(data as Profile);
        } else {
          setProfile({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            profile_type: user.user_metadata?.role || 'student',
            role: user.user_metadata?.role || 'student',
            status: 'active'
          });
        }
      } catch (error) {
        console.error('Erro ao buscar perfil do Compromisso:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();

      // SINCRONIZAÇÃO EM TEMPO REAL: Se o adm mudar o polo do aluno, o portal dele atualiza na hora
      const profileChannel = supabase
        .channel(`profile_sync_${user.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${user.id}` 
        }, (payload) => {
          console.log("[AUTH SYNC] Perfil atualizado pela gestão:", payload.new);
          setProfile(payload.new as Profile);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
      };
    }
  }, [user, router]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    router.replace('/login');
  };

  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signOut
  }), [user, session, profile, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);