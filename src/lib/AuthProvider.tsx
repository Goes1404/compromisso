
'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'teacher' | 'student';

type Profile = {
  id: string;
  name: string;
  email: string;
  profile_type: string;
  status?: string;
  [key: string]: any;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  userRole: 'student',
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Papel normalizado industrial
  const userRole = useMemo((): UserRole => {
    const rawType = (profile?.profile_type || '').toLowerCase().trim();
    if (['admin', 'gestor', 'coordenador'].includes(rawType)) return 'admin';
    if (['teacher', 'mentor', 'professor'].includes(rawType)) return 'teacher';
    return 'student';
  }, [profile]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Verificar se existe uma sessão simulada (Mock)
        const mockData = localStorage.getItem('compromisso_mock_session');
        if (mockData) {
          const parsed = JSON.parse(mockData);
          setUser(parsed.user);
          setProfile(parsed.profile);
          setLoading(false);
          return;
        }

        // 2. Tentar sessão real do Supabase
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (e) {
        console.warn("Auth init error (expected if keys missing):", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!localStorage.getItem('compromisso_mock_session')) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('compromisso_mock_session');
        setProfile(null);
        router.replace('/');
      }
    });

    return () => authListener?.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || localStorage.getItem('compromisso_mock_session')) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          if (data.status === 'suspended') {
            router.replace('/suspended');
          }
          setProfile(data as Profile);
        }
      } catch (error) {
        console.error('Erro ao buscar perfil real:', error);
      }
    };

    if (user) fetchProfile();
  }, [user, router]);

  const signOut = async () => {
    setLoading(true);
    localStorage.removeItem('compromisso_mock_session');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    router.replace('/');
  };

  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    userRole,
    loading,
    signOut,
  }), [user, session, profile, userRole, loading]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
