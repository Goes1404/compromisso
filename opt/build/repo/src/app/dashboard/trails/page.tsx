"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardFooter, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  PlayCircle, 
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  Zap,
  Clock,
  BookOpen
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/app/lib/supabase";

const TRAIL_CATEGORIES = ["Todos", "Matemática", "Tecnologia", "Linguagens", "Física", "Biologia", "História", "Geografia"];
const AUDIENCE_FILTERS = [
  { id: "all", label: "Toda a Comunidade" },
  { id: "etec", label: "Perfil ETEC" },
  { id: "uni", label: "Perfil Vestibular" }
];

export default function LearningTrailsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeAudience, setActiveAudience] = useState("all");
  
  const [dbTrails, setDbTrails] = useState<any[]>([]);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const { data: trails, error: trailsError } = await supabase
          .from('trails')
          .select('*')
          .or('status.eq.active,status.eq.published')
          .order('created_at', { ascending: false });

        if (trailsError) throw trailsError;

        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id);

        setDbTrails(trails || []);
        setAllProgress(progress || []);
      } catch (e) {
        console.error("Erro ao sincronizar trilhas:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const filteredTrails = useMemo(() => {
    if (!Array.isArray(dbTrails)) return [];
    return dbTrails.filter(trail => {
      const trailTitle = (trail?.title || '').toLowerCase();
      const trailCategory = (trail?.category || '').toLowerCase();
      const query = searchTerm.toLowerCase();
      
      const matchesSearch = trailTitle.includes(query) || trailCategory.includes(query);
      const matchesCategory = activeCategory === "Todos" || trail?.category === activeCategory;
      const matchesAudience = activeAudience === "all" || trail?.target_audience === activeAudience || trail?.target_audience === "both" || !trail?.target_audience;
      
      return matchesSearch && matchesCategory && matchesAudience;
    });
  }, [dbTrails, searchTerm, activeCategory, activeAudience]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="mt-6 text-primary font-black italic uppercase tracking-[0.3em] text-[10px] animate-pulse">Sintonizando Estúdio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-1 md:px-4">
      {/* Header Visual */}
      <section className="relative overflow-hidden bg-primary rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-accent/20 rounded-full blur-[80px]" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <Badge className="bg-accent text-accent-foreground border-none font-black text-[9px] px-3 py-1 uppercase tracking-wider">Compromisso 360</Badge>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight uppercase">
            Sua Rota de <span className="text-accent">Alta Performance</span>
          </h1>
          <p className="text-sm md:text-base text-white/60 font-medium italic leading-relaxed max-w-xl">
            Escolha um dos eixos temáticos abaixo e inicie sua jornada guiada pelos melhores mentores da rede.
          </p>
        </div>
      </section>

      {/* Controles Dinâmicos */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-accent" />
            <Input 
              placeholder="Pesquisar trilha..." 
              className="pl-11 h-12 bg-white border-none shadow-xl rounded-2xl text-sm font-medium italic focus-visible:ring-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white border-none shadow-xl font-black text-[10px] uppercase gap-3">
                <Filter className="h-4 w-4 text-accent" />
                Filtrar Perfil
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 border-none shadow-2xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-3">Público-Alvo</DropdownMenuLabel>
              {AUDIENCE_FILTERS.map(filter => (
                <DropdownMenuItem 
                  key={filter.id} 
                  onClick={() => setActiveAudience(filter.id)}
                  className={`rounded-xl px-3 py-3 font-bold text-xs cursor-pointer mb-1 ${activeAudience === filter.id ? 'bg-primary text-white' : ''}`}
                >
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 scrollbar-hide">
          {TRAIL_CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-6 h-10 text-[9px] font-black uppercase tracking-widest shrink-0 transition-all shadow-md border-none ${activeCategory === cat ? 'bg-primary text-white scale-105' : 'bg-white text-primary hover:bg-accent hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Trilhas - Responsividade e Alinhamento Industrial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredTrails.map((trail, index) => {
          const userProgress = allProgress?.find(p => p.trail_id === trail.id);
          const percentage = userProgress?.percentage || 0;
          const isCompleted = percentage === 100;

          return (
            <Card key={trail.id} className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white rounded-[2rem] flex flex-col relative animate-in fade-in slide-in-from-bottom-4">
              <div className="relative aspect-video overflow-hidden shrink-0">
                <Image 
                  src={trail.image_url || `https://picsum.photos/seed/trail-${trail.id}/800/450`} 
                  alt={trail.title} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 backdrop-blur-md text-primary border-none shadow-lg px-3 py-1 rounded-lg font-black text-[8px] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-accent fill-accent" />
                    {trail.category}
                  </Badge>
                </div>
                {isCompleted && (
                  <div className="absolute top-4 right-4 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-in zoom-in">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-6 flex-1 flex flex-col justify-between min-h-[180px]">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-primary italic leading-tight group-hover:text-accent transition-colors line-clamp-2">
                    {trail.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium italic line-clamp-2 opacity-80 leading-relaxed">
                    {trail.description || "Inicie agora esta jornada técnica projetada para fortalecer sua base acadêmica."}
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between items-center text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-accent" />
                      {percentage}% Evoluído
                    </span>
                    <span className="opacity-40">{isCompleted ? 'Finalizada' : 'Em andamento'}</span>
                  </div>
                  <Progress value={percentage} className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                     <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${percentage}%` }} />
                  </Progress>
                </div>
              </CardContent>
              
              <CardFooter className="px-6 pb-6 pt-0 mt-auto">
                <div className="flex items-center justify-between w-full pt-4 border-t border-muted/5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center border border-muted/10 overflow-hidden shrink-0">
                      <Image 
                        src={`https://picsum.photos/seed/prof-${trail.id}/60/60`} 
                        alt="Mentor" 
                        width={32} 
                        height={32} 
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-black text-primary italic leading-none truncate max-w-[100px]">{trail.teacher_name || "Mentor"}</span>
                  </div>
                  <Button asChild className="bg-primary text-white font-black text-[9px] uppercase h-9 px-5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                    <Link href={`/dashboard/classroom/${trail.id}`}>
                      Entrar <ChevronRight className="h-3 w-3 ml-1.5 text-accent" />
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
        {filteredTrails.length === 0 && !loading && (
          <div className="col-span-full py-32 text-center border-4 border-dashed border-muted/20 rounded-[3rem] bg-white/50 opacity-40">
            <BookOpen className="h-16 w-16 mx-auto mb-4" />
            <p className="font-black italic text-xl">Nenhuma trilha localizada</p>
          </div>
        )}
      </div>
    </div>
  );
}