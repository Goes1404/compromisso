
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Loader2,
  Signal,
  Sparkles,
  ExternalLink,
  Users,
  MonitorPlay,
  CalendarClock
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/app/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * Portal de Acesso à Mentoria - Visão do Aluno (Educori 360)
 * Atualizado para Next.js 15.
 */
export default function StudentLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: liveId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [live, setLive] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!liveId || !user) return;

    async function loadLiveData() {
      try {
        const { data, error } = await supabase
          .from('lives')
          .select(`*`)
          .eq('id', liveId)
          .single();

        if (error) throw error;
        setLive(data);

      } catch (error: any) {
        console.error("Erro ao carregar live:", error);
        toast({ title: "Aula não encontrada", variant: "destructive" });
        router.push('/dashboard/live');
      } finally {
        setLoading(false);
      }
    }

    loadLiveData();

    const channel = supabase
      .channel(`live_view_${liveId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'lives',
        filter: `id=eq.${liveId}`
      }, (payload) => {
        setLive(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveId, user, router, toast]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="animate-spin h-12 w-12 text-accent" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-primary">Sintonizando Satélite...</p>
    </div>
  );

  const isLiveNow = live?.status === 'live';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4 animate-in fade-in duration-700 overflow-hidden">
      {/* Header do Portal */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-white/20 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0 hover:bg-primary/5 transition-colors">
            <ChevronLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm md:text-lg font-black text-primary italic leading-none truncate">{live?.title}</h1>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">
              Sala de Mentoria • {live?.teacher_name || 'Mentor da Rede'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className={`${isLiveNow ? 'bg-red-600 animate-pulse' : 'bg-slate-400'} text-white border-none px-3 h-8 font-black text-[10px] flex items-center gap-2`}>
            {isLiveNow ? (
              <><Signal className="h-3.5 w-3.5" /> ACONTECENDO AGORA</>
            ) : (
              <><CalendarClock className="h-3.5 w-3.5" /> SALA AGENDADA</>
            )}
          </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden space-y-4">
        {/* Portal de Transmissão */}
        <Card className="flex-1 h-[65%] bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border-none relative flex items-center justify-center group">
          <div className="w-full h-full relative flex flex-col items-center justify-center p-8 text-center gap-8 bg-gradient-to-br from-slate-900 via-black to-slate-900">
             <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isLiveNow ? 'bg-red-600 animate-ping' : 'bg-slate-600'}`} />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {isLiveNow ? 'Transmissão em Curso' : 'Aguardando o Mentor'}
                </span>
             </div>

             <div className={`h-32 w-32 md:h-56 md:w-56 rounded-full bg-accent/5 border-4 ${isLiveNow ? 'border-accent/40 shadow-[0_0_80px_rgba(245,158,11,0.2)]' : 'border-white/5'} flex items-center justify-center relative transition-all duration-700`}>
                <MonitorPlay className={`h-16 w-16 md:h-28 md:w-28 ${isLiveNow ? 'text-accent' : 'text-white/10'} transition-colors`} />
                {isLiveNow && (
                  <div className="absolute -bottom-2 right-6 h-10 w-10 bg-green-500 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-xl">
                     <Signal className="h-5 w-5 text-white animate-pulse" />
                  </div>
                )}
             </div>
             
             <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <h3 className="text-xl md:text-4xl font-black text-white italic leading-none uppercase tracking-tighter">
                    Portal de Mentoria
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400 font-medium italic leading-relaxed">
                    {live?.meet_link 
                      ? "O mentor já disponibilizou o link! Clique abaixo para ingressar no ambiente de aula."
                      : "Esta aula está agendada. O link de acesso será habilitado assim que o mentor cadastrar a sala."}
                  </p>
                </div>
                
                {live?.meet_link ? (
                  <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-500">
                    <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-black h-16 md:h-20 px-12 rounded-2xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] transition-all hover:scale-105 active:scale-95 group relative overflow-hidden border-none">
                      <a href={live.meet_link} target="_blank" rel="noopener noreferrer">
                        <span className="relative z-10 flex items-center gap-4 text-sm md:text-xl uppercase tracking-tighter">
                          ACESSAR SALA DO GOOGLE MEET
                          <ExternalLink className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </a>
                    </Button>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Ambiente Seguro Criptografado</p>
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className="text-xs font-bold text-slate-500 italic">
                      O mentor ainda não disponibilizou o link da sala. Atualize a página em instantes!
                    </p>
                  </div>
                )}
             </div>
          </div>
        </Card>
        
        <Card className="bg-white rounded-[2.5rem] shadow-xl p-8 border-none shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Sparkles className="h-20 w-20 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em]">Pauta da Mentoria</h2>
          </div>
          <p className="text-sm font-medium italic text-primary/80 leading-relaxed max-w-4xl">
            {live?.description || "Esta sessão de apoio pedagógico é focada na resolução de dúvidas e aprofundamento técnico. Entre na sala do Meet para participar."}
          </p>
        </Card>
      </div>
    </div>
  );
}
