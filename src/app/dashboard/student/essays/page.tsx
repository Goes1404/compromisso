"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  BookOpen, 
  Send, 
  Loader2, 
  CheckCircle2, 
  TrendingUp,
  ChevronRight,
  PenTool,
  History,
  AlertCircle,
  Lightbulb,
  Target,
  Link as LinkIcon,
  ArrowRight,
  FileText,
  Zap,
  Quote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockHistory = [
  { date: '01/05', score: 560 },
  { date: '05/05', score: 620 },
  { date: '10/05', score: 780 },
  { date: '15/05', score: 740 },
  { date: '20/05', score: 880 },
  { date: '25/05', score: 920 },
];

const ESSAY_TIPS = [
  { 
    title: "Coesão é Chave", 
    desc: "Use conectivos variados no início de cada parágrafo.",
    icon: LinkIcon,
    color: "bg-blue-500/10 text-blue-600 border-blue-200"
  },
  { 
    title: "Tese Objetiva", 
    desc: "Sua tese deve estar clara logo na introdução.",
    icon: Target,
    color: "bg-orange-500/10 text-orange-600 border-orange-200"
  },
  { 
    title: "Os 5 Elementos", 
    desc: "Não esqueça: Agente, Ação, Meio, Efeito e Detalhamento.",
    icon: CheckCircle2,
    color: "bg-green-500/10 text-green-600 border-green-200"
  }
];

const COMPETENCY_LABELS: Record<string, string> = {
  c1: "Norma Culta",
  c2: "Proposta e Conceitos",
  c3: "Organização",
  c4: "Coesão",
  c5: "Intervenção"
};

