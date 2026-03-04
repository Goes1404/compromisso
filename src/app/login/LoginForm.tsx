
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ChevronRight, Loader2, UserCircle, Users, GraduationCap, AlertCircle, BookOpen, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured, isUsingSecretKeyInBrowser } from "@/app/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password) return;
    
    // LOGICA DE BYPASS: Se for conta de demo, entra direto via mock
    if (email.includes('@compromisso.com.br')) {
      startMockSession(email);
      return;
    }

    if (!isSupabaseConfigured || isUsingSecretKeyInBrowser) {
      setAuthError("Erro de configuração no banco de dados. Por favor, utilize os botões de 'Acesso Rápido' abaixo para entrar.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoading(false);
        setAuthError(error.message || "E-mail ou senha incorretos.");
        return;
      }

      if (data.user) {
        setIsRedirecting(true);
        const { data: profile } = await supabase.from('profiles').select('profile_type').eq('id', data.user.id).single();
        const role = profile?.profile_type || 'student';
        const path = role === 'admin' ? "/dashboard/admin/home" : role === 'teacher' ? "/dashboard/teacher/home" : "/dashboard/home";
        router.push(path);
      }
    } catch (err) {
      setLoading(false);
      setAuthError("Falha na conexão com o servidor de autenticação.");
    }
  };

  const startMockSession = (emailAddr: string) => {
    setLoading(true);
    setIsRedirecting(true);
    
    // Determina o papel baseado no e-mail de demo
    const role = emailAddr.includes('gestor') ? 'admin' : emailAddr.includes('mentor') ? 'teacher' : 'student';
    const name = role === 'admin' ? 'Gestor Master' : role === 'teacher' ? 'Mentor Expert' : 'Aluno Pro';
    
    localStorage.setItem('compromisso_mock_session', JSON.stringify({
      id: `mock-${role}-${Date.now()}`,
      email: emailAddr,
      role,
      name
    }));

    toast({ 
      title: "Modo de Demonstração Ativado", 
      description: `Entrando como ${name}.` 
    });
    
    setTimeout(() => {
      const path = role === 'admin' ? "/dashboard/admin/home" : role === 'teacher' ? "/dashboard/teacher/home" : "/dashboard/home";
      router.push(path);
    }, 800);
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10 relative">
      {isRedirecting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary text-white animate-in fade-in duration-300">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-2xl mb-6 animate-bounce">
            <BookOpen className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">Compromisso</h2>
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Sincronizando Ambiente...</p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 text-center">
        <Link href="/" className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500 group border border-white/10">
          <Shield className="h-12 w-12 group-hover:scale-110 transition-transform" />
        </Link>
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-black tracking-tighter text-white drop-shadow-lg">
            Compro<span className="text-accent">misso</span>
          </h1>
          <p className="text-white/70 font-medium italic">Painel de Acesso</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden backdrop-blur-2xl bg-white/95 rounded-[2.5rem]">
        <CardHeader className="space-y-1 pb-6 pt-8 text-center bg-primary/5 border-b border-dashed">
          <CardTitle className="text-2xl font-black text-primary italic">Entrar</CardTitle>
          <CardDescription className="font-medium italic">Acesse seu ambiente de estudos ou gestão.</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pt-8 space-y-6">
          {authError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold italic">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-primary/60 ml-1 text-xs uppercase tracking-widest">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-white rounded-xl border-muted/20 italic" placeholder="seu@email.com" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Senha" className="font-bold text-primary/60 ml-1 text-xs uppercase tracking-widest">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-white rounded-xl border-muted/20" placeholder="••••••••" required disabled={loading} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black h-14 text-base shadow-xl rounded-2xl transition-all">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Entrar Agora <ChevronRight className="h-5 w-5 ml-1" /></>}
            </Button>
          </form>

          <div className="pt-6 space-y-4 border-t border-dashed">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/40">
              <Users className="h-3 w-3" /> Acesso Rápido (Demonstração)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => startMockSession('aluno@compromisso.com.br')} className="h-11 rounded-xl text-blue-700 font-black gap-1 text-[9px] justify-center px-2 border-blue-100 hover:bg-blue-50">
                <GraduationCap className="h-3 w-3" /> ALUNO
              </Button>
              <Button variant="outline" onClick={() => startMockSession('mentor@compromisso.com.br')} className="h-11 rounded-xl text-orange-700 font-black gap-1 text-[9px] justify-center px-2 border-orange-100 hover:bg-orange-50">
                <UserCircle className="h-3 w-3" /> MENTOR
              </Button>
              <Button variant="outline" onClick={() => startMockSession('gestor@compromisso.com.br')} className="h-11 rounded-xl text-red-700 font-black gap-1 text-[9px] justify-center px-2 border-red-100 hover:bg-red-50">
                <ShieldCheck className="h-3 w-3" /> GESTOR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
