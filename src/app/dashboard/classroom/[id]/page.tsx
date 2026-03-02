
"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  FileText, 
  BookOpen, 
  PlayCircle, 
  BrainCircuit,
  Paperclip,
  Loader2,
  Video,
  Layout,
  Layers,
  ArrowRight,
  PlusCircle,
  Compass,
  PanelRightClose,
  PanelRightOpen,
  Target,
  Lightbulb,
  Zap,
  Award
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/app/lib/supabase";
import Script from "next/script";

export default function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: trailId } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [trail, setTrail] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [contents, setContents] = useState<Record<string, any[]>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [videoProgress, setVideoProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolledLoading] = useState(false);
  
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);

  const loadTrailData = useCallback(async () => {
    if (!trailId || !user) return;
    try {
      setLoading(true);
      
      const { data: trailData, error: trailError } = await supabase.from('trails').select('*').eq('id', trailId).single();
      if (trailError || !trailData) {
        toast({ title: "Trilha não encontrada", variant: "destructive" });
        return;
      }
      setTrail(trailData);

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('trail_id', trailId)
        .maybeSingle();
      
      if (progressData) {
        setIsEnrolled(true);
        setVideoProgress(progressData.percentage || 0);
        setIsCompleted(progressData.percentage === 100);
      }

      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('trail_id', trailId)
        .order('order_index');
      
      if (!modulesData || modulesData.length === 0) {
        setModules([]);
        setLoading(false);
        return;
      }
      setModules(modulesData);
      setActiveModuleId(modulesData[0].id);
      
      const moduleIds = modulesData.map(m => m.id);
      const { data: contentsData } = await supabase
        .from('learning_contents')
        .select('*')
        .in('module_id', moduleIds)
        .order('order_index');
      
      const contentMap: Record<string, any[]> = {};
      contentsData?.forEach(c => {
        if (!contentMap[c.module_id]) contentMap[c.module_id] = [];
        contentMap[c.module_id].push(c);
      });
      setContents(contentMap);

      if (contentMap[modulesData[0].id]?.length > 0) {
        setActiveContentId(contentMap[modulesData[0].id][0].id);
      }
    } catch (e: any) {
      console.error("Erro ao carregar aula:", e);
    } finally {
      setLoading(false);
    }
  }, [trailId, user, toast]);

  useEffect(() => {
    loadTrailData();
  }, [loadTrailData]);

  const handleEnroll = async () => {
    if (!user || !trailId || isEnrolling) return;
    setIsEnrolledLoading(true);
    try {
      const { error } = await supabase.from('user_progress').upsert({
        user_id: user.id,
        trail_id: trailId,
        percentage: videoProgress > 0 ? Math.round(videoProgress) : 0,
        last_accessed: new Date().toISOString()
      }, { onConflict: 'user_id,trail_id' });

      if (!error) {
        setIsEnrolled(true);
        toast({ title: "Fixado no Dashboard!" });
      }
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsEnrolledLoading(false);
    }
  };

  const updateServerProgress = useCallback(async (percentage: number) => {
    const completed = percentage >= 85;
    if (completed && !isCompleted && user && trailId) {
      setIsCompleted(true);
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        trail_id: trailId,
        percentage: Math.round(percentage),
        last_accessed: new Date().toISOString()
      }, { onConflict: 'user_id,trail_id' });
      toast({ title: "Progresso Registrado! ✅" });
    }
  }, [isCompleted, toast, user, trailId]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === 1) { // PLAYING
      progressInterval.current = setInterval(() => {
        try {
          if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();
            if (duration > 0) {
              const percent = (currentTime / duration) * 100;
              setVideoProgress(percent);
              updateServerProgress(percent);
            }
          }
        } catch (e) {
          console.warn("Player tracking error", e);
        }
      }, 5000); 
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  }, [updateServerProgress]);

  const initPlayer = useCallback(() => {
    const activeContent = contents[activeModuleId || ""]?.find(c => c.id === activeContentId);
    if (activeContent?.type === 'video' && isApiReady) {
      try {
        if (playerRef.current) playerRef.current.destroy();
        
        const vidUrl = activeContent.url || '';
        let vidId = '';
        if (vidUrl.includes('v=')) vidId = vidUrl.split('v=')[1].split('&')[0];
        else if (vidUrl.includes('youtu.be/')) vidId = vidUrl.split('youtu.be/')[1].split('?')[0];
        else vidId = vidUrl;

        if (vidId && (window as any).YT) {
          playerRef.current = new (window as any).YT.Player('youtube-player', {
            videoId: vidId,
            playerVars: { 'autoplay': 0, 'modestbranding': 1, 'rel': 0, 'showinfo': 0 },
            events: { 'onStateChange': onPlayerStateChange }
          });
        }
      } catch (e) {
        console.error("Player init fail", e);
      }
    } else if (activeContent && activeContent.type !== 'video') {
      setVideoProgress(100);
    }
  }, [activeContentId, activeModuleId, contents, isApiReady, onPlayerStateChange]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [initPlayer]);

  if (loading) return (
    <div className="flex flex-col min-h-[60vh] items-center justify-center gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-accent" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">Sintonizando Estúdio</p>
    </div>
  );

  const activeContent = contents[activeModuleId || ""]?.find(c => c.id === activeContentId);

  return (
    <div className="flex flex-col bg-slate-50 animate-in fade-in duration-500">
      <Script 
        src="https://www.youtube.com/iframe_api" 
        strategy="afterInteractive"
        onLoad={() => {
          (window as any).onYouTubeIframeAPIReady = () => setIsApiReady(true);
          if ((window as any).YT) setIsApiReady(true);
        }}
      />
      
      {/* CABEÇALHO COMPACTO (H-14) */}
      <header className="sticky top-0 bg-primary text-white px-4 h-14 flex items-center justify-between shrink-0 z-50 shadow-md">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white/10 h-8 w-8 shrink-0 text-white">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Compass className="h-2.5 w-2.5 text-accent" />
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{trail?.category}</p>
            </div>
            <h1 className="text-xs md:text-sm font-black italic truncate max-w-[180px] md:max-w-md">{trail?.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end gap-1 w-24 md:w-32">
            <div className="flex justify-between w-full text-[8px] font-black uppercase text-white/40">
              <span>Evolução</span>
              <span className="text-accent">{Math.round(videoProgress)}%</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${videoProgress}%` }} />
            </div>
          </div>
          
          {!isEnrolled && (
            <Button onClick={handleEnroll} disabled={isEnrolling} className="hidden md:flex bg-accent text-accent-foreground font-black text-[9px] uppercase h-8 px-4 rounded-lg">
              {isEnrolling ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <PlusCircle className="h-3 w-3 mr-1.5" />}
              Fixar
            </Button>
          )}
          <Button variant="ghost" size="icon" className="rounded-lg text-white h-8 w-8 hover:bg-white/10" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row items-start relative min-h-0">
        
        {/* ÁREA DE CONTEÚDO (FLEX-1) */}
        <main className={`flex-1 flex flex-col bg-white min-w-0 transition-all duration-500`}>
          <div className="w-full aspect-video bg-black relative shadow-xl overflow-hidden shrink-0">
            {activeContent?.type === 'video' ? (
              <div id="youtube-player" className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <Layout className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tight">{activeContent?.title || "Selecione um Material"}</h3>
                <p className="text-[10px] text-white/40 mt-2 italic font-medium">Use o roteiro abaixo para interagir com este módulo.</p>
              </div>
            )}
          </div>

          {/* CONSOLE DE ESTUDOS REFINADO E COMPACTO */}
          <Tabs defaultValue="summary" className="flex flex-col">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-slate-950 p-0 gap-0 shadow-lg border-b border-white/5 shrink-0">
              {[
                { id: "summary", label: "Roteiro", icon: BookOpen },
                { id: "quiz", label: "Prática", icon: BrainCircuit },
                { id: "support", label: "Live", icon: Video },
                { id: "attachments", label: "Anexos", icon: Paperclip }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="data-[state=active]:bg-white data-[state=active]:text-primary h-full rounded-none font-black text-[9px] md:text-[10px] uppercase tracking-widest gap-2 text-white/40 border-none"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="p-4 md:p-6 bg-slate-50/30">
               <TabsContent value="summary" className="mt-0 outline-none animate-in fade-in">
                  <div className="max-w-4xl mx-auto space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="lg:col-span-2 space-y-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 text-accent" />
                            <h2 className="text-[9px] font-black uppercase tracking-widest text-primary/40">Plano de Aprendizado</h2>
                          </div>
                          <h3 className="text-lg md:text-xl font-black text-primary italic leading-tight">{activeContent?.title}</h3>
                          <p className="text-sm font-medium text-primary/70 leading-relaxed italic border-l-2 border-accent/30 pl-3 py-1">
                            {activeContent?.description || "Inicie este material para fortalecer seus fundamentos técnicos."}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Card className="p-4 border-none shadow-md bg-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                              <Zap className="h-3.5 w-3.5 text-accent" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Ação Sugerida</span>
                            </div>
                            <p className="text-[11px] font-medium italic opacity-70">Assista ao conteúdo e anote pontos de dúvida para a mentoria semanal.</p>
                          </Card>
                          <Card className="p-4 border-none shadow-md bg-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                              <Award className="h-3.5 w-3.5 text-accent" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Meta de Aula</span>
                            </div>
                            <p className="text-[11px] font-medium italic opacity-70">Realize o mini-assessment logo após a aula para validar retenção.</p>
                          </Card>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <Card className="p-5 border-none shadow-lg bg-primary text-white rounded-[1.5rem] relative overflow-hidden group">
                          <div className="absolute top-[-10%] right-[-10%] w-20 h-20 bg-accent/20 rounded-full blur-2xl transition-transform" />
                          <div className="relative z-10 space-y-3">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-3.5 w-3.5 text-accent" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Insight Aurora IA</span>
                            </div>
                            <p className="text-[11px] md:text-xs font-medium leading-relaxed italic opacity-90">
                              "Estudos mostram que pausar a cada 15 minutos para processar o conteúdo aumenta a retenção em 40%."
                            </p>
                          </div>
                        </Card>

                        <div className="space-y-2">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-primary/40 px-1">Competências Focadas</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {['Análise Crítica', 'Lógica', 'Base Teórica', 'Prática Industrial'].map(tag => (
                              <Badge key={tag} variant="outline" className="bg-white border-muted/20 text-primary/60 font-bold text-[8px] uppercase px-2 h-6 rounded-lg italic shadow-sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
               </TabsContent>

               <TabsContent value="quiz" className="mt-0 outline-none animate-in slide-in-from-bottom-2">
                  <div className="max-w-3xl mx-auto space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-md rotate-2">
                        <BrainCircuit className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-primary italic leading-none">Avaliação Técnica</h2>
                        <p className="text-[8px] font-black text-muted-foreground uppercase mt-0.5">Validar Aprendizado</p>
                      </div>
                    </div>
                    
                    {activeContent?.url?.includes('quiz') || activeContent?.url?.includes('form') ? (
                      <Card className="p-8 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-center space-y-4 shadow-lg hover:border-accent/40 transition-all">
                         <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                            <Layers className="h-6 w-6 text-accent" />
                         </div>
                         <div className="space-y-1">
                            <p className="text-lg font-black text-primary italic">Laboratório Ativo</p>
                            <p className="text-[11px] text-muted-foreground font-medium italic max-w-xs mx-auto">Esta aula possui uma avaliação externa integrada e segura.</p>
                         </div>
                         <Button asChild className="bg-primary text-white h-10 rounded-lg font-black px-6 shadow-md text-xs">
                           <a href={activeContent?.url} target="_blank" rel="noopener noreferrer">
                             ABRIR EXERCÍCIOS 
                             <ArrowRight className="ml-2 h-3.5 w-3.5 text-accent" />
                           </a>
                         </Button>
                      </Card>
                    ) : (
                      <div className="text-center py-10 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 opacity-40">
                        <p className="text-[9px] font-black uppercase tracking-widest italic text-primary/40">Sem exercícios vinculados a este material</p>
                      </div>
                    )}
                  </div>
               </TabsContent>

               <TabsContent value="attachments" className="mt-0 outline-none animate-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto pb-4">
                    {activeContent?.type === 'pdf' || activeContent?.url?.includes('.pdf') ? (
                      <Card className="p-3 border-none shadow-md bg-white rounded-xl flex items-center gap-3 group hover:bg-primary transition-all duration-500 cursor-pointer overflow-hidden">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-white/10 group-hover:text-white transition-all">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[7px] text-accent group-hover:text-white/60 uppercase tracking-widest">Suporte</p>
                          <p className="text-xs font-black text-primary group-hover:text-white italic leading-tight truncate">Material_Apoio.pdf</p>
                        </div>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary group-hover:text-white hover:bg-white/20">
                          <a href={activeContent?.url} target="_blank" rel="noopener noreferrer"><Paperclip className="h-3.5 w-3.5" /></a>
                        </Button>
                      </Card>
                    ) : (
                      <div className="col-span-full py-10 text-center opacity-20 border-2 border-dashed rounded-2xl bg-muted/5">
                        <p className="text-[9px] font-black uppercase italic tracking-widest">Sem anexos pedagógicos disponíveis.</p>
                      </div>
                    )}
                  </div>
               </TabsContent>
            </div>
          </Tabs>
        </main>

        {/* EMENTA LATERAL (STICKET / DIREITA) */}
        {sidebarOpen && (
          <aside className="lg:w-[280px] w-full border-l bg-white sticky top-14 self-start max-h-[calc(100vh-56px)] overflow-y-auto shrink-0 transition-all duration-500">
            <div className="p-4 bg-slate-50 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[9px] font-black uppercase tracking-widest text-primary/40">Jornada</h2>
                <Badge className="bg-primary text-white text-[8px] font-black px-2 h-5 rounded-full">{modules.length} Módulos</Badge>
              </div>
              
              <div className="space-y-1.5">
                {modules.map((module, idx) => (
                  <button 
                    key={module.id}
                    onClick={() => {
                      setActiveModuleId(module.id);
                      if (contents[module.id]?.length > 0) setActiveContentId(contents[module.id][0].id);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition-all border-2 flex items-center gap-3 relative overflow-hidden group ${
                      activeModuleId === module.id 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white border-transparent hover:border-accent/20 text-primary/60'
                    }`}>
                    <span className={`text-xs font-black italic transition-colors ${activeModuleId === module.id ? 'text-accent' : 'text-primary/20'}`}>
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <p className="font-black text-[9px] uppercase tracking-wide truncate flex-1">{module.title}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-2">
               <div className="flex items-center gap-2 mb-1 px-1">
                  <Layers className="h-3 w-3 text-accent" />
                  <h3 className="text-[9px] font-black text-primary uppercase tracking-widest">Unidade</h3>
               </div>
               
               <div className="space-y-1.5 pb-6">
                 {contents[activeModuleId || ""]?.map((content) => (
                    <button 
                      key={content.id}
                      onClick={() => {
                        setActiveContentId(content.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-3 border-2 ${
                        activeContentId === content.id 
                          ? 'bg-accent/5 border-accent/30 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-accent/20 hover:bg-slate-50'
                      }`}>
                        <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 transition-all ${
                          activeContentId === content.id ? 'bg-accent text-white shadow-sm' : 'bg-slate-100 text-primary/30'
                        }`}>
                           {content.type === 'video' ? <PlayCircle className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-black text-[9px] uppercase tracking-wide truncate transition-colors ${
                            activeContentId === content.id ? 'text-primary' : 'text-primary/60'
                          }`}>{content.title}</p>
                          <p className="text-[7px] font-bold text-muted-foreground uppercase opacity-60 leading-none mt-0.5">{content.type}</p>
                        </div>
                        {activeContentId === content.id && <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
                    </button>
                 ))}
                 {(!contents[activeModuleId || ""] || contents[activeModuleId || ""].length === 0) && (
                   <div className="py-6 text-center border-2 border-dashed rounded-xl opacity-20 bg-muted/5">
                      <p className="text-[8px] font-black uppercase italic tracking-widest">Vazio</p>
                   </div>
                 )}
               </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
