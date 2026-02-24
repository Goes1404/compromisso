
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  ChevronLeft, 
  Send,
  Loader2,
  Signal,
  Sparkles,
  ExternalLink,
  Video,
  Users,
  Bot
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/app/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function StudentLivePage() {
  const params = useParams();
  const liveId = params.id as string;
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [live, setLive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadLiveData() {
      if (!liveId) return;
      
      const { data, error } = await supabase
        .from('lives')
        .select(`*`)
        .eq('id', liveId)
        .single();

      if (error) {
        toast({ title: "Erro ao carregar aula", variant: "destructive" });
        router.push('/dashboard/live');
        return;
      }

      setLive(data);

      const { data: msgs } = await supabase
        .from('live_messages')
        .select('*')
        .eq('live_id', liveId)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
      setLoading(false);
    }

    loadLiveData();

    const channel = supabase
      .channel(`live:${liveId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'live_messages', 
        filter: `live_id=eq.${liveId}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
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
  }, [liveId, router, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const msgContent = input;
    setInput("");

    const { error } = await supabase
      .from('live_messages')
      .insert({
        live_id: liveId,
        user_id: user.id,
        user_name: profile?.name || user.email?.split('@')[0],
        content: msgContent,
        is_question: msgContent.includes('?')
      });

    if (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      }
    }
  }, [messages]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="animate-spin h-12 w-12 text-accent" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando com o Satélite...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4 animate-in fade-in duration-700 overflow-hidden">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-white/20 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0 hover:bg-primary/5 transition-colors">
            <ChevronLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm md:text-lg font-black text-primary italic leading-none truncate">{live?.title}</h1>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Sala de Mentoria • {live?.teacher_name || 'Mentor'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className={`${live?.status === 'live' ? 'bg-red-600 animate-pulse' : 'bg-slate-400'} text-white border-none px-3 font-black text-[10px]`}>
            {live?.status === 'live' ? 'ACONTECENDO AGORA' : 'SALA AGENDADA'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 overflow-hidden">
          <Card className="flex-1 bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border-none relative flex items-center justify-center group">
            <div className="w-full h-full relative flex flex-col items-center justify-center p-8 text-center gap-8 bg-gradient-to-br from-slate-900 via-black to-slate-900">
               <div className="absolute top-6 left-6 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sinal de Transmissão Estável</span>
               </div>

               <div className="h-32 w-32 md:h-56 md:w-56 rounded-full bg-accent/5 border-4 border-accent/20 flex items-center justify-center relative shadow-[0_0_80px_rgba(245,158,11,0.1)] group-hover:scale-105 transition-transform duration-700">
                  <Video className="h-16 w-16 md:h-28 md:w-28 text-accent opacity-80" />
                  {live?.status === 'live' && (
                    <div className="absolute -bottom-2 right-6 h-10 w-10 bg-green-500 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-xl">
                       <Signal className="h-5 w-5 text-white animate-pulse" />
                    </div>
                  )}
               </div>
               
               <div className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-4xl font-black text-white italic leading-none">Portal de Mentoria</h3>
                    <p className="text-xs md:text-sm text-slate-400 font-medium italic">Clique no botão abaixo para ingressar na videoconferência externa segura.</p>
                  </div>
                  
                  {live?.meeting_url ? (
                    <div className="flex flex-col gap-4">
                      <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-black h-16 px-12 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
                        <a href={live.meeting_url} target="_blank" rel="noopener noreferrer">
                          <span className="relative z-10 flex items-center gap-3">
                            ENTRAR NA SALA AGORA
                            <ExternalLink className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </a>
                      </Button>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Abertura em nova aba recomendada</p>
                    </div>
                  ) : (
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <p className="text-xs font-bold text-slate-500 italic">O mentor ainda está preparando a sala. Fique atento ao chat ao lado!</p>
                    </div>
                  )}
               </div>
            </div>
          </Card>
          
          <Card className="bg-white rounded-[2.5rem] shadow-xl p-8 border-none hidden md:block shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Bot className="h-20 w-20 text-primary" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em]">Pauta da Sessão</h2>
            </div>
            <p className="text-sm font-medium italic text-primary/80 leading-relaxed max-w-2xl">
              {live?.description || "Esta é uma sessão de apoio pedagógico exclusiva da rede Compromisso. Aproveite para tirar dúvidas técnicas e pedagógicas em tempo real."}
            </p>
          </Card>
        </div>

        <Card className="lg:col-span-4 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col min-h-0">
          <div className="p-6 border-b bg-muted/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-accent" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Interatividade</span>
            </div>
            <Badge className="bg-primary/5 text-primary text-[8px] font-black border-none px-2 py-1">REAL-TIME</Badge>
          </div>

          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="flex flex-col gap-4 pb-10">
              {messages.length === 0 ? (
                <div className="py-20 text-center opacity-20 flex flex-col items-center gap-3">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <p className="font-black italic text-[10px] uppercase">Aguardando as primeiras dúvidas...</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col gap-1 ${msg.user_id === user?.id ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">{msg.user_name}</span>
                      {msg.is_answered && <Badge className="bg-green-100 text-green-700 text-[6px] h-3 px-1 border-none font-black">RESPONDIDO</Badge>}
                    </div>
                    <div className={`px-4 py-3 rounded-[1.5rem] text-xs font-medium shadow-sm border transition-all ${
                      msg.user_id === user?.id 
                        ? 'bg-primary text-white rounded-tr-none border-primary/5' 
                        : msg.is_question 
                          ? 'bg-accent/10 text-primary border-accent/20 rounded-tl-none ring-2 ring-accent/5' 
                          : 'bg-muted/30 text-primary rounded-tl-none border-muted/10'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-6 bg-muted/5 border-t">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white p-2 pl-5 rounded-full shadow-2xl border border-muted/20 focus-within:ring-2 focus-within:ring-accent/30 transition-all">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enviar pergunta para o mentor..."
                className="flex-1 h-10 bg-transparent border-none text-primary font-medium italic focus-visible:ring-0 px-0 text-xs"
              />
              <Button type="submit" disabled={!input.trim()} className="h-10 w-10 bg-primary hover:bg-primary/95 text-white rounded-full shrink-0 shadow-lg transition-transform active:scale-90 flex items-center justify-center">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
