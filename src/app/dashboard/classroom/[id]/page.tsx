
"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  CheckCircle2,
  HelpCircle,
  Layout,
  Layers,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  PlusCircle
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/app/lib/supabase";

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
  const [showSidebar, setShowSidebar] = useState(false);
  
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
      
      const { data: trailData } = await supabase.from('trails').select('*').eq('id', trailId).single();
      if (!trailData) {
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
        toast({ title: "Fixado no Dashboard!", description: "Acompanhe seu progresso pela página inicial." });
      } else {
        throw error;
      }
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsEnrolledLoading(false);
    }
  };

  const updateServerProgress = useCallback(async (percentage: number) => {
    const completed = percentage >= 80;
    if (completed && !isCompleted && user && trailId) {
      setIsCompleted(true);
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        trail_id: trailId,
        percentage: Math.round(percentage),
        last_accessed: new Date().toISOString()
      }, { onConflict: 'user_id,trail_id' });
      toast({ title: "Progresso Registrado! ✅", description: "Sua dedicação está sendo mapeada." });
    }
  }, [isCompleted, toast, user, trailId]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === 1) { 
      progressInterval.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            setVideoProgress(percent);
            updateServerProgress(percent);
          }
        }
      }, 5000); 
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  }, [updateServerProgress]);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else if (typeof window !== "undefined" && (window as any).YT) {
      setIsApiReady(true);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (playerRef.current) playerRef.current.destroy();
    };
  }, []);

  const activeContent = contents[activeModuleId || ""]?.find(c => c.id === activeContentId);

  useEffect(() => {
    if (activeContent?.type === 'video' && isApiReady) {
      if (playerRef.current) playerRef.current.destroy();
      
      const vidUrl = activeContent.url || '';
      let vidId = '';
      if (vidUrl.includes('v=')) vidId = vidUrl.split('v=')[1].split('&')[0];
      else if (vidUrl.includes('youtu.be/')) vidId = vidUrl.split('youtu.be/')[1].split('?')[0];
      else vidId = vidUrl;

      if (vidId) {
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          videoId: vidId,
          playerVars: { 'autoplay': 0, 'modestbranding': 1, 'rel': 0, 'showinfo': 0 },
          events: { 'onStateChange': onPlayerStateChange }
        });
      }
    } else if (activeContent && activeContent.type !== 'video') {
      setVideoProgress(100);
    }
  }, [activeContentId, activeContent, isApiReady, onPlayerStateChange]);

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center gap-6 bg-background">
      <div className="relative">
        <Loader2 className="animate-spin h-20 w-20 text-accent opacity-20" />
        <Loader2 className="animate-spin h-20 w-20 text-accent absolute top-0 left-0" style={{ animationDuration: '3s' }} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">Sintonizando Estúdio Pedagógico</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden">
      
      <header className="bg-white border-b px-4 md:px-8 h-16 md:h-20 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary/5 h-9 w-9 md:h-10 md:w-10 shrink-0">
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm md:text-xl font-black text-primary italic leading-none truncate max-w-[150px] md:max-w-[400px]">{trail?.title}</h1>
            <p className="text-[7px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 md:mt-1 truncate">Capítulo: {modules.find(m => m.id === activeModuleId)?.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          {!isEnrolled && (
            <Button onClick={handleEnroll} disabled={isEnrolling} className="hidden sm:flex bg-accent text-accent-foreground font-black text-[10px] uppercase h-9 md:h-10 px-4 md:px-6 rounded-xl shadow-lg hover:animate-none border-none">
              {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          )}
          <div className="hidden lg:flex flex-col items-end gap-1 w-48">
            <div className="flex justify-between w-full text-[9px] font-black uppercase text-primary/40">
              <span>Progresso</span>
              <span className="text-accent italic">{Math.round(videoProgress)}%</span>
            </div>
            <Progress value={videoProgress} className="h-1.5 bg-muted rounded-full overflow-hidden">
               <div className="h-full bg-accent" style={{ width: `${videoProgress}%` }} />
            </Progress>
          </div>
          <Button variant="outline" size="icon" className="lg:hidden rounded-xl border-2 h-9 w-9" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        <aside className={`
          absolute inset-y-0 left-0 w-full sm:w-80 lg:w-[380px] bg-white border-r z-30 transition-transform duration-500 transform
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none
        `}>
          <div className="p-4 md:p-6 bg-primary text-white shrink-0">
            {!isEnrolled && (
              <Button onClick={handleEnroll} disabled={isEnrolling} className="sm:hidden w-full mb-4 bg-accent text-accent-foreground font-black text-[10px] uppercase h-11 rounded-xl shadow-lg border-none">
                {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                Salvar no Dashboard
              </Button>
            )}
            <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-3 md:mb-4">Ementa da Jornada</h2>
            <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-2 scrollbar-hide">
              {modules.map((module, idx) => (
                <button 
                  key={module.id}
                  onClick={() => {
                    setActiveModuleId(module.id);
                    if (contents[module.id]?.length > 0) setActiveContentId(contents[module.id][0].id);
                    if (window.innerWidth < 1024) setShowSidebar(false);
                  }}
                  className={`w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border-2 ${activeModuleId === module.id ? 'bg-white text-primary border-accent shadow-lg scale-[1.02]' : 'bg-white/5 border-transparent hover:bg-white/10 opacity-60'}`}>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className={`text-sm md:text-xl font-black italic ${activeModuleId === module.id ? 'text-accent' : 'text-white/20'}`}>{idx + 1}</span>
                    <p className="font-black text-[8px] md:text-[10px] uppercase tracking-wider truncate">{module.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 scrollable-content bg-slate-50/50">
             <h3 className="text-[8px] md:text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] mb-2 md:mb-4">Materiais do Capítulo</h3>
             {contents[activeModuleId || ""]?.map((content) => (
                <button 
                  key={content.id}
                  onClick={() => {
                    setActiveContentId(content.id);
                    if (window.innerWidth < 1024) setShowSidebar(false);
                  }}
                  className={`w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl transition-all flex items-center gap-3 md:gap-4 border-2 ${activeContentId === content.id ? 'bg-white border-accent shadow-md' : 'bg-white border-transparent hover:border-muted/20'}`}>
                    <div className={`h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 shadow-sm ${activeContentId === content.id ? 'bg-accent text-white' : 'bg-muted/30 text-primary/40'}`}>
                       {content.type === 'video' ? <PlayCircle className="h-4 w-4 md:h-5 md:w-5" /> : <FileText className="h-4 w-4 md:h-5 md:w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-black text-[8px] md:text-[10px] uppercase tracking-widest truncate ${activeContentId === content.id ? 'text-accent' : 'text-primary/60'}`}>{content.title}</p>
                      <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase mt-0.5">{content.type}</p>
                    </div>
                    {activeContentId === content.id && <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-accent ml-auto shrink-0" />}
                </button>
             ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div className="w-full aspect-video md:aspect-[21/9] bg-black relative group shadow-2xl shrink-0">
            {activeContent?.type === 'video' ? (
              <div id="youtube-player" className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-primary text-white p-6 md:p-10 text-center">
                <div className="h-12 w-12 md:h-20 md:w-20 rounded-2xl md:rounded-3xl bg-white/10 flex items-center justify-center mb-4 md:mb-6 animate-pulse">
                  <Layout className="h-6 w-6 md:h-10 md:w-10 text-accent" />
                </div>
                <h3 className="text-base md:text-2xl font-black italic uppercase tracking-widest truncate max-w-full px-4">{activeContent?.title || "Selecione um Material"}</h3>
                <p className="text-[10px] md:sm text-slate-400 mt-2 max-w-md italic hidden sm:block">Utilize as abas abaixo para interagir com as instruções do seu mentor.</p>
              </div>
            )}
          </div>

          <Tabs defaultValue="summary" className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 h-12 md:h-16 bg-white border-b p-0 gap-0 shrink-0">
              {["summary", "quiz", "support", "attachments"].map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab} 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white h-full rounded-none font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all gap-1 md:gap-2 px-1 border-none"
                >
                  {tab === 'summary' && <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                  {tab === 'quiz' && <BrainCircuit className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                  {tab === 'support' && <Video className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                  {tab === 'attachments' && <Paperclip className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                  <span className="hidden sm:inline">{tab === 'summary' ? 'Guia' : tab === 'quiz' ? 'Prática' : tab === 'support' ? 'Live' : 'Anexos'}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollable-content">
               <TabsContent value="summary" className="mt-0 outline-none animate-in slide-in-from-bottom-4">
                  <div className="max-w-4xl space-y-4 md:space-y-8">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner rotate-3">
                        <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-2xl font-black text-primary italic leading-none">Diretrizes do Mentor</h2>
                        <p className="text-[7px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Orientações para absorção de conteúdo</p>
                      </div>
                    </div>
                    <Card className="border-none shadow-xl bg-slate-50 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-accent" />
                      <p className="text-xs md:text-lg leading-relaxed text-primary/80 font-medium italic whitespace-pre-line relative z-10">
                        {activeContent?.description || "Este material foi estrategicamente selecionado para fortalecer sua base técnica. Foque nos conceitos fundamentais apresentados e anote suas dúvidas para a próxima sessão de mentoria."}
                      </p>
                    </Card>
                  </div>
               </TabsContent>

               <TabsContent value="quiz" className="mt-0 outline-none">
                  <div className="max-w-4xl space-y-4 md:space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl">
                          <BrainCircuit className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <h2 className="text-lg md:text-2xl font-black text-primary italic leading-none">Atividade de Fixação</h2>
                      </div>
                      <Badge className="hidden sm:flex bg-green-100 text-green-700 border-none font-black text-[10px] px-4 py-1 uppercase">Validado por IA</Badge>
                    </div>
                    
                    {activeContent?.url?.includes('quiz') || activeContent?.url?.includes('form') ? (
                      <div className="p-6 md:p-12 bg-white border-2 md:border-4 border-dashed rounded-3xl md:rounded-[3rem] text-center space-y-4 md:space-y-6 shadow-sm">
                         <div className="h-14 w-14 md:h-20 md:w-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                            <Layers className="h-7 w-7 md:h-10 md:w-10 text-accent" />
                         </div>
                         <p className="text-sm md:text-lg font-bold text-primary italic">Este capítulo possui uma avaliação externa vinculada.</p>
                         <Button asChild className="bg-primary text-white h-12 md:h-16 rounded-xl md:rounded-2xl font-black px-6 md:px-12 shadow-2xl hover:scale-105 transition-all w-full md:w-auto border-none">
                           <a href={activeContent?.url} target="_blank" rel="noopener noreferrer">ABRIR AMBIENTE DE PROVA <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" /></a>
                         </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12 md:py-20 bg-muted/10 rounded-3xl md:rounded-[3rem] border-2 border-dashed border-muted/20 opacity-40">
                        <HelpCircle className="h-10 w-10 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-muted-foreground" />
                        <p className="text-[10px] md:text-sm font-black uppercase tracking-widest italic">Nenhum quiz associado a este item</p>
                      </div>
                    )}
                  </div>
               </TabsContent>

               <TabsContent value="attachments" className="mt-0 outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {activeContent?.type === 'pdf' || activeContent?.url?.includes('.pdf') ? (
                      <Card className="p-5 md:p-8 border-none shadow-xl bg-white rounded-2xl md:rounded-[2rem] flex items-center gap-4 md:gap-6 group hover:bg-primary transition-all duration-500 cursor-pointer">
                        <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-white/10 group-hover:text-white shadow-inner transition-colors">
                          <FileText className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[7px] md:text-[10px] text-muted-foreground group-hover:text-white/60 uppercase tracking-widest">Material de Apoio</p>
                          <p className="text-sm md:text-lg font-black text-primary group-hover:text-white italic leading-tight truncate">Guia Técnico.pdf</p>
                        </div>
                        <Button asChild variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full text-primary group-hover:text-white hover:bg-white/20 shrink-0 border-none">
                          <a href={activeContent?.url} target="_blank" rel="noopener noreferrer"><Paperclip className="h-5 w-5 md:h-6 md:w-6" /></a>
                        </Button>
                      </Card>
                    ) : (
                      <div className="col-span-full py-12 md:py-20 text-center opacity-30 italic font-bold text-xs md:text-base">Nenhum anexo disponível para este conteúdo.</div>
                    )}
                  </div>
               </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
