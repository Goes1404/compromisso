'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  userRole: 'student',
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const userRole = useMemo((): UserRole => {
    const rawType = (profile?.profile_type || '').toLowerCase().trim();
    if (['admin', 'gestor', 'coordenador', 'coordenacao'].includes(rawType)) return 'admin';
    if (['teacher', 'mentor', 'professor', 'instrutor', 'docente'].includes(rawType)) return 'teacher';
    return 'student';
  }, [profile]);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        if (data.status === 'suspended') {
          router.replace('/suspended');
          return null;
        }
        return data as Profile;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }, [router]);

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      if (p) setProfile(p);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // 1. Verificar Mock Session
        const mockData = typeof window !== 'undefined' ? localStorage.getItem('compromisso_mock_session') : null;
        if (mockData) {
          const parsed = JSON.parse(mockData);
          setUser(parsed.user);
          setProfile(parsed.profile);
          setLoading(false);
          return;
        }

        // 2. Verificar Sessão Real
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          const p = await fetchProfile(initialSession.user.id);
          if (p) setProfile(p);
        }
      } catch (e) {
        console.warn("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (typeof window !== 'undefined' && localStorage.getItem('compromisso_mock_session')) return;

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        const p = await fetchProfile(currentSession.user.id);
        if (p) setProfile(p);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      if (event === 'SIGNED_OUT') {
        router.replace('/');
      }
    });

    return () => authListener?.subscription.unsubscribe();
  }, [fetchProfile, router]);

  const signOut = async () => {
    setLoading(true);
    if (typeof window !== 'undefined') localStorage.removeItem('compromisso_mock_session');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    window.location.href = "/";
  };

  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    userRole,
    loading,
    signOut,
    refreshProfile,
  }), [user, session, profile, userRole, loading]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);