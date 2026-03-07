
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
  Layers, 
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
        <p className="mt-6 text-primary font-black italic uppercase tracking-[0.3em] text-[10px] animate-pulse">Sintonizando Satélite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-1">
      {/* Hero Section Refinada */}
      <section className="relative overflow-hidden bg-primary rounded-[2.5rem] p-8 md:p-16 text-white shadow-2xl">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-accent/20 rounded-full blur-[80px]" />
        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <Badge className="bg-accent text-accent-foreground border-none font-black text-[9px] px-3 py-1 uppercase tracking-wider">Compromisso 360</Badge>
            <div className="h-px w-12 bg-white/20 hidden sm:block" />
            <span className="text-white/40 text-[9px] font-black uppercase tracking-widest hidden sm:inline">Tecnologia para Aprovação</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-[0.9] uppercase">
            Sua Rota de <span className="text-accent">Alta Performance</span>
          </h1>
          <p className="text-sm md:text-lg text-white/60 font-medium italic leading-relaxed max-w-xl">
            Escolha um dos eixos temáticos abaixo e inicie sua jornada guiada pelos melhores mentores da rede.
          </p>
        </div>
      </section>

      {/* Controles Dinâmicos */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <Input 
              placeholder="Pesquisar trilha ou matéria..." 
              className="pl-11 h-12 md:h-14 bg-white border-none shadow-xl rounded-2xl text-sm font-medium italic focus-visible:ring-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 md:h-14 px-6 rounded-2xl bg-white border-none shadow-xl hover:bg-muted font-black text-[10px] uppercase tracking-widest gap-3 shrink-0">
                <Filter className={`h-4 w-4 ${activeAudience !== 'all' ? 'text-accent' : ''}`} />
                {AUDIENCE_FILTERS.find(f => f.id === activeAudience)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 border-none shadow-2xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-3">Público-Alvo</DropdownMenuLabel>
              {AUDIENCE_FILTERS.map(filter => (
                <DropdownMenuItem 
                  key={filter.id} 
                  onClick={() => setActiveAudience(filter.id)}
                  className={`rounded-xl px-3 py-3 font-bold text-xs cursor-pointer mb-1 transition-all ${activeAudience === filter.id ? 'bg-primary text-white' : ''}`}
                >
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 scrollbar-hide">
          {TRAIL_CATEGORIES.map(cat => (
            <Button 
              key={cat} 
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-6 h-10 text-[9px] font-black uppercase tracking-widest shrink-0 transition-all border-none shadow-md ${activeCategory === cat ? 'bg-primary text-white scale-105' : 'bg-white text-primary hover:bg-accent hover:text-white'}`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Trilhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredTrails.length > 0 ? (
          filteredTrails.map((trail, index) => {
            const userProgress = allProgress?.find(p => p.trail_id === trail.id);
            const percentage = userProgress?.percentage || 0;
            const isCompleted = percentage === 100;

            return (
              <Card key={trail.id} className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white rounded-[2rem] flex flex-col relative animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image 
                    src={trail.image_url || `https://picsum.photos/seed/trail-${trail.id}/800/450`} 
                    alt={trail.title} 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent opacity-60" />
                  
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur-md text-primary border-none shadow-lg flex items-center gap-1.5 px-3 py-1 rounded-lg">
                      <Zap className="h-3 w-3 text-accent fill-accent" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{trail.category}</span>
                    </Badge>
                  </div>

                  {isCompleted && (
                    <div className="absolute top-4 right-4 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-in zoom-in">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                
                <CardHeader className="p-6 md:p-8 space-y-3 flex-1">
                  <div className="space-y-2">
                    <CardTitle className="text-xl md:text-2xl font-black text-primary italic leading-tight group-hover:text-accent transition-colors line-clamp-2 min-h-[3rem]">
                      {trail.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium italic line-clamp-2 opacity-80 leading-relaxed">
                      {trail.description || "Inicie agora esta jornada técnica projetada para fortalecer sua base acadêmica."}
                    </p>
                  </div>

                  <div className="pt-4 space-y-2.5">
                    <div className="flex justify-between items-center text-[8px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 text-accent" />
                        {percentage}% Evoluído
                      </span>
                      <span className="flex items-center gap-1 opacity-40"><Clock className="h-2.5 w-2.5"/> Recente</span>
                    </div>
                    <Progress value={percentage} className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                       <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${percentage}%` }} />
                    </Progress>
                  </div>
                </CardHeader>
                
                <CardFooter className="px-6 md:px-8 pb-6 md:pb-8 pt-0 mt-auto">
                  <div className="flex items-center justify-between w-full pt-5 border-t border-muted/5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center border border-muted/10 shadow-sm overflow-hidden shrink-0">
                        <Image 
                          src={`https://picsum.photos/seed/prof-${trail.id}/60/60`} 
                          alt="Mentor" 
                          width={32} 
                          height={32} 
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary italic leading-none">{trail.teacher_name || "Mentor"}</span>
                        <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">Especialista</span>
                      </div>
                    </div>
                    <Button asChild className="bg-primary text-white font-black text-[9px] uppercase h-9 px-5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                      <Link href={`/dashboard/classroom/${trail.id}`}>
                        Entrar na Sala <ChevronRight className="h-3 w-3 ml-1.5 text-accent" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center border-4 border-dashed border-muted/20 rounded-[3rem] bg-white/50 animate-in zoom-in-95 duration-700">
            <BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
            <p className="font-black text-primary italic text-xl uppercase tracking-tighter">Nenhuma Trilha Localizada</p>
            <p className="text-xs text-muted-foreground font-medium mt-2 italic">Tente mudar a categoria ou o filtro de público.</p>
          </div>
        )}
      </div>
    </div>
  );
}
