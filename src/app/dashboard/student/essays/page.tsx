"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  BookOpen, 
  Send, 
  Loader2, 
  CheckCircle2, 
  FileText,
  TrendingUp,
  Type,
  ChevronRight,
  Eraser,
  PenTool
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentEssayPage() {
  const { toast } = useToast();
  const [theme, setTheme] = useState("");
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
    try {
      const res = await fetch('/api/genkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowId: 'essayTopicGenerator', input: {} })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setTheme(data.result.title);
        toast({ title: "Novo Tema Gerado!", description: "A Aurora selecionou um desafio estratégico para você." });
      } else {
        console.error("Debug Aurora API (Tema):", data);
        throw new Error(data.error || "Erro na conexão com o motor de temas.");
      }
    } catch (e: any) {
      console.error("ERRO TEMA:", e);
      toast({ title: "Aurora Recalibrando", description: e.message, variant: "destructive" });
    } finally {
      setLoadingTopic(false);
    }
  };

  const handleSubmitEssay = async () => {
    if (text.length < 300) {
      toast({ title: "Texto muito curto", description: "Escreva pelo menos 300 caracteres para uma análise válida.", variant: "destructive" });
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
        toast({ title: "Correção Finalizada!", description: "Sua análise detalhada já está disponível." });
      } else {
        console.error("Debug Aurora API (Correção):", data);
        throw new Error(data.error || "Falha na análise da Aurora.");
      }
    } catch (e: any) {
      console.error("ERRO CORREÇÃO:", e);
      toast({ title: "Erro na Correção", description: e.message, variant: "destructive" });
    } finally {
      setLoadingGrading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-2 md:px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-black text-primary italic tracking-tighter">Laboratório de Redação</h1>
            <Badge className="bg-accent text-accent-foreground font-black px-3 py-1 shadow-lg animate-pulse hidden sm:flex border-none">OFICIAL</Badge>
          </div>
          <p className="text-muted-foreground font-medium text-sm md:text-lg italic max-w-2xl">
            Ambiente industrial para o nota 1000. Use a inteligência da Aurora para evoluir seu texto.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => { setText(""); setTheme(""); setResult(null); }}
            className="rounded-xl h-14 border-dashed border-primary/20 text-primary font-black"
          >
            <Eraser className="h-4 w-4 mr-2" /> Limpar
          </Button>
          <Button 
            onClick={handleGenerateTopic} 
            disabled={loadingTopic || loadingGrading}
            className="rounded-xl h-14 bg-accent text-accent-foreground font-black px-8 shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {loadingTopic ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
            Sugerir Tema
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`space-y-6 transition-all duration-500 ${result ? 'lg:col-span-7' : 'lg:col-span-8'}`}>
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 md:p-8 border-b border-dashed">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <Badge className="bg-primary text-white border-none font-black text-[8px] px-3 py-1 uppercase tracking-widest">Tema da Rodada</Badge>
                  <CardTitle className="text-xl md:text-2xl font-black text-primary italic leading-tight">
                    {theme || "Gere um tema para iniciar o laboratório..."}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border shadow-inner shrink-0">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Caracteres</p>
                    <p className={`text-lg font-black italic ${charCount < 300 ? 'text-orange-500' : 'text-green-600'}`}>
                      {charCount}
                    </p>
                  </div>
                  <PenTool className={`h-5 w-5 ${charCount < 300 ? 'text-muted-foreground/30' : 'text-green-500'}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Textarea 
                placeholder="Desenvolva sua tese, argumentos e proposta de intervenção aqui..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loadingGrading}
                className="min-h-[450px] md:min-h-[550px] border-none p-8 md:p-10 font-medium text-base md:text-lg leading-relaxed italic resize-none focus-visible:ring-0 bg-transparent text-primary/90"
              />
              <div className="p-6 md:p-8 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[9px] font-black text-primary/30 uppercase tracking-widest italic text-center sm:text-left">
                  Escreva pelo menos 300 caracteres para uma correção de alta fidelidade.
                </p>
                <Button 
                  onClick={handleSubmitEssay} 
                  disabled={loadingGrading || !text || !theme}
                  className="bg-primary text-white font-black h-14 px-10 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all border-none w-full sm:w-auto"
                >
                  {loadingGrading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Send className="h-5 w-5 mr-3 text-accent" />}
                  {loadingGrading ? "Aurora Analisando..." : "Submeter para Correção"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`space-y-6 transition-all duration-500 ${result ? 'lg:col-span-5' : 'lg:col-span-4'}`}>
          {!result ? (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <Card className="border-none shadow-xl bg-primary text-white rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-accent shadow-inner"><BookOpen className="h-6 w-6" /></div>
                    <h3 className="font-black text-white italic uppercase tracking-widest text-sm">Diretrizes da Banca</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      "Mínimo de 7 linhas escritas.",
                      "Domínio da norma culta formal.",
                      "Argumentação baseada em fatos.",
                      "Proposta de intervenção clara."
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                        <span className="text-xs font-bold italic opacity-80">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] p-8 space-y-4">
                <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" /> Insights Aurora
                </h3>
                <p className="text-xs font-medium italic text-primary/70 leading-relaxed">
                  "A redação é o pilar da sua aprovação. Foque em repertórios socioculturais pertinentes para elevar sua nota na competência 2."
                </p>
              </Card>
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <Card className="border-none shadow-2xl bg-primary text-white rounded-[3rem] p-8 text-center relative overflow-hidden border-b-8 border-accent">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
                <div className="relative z-10 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Nota Final Aurora</p>
                  <h2 className="text-7xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-2xl">{result.total_score}</h2>
                  <div className="h-1 w-20 bg-accent/30 mx-auto rounded-full" />
                  <p className="text-xs md:text-sm font-medium italic text-white/80 pt-4 leading-relaxed line-clamp-4">"{result.general_feedback}"</p>
                </div>
              </Card>

              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] p-8 space-y-6">
                <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
                  <Type className="h-4 w-4 text-accent" /> Competências Detalhadas
                </h3>
                <div className="space-y-5">
                  {Object.entries(result.competencies).map(([key, comp]: [string, any], idx) => (
                    <div key={key} className="space-y-2 group">
                      <div className="flex justify-between text-[9px] font-black uppercase">
                        <span className="text-primary/60">Competência {idx + 1}</span>
                        <span className="text-accent">{comp.score}/200</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${(comp.score / 200) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium italic leading-tight line-clamp-2">{comp.feedback}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-none shadow-xl bg-green-50 rounded-[2.5rem] p-8 space-y-6">
                <h3 className="text-[10px] font-black text-green-800 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Plano de Evolução
                </h3>
                <div className="space-y-3">
                  {result.suggestions.map((sug: string, i: number) => (
                    <div key={i} className="flex gap-3 bg-white/50 p-3 rounded-xl border border-green-100">
                      <ChevronRight className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold italic text-green-900 leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </Card>
              
              <Button onClick={() => setResult(null)} variant="outline" className="w-full h-14 rounded-2xl border-dashed font-black text-primary hover:bg-primary/5 uppercase text-xs">
                Reiniciar Estúdio
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
