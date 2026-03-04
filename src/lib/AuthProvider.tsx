
'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured, isUsingSecretKeyInBrowser } from '@/app/lib/supabase';
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
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  isMock: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const router = useRouter();

  // 1. Inicialização de Auth (Simulado ou Real)
  useEffect(() => {
    const initAuth = async () => {
      // Prioridade absoluta: Tentar recuperar sessão simulada
      const savedMock = typeof window !== 'undefined' ? localStorage.getItem('compromisso_mock_session') : null;
      if (savedMock) {
        try {
          const mockData = JSON.parse(savedMock);
          setIsMock(true);
          setUser({ id: mockData.id, email: mockData.email } as User);
          setProfile({
            id: mockData.id,
            name: mockData.name,
            email: mockData.email,
            profile_type: mockData.role,
            role: mockData.role,
            status: 'active'
          });
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('compromisso_mock_session');
        }
      }

      // Se não houver configuração do Supabase, paramos o loading para permitir o login via mock
      if (!isSupabaseConfigured || isUsingSecretKeyInBrowser) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (!initialSession) {
          setLoading(false);
        }
      } catch (e) {
        console.warn("Falha ao sintonizar Supabase Auth:", e);
        setLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured && !isUsingSecretKeyInBrowser) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (!isMock) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setIsMock(false);
          localStorage.removeItem('compromisso_mock_session');
          setLoading(false);
          router.replace('/');
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, [router, isMock]);

  // 2. Busca de Perfil
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || isMock) return;

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
          // Fallback para perfil básico via metadados
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
        console.error('Erro ao buscar perfil real:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !isMock) {
      fetchProfile();

      if (isSupabaseConfigured && !isUsingSecretKeyInBrowser) {
        const profileChannel = supabase
          .channel(`profile_sync_${user.id}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${user.id}` 
          }, (payload) => {
            setProfile(payload.new as Profile);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(profileChannel);
        };
      }
    }
  }, [user, router, isMock]);

  const signOut = async () => {
    setLoading(true);
    try {
      if (!isMock && isSupabaseConfigured && !isUsingSecretKeyInBrowser) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      // Ignora erro no logout
    }
    localStorage.removeItem('compromisso_mock_session');
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsMock(false);
    setLoading(false);
    router.replace('/');
  };

  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signOut,
    isMock
  }), [user, session, profile, loading, isMock]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
