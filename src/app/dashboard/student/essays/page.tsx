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
        toast({ title: "Proposta Gerada!", description: "Textos motivadores carregados." });
      } else {
        throw new Error(data.error || "Falha na comunicação.");
      }
    } catch (e: any) {
      toast({ title: "Aurora Offline", description: e.message, variant: "destructive" });
    } finally {
      setLoadingTopic(false);
    }
  };

  const handleSubmitEssay = async () => {
    if (text.length < 300) {
      toast({ title: "Texto muito curto", description: "Mínimo de 300 caracteres.", variant: "destructive" });
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
        toast({ title: "Avaliação Concluída!", description: "Diagnóstico disponível abaixo." });
      } else {
        throw new Error(data.error || "Erro no processamento.");
      }
    } catch (e: any) {
      toast({ title: "Erro na Correção", description: e.message, variant: "destructive" });
    } finally {
      setLoadingGrading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-20 px-4 md:px-6">
      
      {/* HEADER COMPACTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg rotate-3">
            <PenTool className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary italic tracking-tighter leading-none">
              Redação <span className="text-accent">Master</span>
            </h1>
            <p className="text-muted-foreground font-medium italic text-[10px] md:text-xs">Aceleração com Inteligência de Rede.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => { setCustomTheme(!customTheme); setTheme(""); setSupportingTexts([]); setResult(null); }}
            className={`rounded-xl h-10 px-4 font-black text-[10px] uppercase transition-all border ${customTheme ? 'bg-primary text-white border-primary' : 'bg-white border-muted/20 text-primary'}`}
          >
            {customTheme ? <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> : <Quote className="h-3.5 w-3.5 mr-2" />}
            {customTheme ? "Fixo" : "Manual"}
          </Button>
          <Button 
            size="sm"
            onClick={handleGenerateTopic} 
            disabled={loadingTopic || loadingGrading}
            className="rounded-xl h-10 bg-accent text-accent-foreground font-black px-6 shadow-lg hover:scale-105 active:scale-95 transition-all border-none text-[10px] uppercase"
          >
            {loadingTopic ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
            Gerar Tema
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ÁREA DE ESCRITA (ESQUERDA) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden ring-1 ring-black/5 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-20" />
            
            <CardHeader className="bg-slate-50/30 p-6 md:p-8 border-b border-dashed border-muted/30">
              {customTheme ? (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-1">Título do Tema Livre</Label>
                  <Input 
                    value={theme} 
                    onChange={(e) => setTheme(e.target.value)} 
                    placeholder="Sobre o que vamos escrever hoje?"
                    className="h-12 rounded-xl bg-white border-none shadow-inner font-bold italic text-base text-primary focus-visible:ring-2 focus-visible:ring-accent/30"
                  />
                </div>
              ) : (
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-white border-none font-black text-[8px] px-3 py-1 uppercase tracking-widest rounded-full">ENEM MODE</Badge>
                      <span className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase">
                        <Zap className="h-2.5 w-2.5 text-accent fill-accent" /> Proposta Aurora
                      </span>
                    </div>
                    <CardTitle className="text-lg md:text-xl font-black text-primary italic leading-tight tracking-tight">
                      {theme || "Gere um tema para começar..."}
                    </CardTitle>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-muted/10 shadow-sm shrink-0 flex flex-col items-center justify-center min-w-[80px]">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Chars</p>
                    <p className={`text-xl font-black italic ${charCount < 300 ? 'text-orange-500' : 'text-primary'}`}>{charCount}</p>
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="p-0">
              <Textarea 
                placeholder="Inicie sua jornada argumentativa aqui..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loadingGrading}
                className="min-h-[450px] md:min-h-[550px] border-none p-6 md:p-10 font-medium text-base md:text-lg leading-relaxed italic resize-none focus-visible:ring-0 bg-transparent text-primary/80"
              />
              
              <div className="p-6 md:p-8 bg-white/80 backdrop-blur-md border-t border-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-primary/30">
                  <FileText className="h-4 w-4" />
                  <p className="text-[9px] font-black uppercase tracking-widest italic">Monitoramento Real-Time Ativo</p>
                </div>
                <Button 
                  onClick={handleSubmitEssay} 
                  disabled={loadingGrading || !text || !theme}
                  className="bg-primary text-white font-black h-12 px-10 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto text-base border-none group"
                >
                  {loadingGrading ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Send className="h-4 w-4 mr-3 text-accent" />}
                  {loadingGrading ? "Analisando..." : "Enviar para Aurora"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RESULTADOS COMPACTOS */}
          {result && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
              <Card className="border-none shadow-2xl bg-primary text-white rounded-[2rem] overflow-hidden relative group">
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-accent/20 rounded-full blur-[80px]" />
                <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="text-center md:text-left space-y-4">
                    <Badge className="bg-accent text-accent-foreground font-black text-[9px] px-4 py-1.5 uppercase rounded-full">DIAGNÓSTICO FINAL</Badge>
                    <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none block">{result.total_score}</h2>
                    <p className="text-sm md:text-base font-medium italic text-white/80 max-w-lg leading-relaxed">
                      "{result.general_feedback}"
                    </p>
                  </div>
                  <div className="h-32 w-32 md:h-40 md:w-40 rounded-[2.5rem] bg-white/10 flex items-center justify-center rotate-6 shadow-xl border border-white/10 backdrop-blur-md">
                    <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-accent animate-pulse" />
                  </div>
                </div>
              </Card>

              {/* RAIO-X COMPACTO */}
              <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden ring-1 ring-black/5">
                <CardHeader className="bg-slate-50/50 p-6 md:p-8 border-b border-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 shadow-inner">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg md:text-xl font-black text-primary italic leading-none">Raio-X Gramatical</CardTitle>
                      <p className="text-muted-foreground font-medium italic mt-1 text-[10px]">Detecção de desvios e sugestões de correção.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-4">
                  {result.detailed_corrections?.length > 0 ? result.detailed_corrections.map((corr: any, i: number) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-50/50 border border-muted/20 space-y-4 group hover:border-accent/30 transition-all">
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 p-4 bg-red-50/50 border border-red-100 rounded-xl text-red-700 text-xs font-medium line-through">
                          {corr.original}
                        </div>
                        <ChevronRight className="h-4 w-4 text-primary/20 rotate-90 md:rotate-0" />
                        <div className="flex-1 p-4 bg-green-50/50 border border-green-100 rounded-xl text-green-700 text-sm font-black italic">
                          {corr.suggestion}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2">
                        <Lightbulb className="h-3 w-3 text-accent" />
                        <p className="text-[10px] font-black text-primary/60 uppercase italic">
                          POR QUÊ: <span className="text-primary normal-case font-bold">{corr.reason}</span>
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 opacity-30 italic">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                      <p className="font-black uppercase text-[10px] tracking-widest">Sem desvios críticos</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* COMPETÊNCIAS GRID COMPACTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(result.competencies || {}).map(([key, comp]: any) => (
                  <Card key={key} className="border-none shadow-lg bg-white rounded-2xl p-6 group hover:border-accent/30 border border-transparent transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                      <Badge className="text-4xl font-black italic">{comp.score}</Badge>
                    </div>
                    <div className="relative z-10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-primary/40 tracking-widest">{COMPETENCY_LABELS[key]}</span>
                        <Badge className="bg-primary text-white font-black italic text-[10px] px-3 py-1 rounded-full">{comp.score} / 200</Badge>
                      </div>
                      <p className="text-xs text-primary/80 font-medium leading-relaxed italic line-clamp-3">"{comp.feedback}"</p>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-center pt-4">
                <Button onClick={() => setResult(null)} variant="outline" className="rounded-xl h-12 px-8 border-primary/20 font-black uppercase text-[10px] text-primary hover:bg-primary hover:text-white transition-all">
                  Nova Sessão de Estudo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* BARRA LATERAL (DIREITA) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* TEXTOS MOTIVADORES COMPACTOS */}
          {!result && supportingTexts.length > 0 && (
            <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden animate-in slide-in-from-right-4 ring-1 ring-black/5">
              <CardHeader className="bg-accent/5 p-6 border-b border-dashed border-accent/20">
                <CardTitle className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" /> Base Motivadora
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                {supportingTexts.map((st) => (
                  <div key={st.id} className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-muted/20 relative">
                    <p className="text-xs font-medium italic text-primary/80 leading-relaxed">"{st.content}"</p>
                    <p className="text-[8px] font-black text-muted-foreground uppercase text-right tracking-widest pt-2 border-t border-muted/10 opacity-60">Fonte: {st.source}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* CHECKLIST COMPACTO */}
          <Card className="border-none shadow-xl bg-primary text-white rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-accent/20 rounded-full blur-[40px]" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-accent shadow-lg border border-white/10">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-black text-white italic uppercase tracking-widest text-xs">Protocolo 1000</h3>
              </div>
              <div className="space-y-3">
                {[
                  "Norma culta impecável.",
                  "Tese explícita no 1º §.",
                  "Dois repertórios válidos.",
                  "Intervenção completa."
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="text-[10px] font-bold italic opacity-90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* DICAS DA AURORA COMPACTAS */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] px-4 flex items-center gap-2">
              <Zap className="h-3 w-3 text-accent fill-accent" /> Mentor Digital
            </h3>
            {ESSAY_TIPS.map((tip, i) => (
              <Card key={i} className="border-none shadow-lg bg-white rounded-2xl p-4 hover:shadow-xl transition-all cursor-default group">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl border transition-transform group-hover:scale-110 ${tip.color}`}>
                    <tip.icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-primary italic leading-none">{tip.title}</p>
                    <p className="text-[10px] text-muted-foreground font-medium italic leading-tight">{tip.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* DASHBOARD DE EVOLUÇÃO (RODAPÉ) REDUZIDO */}
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-8 md:p-12 mt-12 group relative ring-1 ring-black/5">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
          <TrendingUp className="h-64 w-64 text-primary" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-primary italic tracking-tighter">
                Evolução <span className="text-accent">Acadêmica</span>
              </h3>
            </div>
            <p className="text-muted-foreground font-medium italic text-xs max-w-md">Mapeamento histórico de consistência e refinamento técnico.</p>
          </div>
          
          <div className="flex gap-8 bg-slate-50 p-6 rounded-2xl border border-muted/10 shadow-inner">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Média</p>
              <p className="text-2xl font-black text-primary italic">785</p>
            </div>
            <div className="w-px bg-muted/20" />
            <div className="text-center">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Pico</p>
              <p className="text-2xl font-black text-accent italic">920</p>
            </div>
          </div>
        </div>
        
        <div className="h-[300px] w-full mt-4 relative z-10">
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
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900', fontStyle: 'italic' }} 
                dy={15} 
              />
              <YAxis 
                domain={[0, 1000]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} 
                dx={-5}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1.5rem', 
                  border: 'none', 
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', 
                  padding: '1rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'white'
                }} 
                itemStyle={{ fontWeight: '900', fontSize: '12px', color: 'hsl(var(--accent))' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', fontSize: '10px' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--accent))" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                dot={{ r: 6, fill: "hsl(var(--accent))", strokeWidth: 3, stroke: "#fff" }} 
                activeDot={{ r: 10, fill: "white", stroke: "hsl(var(--accent))", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center gap-3 mt-10 text-[9px] font-black text-primary/20 uppercase tracking-[0.4em] italic">
          <History className="h-4 w-4" /> Maestro Sincronizado • Rede Compromisso
        </div>
      </Card>
    </div>
  );
}