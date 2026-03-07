"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MonitorPlay, Clock, Loader2, ArrowRight, Signal, Calendar, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LiveClassesPage() {
  const [lives, setLives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLives() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lives')
          .select('*')
          .in('status', ['live', 'scheduled'])
          .gte('start_time', new Date(Date.now() - 3600000).toISOString())
          .order('start_time', { ascending: true });

        if (error) throw error;
        setLives(data || []);
      } catch (err) {
        console.error("Erro ao buscar lives:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLives();

    const channel = supabase
      .channel('live_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lives' }, () => {
        fetchLives();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sintonizando Estúdio...</p>
      </div>
    );
  }

  const liveNow = lives.filter(l => l.status === 'live');
  const upcoming = lives.filter(l => l.status === 'scheduled');

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20 px-2 md:px-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-5xl font-black text-primary italic leading-none uppercase tracking-tighter">Centro de Transmissões</h1>
          <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px] px-3 py-1 shadow-sm">SINAL ATIVO</Badge>
        </div>
        <p className="text-muted-foreground text-sm md:text-xl font-medium italic">Acompanhe sessões de mentoria e aulas práticas em tempo real.</p>
      </div>

      {liveNow.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-3 w-3 rounded-full bg-red-600 animate-ping shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
            <h2 className="text-lg md:text-2xl font-black text-red-600 uppercase tracking-[0.2em] italic">Transmissão em Curso</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {liveNow.map((live) => (
              <Card key={live.id} className="border-none shadow-2xl bg-slate-950 text-white rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden group border-l-[12px] border-red-600 relative transition-transform hover:-translate-y-1 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]" />
                <CardContent className="p-8 md:p-14 space-y-8 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                      <Badge className="bg-red-600 text-white border-none px-5 h-9 font-black flex items-center gap-2.5 animate-pulse text-[10px] md:text-[12px] rounded-full shadow-lg">
                        <Signal className="h-4 w-4" /> SINAL AO VIVO
                      </Badge>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 px-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                        Sala Auditada
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsável</p>
                      <p className="font-black italic text-accent text-lg md:text-2xl">{live.teacher_name || "Mentor da Rede"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl md:text-4xl font-black italic leading-[1.1] group-hover:text-accent transition-colors tracking-tight">{live.title}</h3>
                    <p className="text-sm md:text-lg text-slate-400 line-clamp-2 italic font-medium leading-relaxed opacity-80">{live.description || "Inicie agora sua participação nesta mentoria técnica."}</p>
                  </div>

                  <Button 
                    asChild 
                    className="w-full bg-white text-slate-950 hover:bg-accent hover:text-accent-foreground font-black h-16 md:h-20 rounded-2xl md:rounded-3xl shadow-2xl transition-all border-none group/btn text-lg md:text-xl"
                  >
                     <Link href={`/dashboard/live/${live.id}`} className="flex items-center justify-center gap-4">
                        ENTRAR NO ESTÚDIO
                        <ArrowRight className="h-6 w-6 group-hover/btn:translate-x-2 transition-transform duration-500" />
                     </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Calendar className="h-6 w-6 text-accent" />
          <h2 className="text-lg md:text-2xl font-black text-primary italic uppercase tracking-[0.2em]">Próximas Sessões</h2>
        </div>
        
        {upcoming.length === 0 && liveNow.length === 0 ? (
          <Card className="border-none shadow-xl bg-white rounded-[3rem] p-20 text-center opacity-40 border-dashed border-4 flex flex-col items-center gap-6">
            <MonitorPlay className="h-20 w-20 text-primary/20" />
            <div className="space-y-2">
              <p className="font-black italic text-2xl text-primary uppercase">Silêncio no Estúdio</p>
              <p className="text-sm text-muted-foreground font-medium italic">Nenhuma mentoria agendada para as próximas horas.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {upcoming.map((live) => (
              <Card key={live.id} className="border-none shadow-lg bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 border-l-8 border-primary/5 group">
                <CardContent className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                  <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto">
                    <div className="h-20 w-20 md:h-28 md:w-28 rounded-3xl bg-slate-50 text-primary flex flex-col items-center justify-center shadow-inner shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-700">
                      <span className="text-[10px] md:text-[12px] font-black uppercase opacity-60">{format(new Date(live.start_time), 'MMM', { locale: ptBR })}</span>
                      <span className="text-2xl md:text-5xl font-black italic leading-none">{format(new Date(live.start_time), 'dd')}</span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] md:text-[11px] border-accent/20 text-accent font-black uppercase px-3 h-6 rounded-lg">AGENDADA</Badge>
                        <Badge variant="outline" className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1 border-none shadow-none bg-transparent">
                          <MapPin className="h-3 w-3" /> Transmissão Remota
                        </Badge>
                      </div>
                      <h3 className="font-black text-primary italic text-xl md:text-3xl leading-none truncate group-hover:text-accent transition-colors tracking-tight">{live.title}</h3>
                      <p className="text-[11px] md:text-base text-muted-foreground font-bold uppercase mt-3 tracking-wide flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        Com o Mentor {live.teacher_name || "Especialista"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full md:w-auto gap-8 md:gap-16 border-t md:border-t-0 pt-6 md:pt-0 border-muted/10">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-3 text-primary font-black italic text-xl md:text-4xl">
                        <Clock className="h-5 w-5 md:h-8 md:w-8 text-accent" />
                        {format(new Date(live.start_time), 'HH:mm')}
                      </div>
                      <span className="text-[10px] md:text-[12px] font-black text-muted-foreground uppercase tracking-widest mt-2 opacity-60">Horário de Início</span>
                    </div>
                    <Button asChild variant="outline" className="rounded-2xl border-2 border-primary/10 font-black h-14 md:h-20 px-8 md:px-12 text-xs md:text-lg uppercase shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95">
                      <Link href={`/dashboard/live/${live.id}`}>AGENDAR ACESSO</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