export default function StudentEssayPage() {
  const { toast } = useToast();
  const [theme, setTheme] = useState("");
  const [supportingTexts, setSupportingTexts] = useState<any[]>([]);
  const [customTheme, setCustomTheme] = useState(false);
  const [text, setText] = useState("");
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [loadingGrading, setLoadingGrading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(text.length);
  }, [text]);

  const handleGenerateTopic = async () => {
    setLoadingTopic(true);
    setResult(null);
    setCustomTheme(false);
    try {
      const res = await fetch('/api/genkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowId: 'essayTopicGenerator', input: {} })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setTheme(data.result.title);
        setSupportingTexts(data.result.supporting_texts || []);
        toast({ title: "Proposta Gerada!", description: "Textos motivadores carregados com sucesso." });
      } else {
        throw new Error(data.error || "A Aurora não respondeu ao chamado de temas.");
      }
    } catch (e: any) {
      console.error("ERRO TEMA:", e);
      toast({ title: "Aurora Offline", description: e.message, variant: "destructive" });
    } finally {
      setLoadingTopic(false);
    }
  };

  const handleSubmitEssay = async () => {
    if (text.length < 300) {
      toast({ title: "Texto insuficiente", description: "Escreva pelo menos 300 caracteres para uma análise real.", variant: "destructive" });
      return;
    }

    setLoadingGrading(true);
    try {
      const res = await fetch('/api/genkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowId: 'essayEvaluator', input: { theme, text } })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({ title: "Avaliação Concluída!", description: "Seu raio-x de competências está pronto." });
      } else {
        throw new Error(data.error || "Erro no processamento da correção.");
      }
    } catch (e: any) {
      console.error("ERRO CORREÇÃO:", e);
      toast({ title: "Aurora Offline", description: e.message, variant: "destructive" });
    } finally {
      setLoadingGrading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-20 px-2 md:px-4">
      
      {/* HEADER COMPACTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-muted/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg rotate-3">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-primary italic tracking-tighter leading-none">
              Redação <span className="text-accent">Master</span>
            </h1>
            <p className="text-muted-foreground font-medium italic text-[10px]">Aceleração com Inteligência de Rede.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => { setCustomTheme(!customTheme); setTheme(""); setSupportingTexts([]); setResult(null); }}
            className={`rounded-xl h-9 px-3 font-black text-[9px] uppercase transition-all border ${customTheme ? 'bg-primary text-white border-primary' : 'bg-white border-muted/20 text-primary'}`}
          >
            {customTheme ? <CheckCircle2 className="h-3 w-3 mr-1.5" /> : <Quote className="h-3 w-3 mr-1.5" />}
            {customTheme ? "Fixo" : "Manual"}
          </Button>
          <Button 
            size="sm"
            onClick={handleGenerateTopic} 
            disabled={loadingTopic || loadingGrading}
            className="rounded-xl h-9 bg-accent text-accent-foreground font-black px-4 shadow-lg hover:scale-105 active:scale-95 transition-all border-none text-[9px] uppercase"
          >
            {loadingTopic ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
            Gerar Tema
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ÁREA DE ESCRITA (ESQUERDA) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl rounded-[1.5rem] bg-white overflow-hidden ring-1 ring-black/5 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-20" />
            
            <CardHeader className="bg-slate-50/30 p-4 md:p-6 border-b border-dashed border-muted/30">
              {customTheme ? (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-1">Título do Tema Livre</Label>
                  <Input 
                    value={theme} 
                    onChange={(e) => setTheme(e.target.value)} 
                    placeholder="Sobre o que vamos escrever hoje?"
                    className="h-10 rounded-xl bg-white border-none shadow-inner font-bold italic text-sm text-primary focus-visible:ring-2 focus-visible:ring-accent/30"
                  />
                </div>
              ) : (
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-white border-none font-black text-[7px] px-2 py-0.5 uppercase tracking-widest rounded-full">PROPOSTA AURORA</Badge>
                    </div>
                    <CardTitle className="text-base md:text-lg font-black text-primary italic leading-tight tracking-tight">
                      {theme || "Gere um tema para começar seu treino..."}
                    </CardTitle>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-muted/10 shadow-sm shrink-0 flex flex-col items-center justify-center min-w-[60px]">
                    <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Caracteres</p>
                    <p className={`text-base font-black italic ${charCount < 300 ? 'text-orange-500' : 'text-primary'}`}>{charCount}</p>
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="p-0">
              <Textarea 
                placeholder="Inicie sua jornada argumentativa aqui... (Mínimo 300 caracteres)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loadingGrading}
                className="min-h-[350px] md:min-h-[450px] border-none p-6 md:p-8 font-medium text-sm md:text-base leading-relaxed italic resize-none focus-visible:ring-0 bg-transparent text-primary/80"
              />
              
              <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-primary/30">
                  <FileText className="h-3.5 w-3.5" />
                  <p className="text-[8px] font-black uppercase tracking-widest italic">Monitoramento Real-Time Ativo</p>
                </div>
                <Button 
                  onClick={handleSubmitEssay} 
                  disabled={loadingGrading || !text || !theme}
                  className="bg-primary text-white font-black h-10 px-8 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto text-sm border-none group"
                >
                  {loadingGrading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2 text-accent" />}
                  {loadingGrading ? "Sincronizando..." : "Solicitar Avaliação"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RESULTADOS COMPACTOS */}
          {result && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
              <Card className="border-none shadow-2xl bg-primary text-white rounded-[1.5rem] overflow-hidden relative group">
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-accent/20 rounded-full blur-[80px]" />
                <div className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="text-center md:text-left space-y-3">
                    <Badge className="bg-accent text-accent-foreground font-black text-[8px] px-3 py-1 uppercase rounded-full">DIAGNÓSTICO FINAL</Badge>
                    <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none block">{result.total_score}</h2>
                    <p className="text-xs md:text-sm font-medium italic text-white/80 max-w-lg leading-relaxed">
                      "{result.general_feedback}"
                    </p>
                  </div>
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-[2rem] bg-white/10 flex items-center justify-center rotate-6 shadow-xl border border-white/10 backdrop-blur-md">
                    <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-accent animate-pulse" />
                  </div>
                </div>
              </Card>

              {/* RAIO-X COMPACTO */}
              <Card className="border-none shadow-xl bg-white rounded-[1.5rem] overflow-hidden ring-1 ring-black/5">
                <CardHeader className="bg-slate-50/50 p-4 md:p-6 border-b border-dashed border-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shadow-inner">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base md:text-lg font-black text-primary italic leading-none">Raio-X Gramatical</CardTitle>
                      <p className="text-muted-foreground font-medium italic mt-1 text-[9px]">Detecção de desvios críticos identificados pela Aurora.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4">
                  {result.detailed_corrections?.length > 0 ? result.detailed_corrections.map((corr: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50/50 border border-muted/20 space-y-3 group hover:border-accent/30 transition-all">
                      <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="flex-1 p-3 bg-red-50/50 border border-red-100 rounded-lg text-red-700 text-[10px] font-medium line-through">
                          {corr.original}
                        </div>
                        <ChevronRight className="h-3 w-3 text-primary/20 rotate-90 md:rotate-0" />
                        <div className="flex-1 p-3 bg-green-50/50 border border-green-100 rounded-lg text-green-700 text-xs font-black italic">
                          {corr.suggestion}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <Lightbulb className="h-3 w-3 text-accent" />
                        <p className="text-[9px] font-black text-primary/60 uppercase italic">
                          JUSTIFICATIVA: <span className="text-primary normal-case font-bold">{corr.reason}</span>
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 opacity-30 italic">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="font-black uppercase text-[9px] tracking-widest">Sem desvios formais detectados</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* COMPETÊNCIAS GRID COMPACTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(result.competencies || {}).map(([key, comp]: any) => (
                  <Card key={key} className="border-none shadow-lg bg-white rounded-xl p-5 group hover:border-accent/30 border border-transparent transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <Badge className="text-3xl font-black italic">{comp.score}</Badge>
                    </div>
                    <div className="relative z-10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black uppercase text-primary/40 tracking-widest">{COMPETENCY_LABELS[key]}</span>
                        <Badge className="bg-primary text-white font-black italic text-[9px] px-2 py-0.5 rounded-full">{comp.score} / 200</Badge>
                      </div>
                      <p className="text-[11px] text-primary/80 font-medium leading-relaxed italic line-clamp-3">"{comp.feedback}"</p>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-center pt-2">
                <Button onClick={() => setResult(null)} variant="outline" className="rounded-xl h-10 px-6 border-primary/20 font-black uppercase text-[9px] text-primary hover:bg-primary hover:text-white transition-all">
                  Nova Sessão de Treino
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* BARRA LATERAL (DIREITA) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* TEXTOS MOTIVADORES COMPACTOS */}
          {!result && supportingTexts.length > 0 && (
            <Card className="border-none shadow-xl bg-white rounded-[1.5rem] overflow-hidden animate-in slide-in-from-right-4 ring-1 ring-black/5">
              <CardHeader className="bg-accent/5 p-4 border-b border-dashed border-accent/20">
                <CardTitle className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-accent" /> Base de Referência
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide">
                {supportingTexts.map((st) => (
                  <div key={st.id} className="space-y-1.5 p-3 bg-slate-50/50 rounded-xl border border-muted/20 relative">
                    <p className="text-[11px] font-medium italic text-primary/80 leading-relaxed">"{st.content}"</p>
                    <p className="text-[7px] font-black text-muted-foreground uppercase text-right tracking-widest pt-1.5 border-t border-muted/10 opacity-60">Fonte: {st.source}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* CHECKLIST COMPACTO */}
          <Card className="border-none shadow-xl bg-primary text-white rounded-[1.5rem] p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-accent/20 rounded-full blur-[40px]" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-accent shadow-lg border border-white/10">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="font-black text-white italic uppercase tracking-widest text-[10px]">Protocolo de Aprovação</h3>
              </div>
              <div className="space-y-2">
                {[
                  "Domínio da norma culta.",
                  "Tese clara na introdução.",
                  "Dois repertórios externos.",
                  "Proposta de intervenção 5/5."
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="h-1 w-1 rounded-full bg-accent" />
                    <span className="text-[9px] font-bold italic opacity-90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* DICAS DA AURORA COMPACTAS */}
          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-primary/40 uppercase tracking-[0.3em] px-4 flex items-center gap-2">
              <Zap className="h-2.5 w-2.5 text-accent fill-accent" /> Mentoria Aurora
            </h3>
            {ESSAY_TIPS.map((tip, i) => (
              <Card key={i} className="border-none shadow-md bg-white rounded-xl p-3.5 hover:shadow-lg transition-all cursor-default group">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border transition-transform group-hover:scale-110 ${tip.color}`}>
                    <tip.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-black text-primary italic leading-none">{tip.title}</p>
                    <p className="text-[9px] text-muted-foreground font-medium italic leading-tight">{tip.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* DASHBOARD DE EVOLUÇÃO (RODAPÉ) */}
      <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden p-6 md:p-10 mt-10 group relative ring-1 ring-black/5">
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
          <TrendingUp className="h-48 w-48 text-primary" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shadow-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-primary italic tracking-tighter">
                Evolução <span className="text-accent">Acadêmica</span>
              </h3>
            </div>
            <p className="text-muted-foreground font-medium italic text-[10px] max-w-md">Mapeamento histórico de performance em Redação.</p>
          </div>
          
          <div className="flex gap-6 bg-slate-50 p-4 rounded-xl border border-muted/10 shadow-inner">
            <div className="text-center">
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Média</p>
              <p className="text-xl font-black text-primary italic">785</p>
            </div>
            <div className="w-px bg-muted/20" />
            <div className="text-center">
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Pico</p>
              <p className="text-xl font-black text-accent italic">920</p>
            </div>
          </div>
        </div>
        
        <div className="h-[250px] w-full mt-2 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: '900', fontStyle: 'italic' }} 
                dy={10} 
              />
              <YAxis 
                domain={[0, 1000]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: '900' }} 
                dx={-5}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: 'none', 
                  boxShadow: '0 15px 30px -10px rgba(0,0,0,0.2)', 
                  padding: '0.75rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'white'
                }} 
                itemStyle={{ fontWeight: '900', fontSize: '11px', color: 'hsl(var(--accent))' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem', fontSize: '9px' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--accent))" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                dot={{ r: 5, fill: "hsl(var(--accent))", strokeWidth: 2, stroke: "#fff" }} 
                activeDot={{ r: 8, fill: "white", stroke: "hsl(var(--accent))", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-8 text-[8px] font-black text-primary/20 uppercase tracking-[0.4em] italic">
          <History className="h-3.5 w-3.5" /> Maestro Sincronizado • Rede Compromisso
        </div>
      </Card>
    </div>
  );
}