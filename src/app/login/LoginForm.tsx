
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, AlertCircle, BookOpen } from "lucide-react";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setLoading(false);
        setAuthError(error.message);
        return;
      }

      if (data.user) {
        setIsRedirecting(true);
        // O redirecionamento agora é baseado no perfil real buscado no banco
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_type')
          .eq('id', data.user.id)
          .single();

        const type = (profile?.profile_type || '').toLowerCase();
        
        let path = "/dashboard/home";
        if (['admin', 'gestor'].includes(type)) path = "/dashboard/admin/home";
        else if (['teacher', 'mentor', 'professor'].includes(type)) path = "/dashboard/teacher/home";
        
        router.push(path);
      }
    } catch (err: any) {
      setLoading(false);
      setAuthError("Falha na conexão com o servidor de autenticação.");
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10 relative">
      {isRedirecting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary text-white">
          <div className="h-20 w-20 rounded-3xl bg-accent flex items-center justify-center animate-bounce mb-4">
            <BookOpen className="h-10 w-10" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Sincronizando Sessão...</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 text-center">
        <Link href="/" className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl rotate-3 hover:rotate-0 transition-all border border-white/10">
          <Shield className="h-12 w-12" />
        </Link>
        <h1 className="text-4xl font-black text-white italic">Compro<span className="text-accent">misso</span></h1>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white/95 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-dashed p-8">
          <CardTitle className="text-xl font-black text-primary italic text-center">Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {authError && (
            <Alert variant="destructive" className="bg-red-50 border-red-100">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">E-mail Acadêmico</Label>
              <Input 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="h-12 rounded-xl bg-muted/30 border-none font-bold" 
                required 
                disabled={loading} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Senha de Acesso</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="h-12 rounded-xl bg-muted/30 border-none font-bold" 
                required 
                disabled={loading} 
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary h-14 rounded-xl font-black shadow-xl mt-4">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar no Portal"}
            </Button>
          </form>
          
          <div className="pt-6 border-t border-dashed text-center">
            <p className="text-[10px] font-medium text-muted-foreground italic">
              Não tem uma conta? <Link href="/register" className="text-accent font-black hover:underline">Cadastre-se</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
