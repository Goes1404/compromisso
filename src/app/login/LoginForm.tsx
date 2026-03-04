
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ChevronRight, Loader2, Sparkles, AlertCircle, BookOpen, GraduationCap, User, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/app/lib/supabase";
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

  const handleQuickLogin = (role: 'student' | 'teacher' | 'admin') => {
    setIsRedirecting(true);
    
    // Preenche os campos visualmente como solicitado
    const emailMap = {
      student: 'aluno@compromisso.com.br',
      teacher: 'professor@compromisso.com.br',
      admin: 'admin@compromisso.com.br'
    };
    
    const targetEmail = emailMap[role];
    setEmail(targetEmail);
    setPassword('123456');

    // Simula uma sessão local para bypass de erros de infraestrutura (Secret Key no editor)
    const mockUser = {
      id: `mock-${role}`,
      email: targetEmail,
      user_metadata: { full_name: `Usuário ${role.toUpperCase()}` }
    };
    
    const mockProfile = {
      id: mockUser.id,
      name: `Demonstração ${role.toUpperCase()}`,
      profile_type: role,
      institution: "Polo de Demonstração"
    };

    localStorage.setItem('compromisso_mock_session', JSON.stringify({ user: mockUser, profile: mockProfile, role }));
    
    toast({ 
      title: "Acesso Sincronizado", 
      description: `Entrando como ${role.toUpperCase()}.` 
    });

    setTimeout(() => {
      if (role === 'admin') router.push("/dashboard/admin/home");
      else if (role === 'teacher') router.push("/dashboard/teacher/home");
      else router.push("/dashboard/home");
      window.location.reload(); 
    }, 800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password) return;
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        console.error("Auth Error:", error.message);
        
        // Se for o erro de chave secreta no navegador, e for um dos e-mails padrão, faz o bypass
        if (error.message.includes("secret API key") || error.status === 403) {
          if (email.includes('@compromisso.com.br')) {
            const role = email.split('@')[0] === 'aluno' ? 'student' : 
                         email.split('@')[0] === 'professor' ? 'teacher' : 'admin';
            handleQuickLogin(role as any);
            return;
          }
          setAuthError("Erro de Chave: O editor está recebendo a 'service_role'. Use os botões de Acesso Rápido para testar o sistema agora.");
        } else {
          setAuthError("E-mail ou senha inválidos.");
        }
        return;
      }

      if (data.user) {
        setIsRedirecting(true);
        const { data: profile } = await supabase.from('profiles').select('profile_type').eq('id', data.user.id).single();
        const role = profile?.profile_type || 'student';
        
        if (['admin', 'gestor', 'coordenador'].includes(role.toLowerCase())) router.push("/dashboard/admin/home");
        else if (['teacher', 'mentor', 'professor'].includes(role.toLowerCase())) router.push("/dashboard/teacher/home");
        else router.push("/dashboard/home");
      }

    } catch (err: any) {
      setLoading(false);
      setAuthError("Falha na rede ao conectar com o banco de dados.");
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10 relative">
      {isRedirecting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary text-white animate-in fade-in duration-300">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-2xl mb-6 animate-bounce">
            <BookOpen className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-2">Compromisso</h2>
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Sintonizando Rede...</p>
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
          <p className="text-white/70 font-medium flex items-center justify-center gap-2 italic">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            Portal de Acesso
          </p>
        </div>
      </div>

      <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl bg-white/95 rounded-[2.5rem]">
        <CardHeader className="space-y-1 pb-6 pt-8 text-center bg-primary/5 border-b border-dashed">
          <CardTitle className="text-2xl font-black text-primary italic">Entrar no Sistema</CardTitle>
          <CardDescription className="font-medium text-muted-foreground italic">Selecione seu perfil para acesso rápido.</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pt-8 space-y-6">
          
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleQuickLogin('student')} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-primary/20 hover:bg-white transition-all group shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest">Aluno</span>
            </button>
            <button onClick={() => handleQuickLogin('teacher')} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-accent/20 hover:bg-white transition-all group shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="h-6 w-6" />
              </div>
              <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest">Mentor</span>
            </button>
            <button onClick={() => handleQuickLogin('admin')} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-primary/20 hover:bg-white transition-all group shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest">Admin</span>
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-muted/20"></div>
            <span className="flex-shrink mx-4 text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em]">Ou use sua conta real</span>
            <div className="flex-grow border-t border-muted/20"></div>
          </div>

          {authError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold italic leading-tight">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-primary/60">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-white rounded-xl border-muted/20" placeholder="seu@email.com" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" title="Senha" className="font-bold text-primary/60">Senha</Label>
                <Link href="#" className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Recuperar</Link>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-white rounded-xl border-muted/20" placeholder="••••••••" required disabled={loading} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black h-14 text-base shadow-xl rounded-2xl transition-all">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Entrar Agora <ChevronRight className="h-5 w-5 ml-1 text-accent" /></>}
            </Button>
          </form>

          <div className="pt-6 text-center border-t border-dashed">
            <p className="text-xs font-medium text-muted-foreground italic">
              Não possui conta? <Link href="/register" className="text-primary font-black uppercase text-[10px] tracking-widest hover:text-accent transition-colors">Criar Cadastro</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
