
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileCheck, 
  ExternalLink, 
  Cloud, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  Info,
  Smartphone,
  MousePointer2,
  FolderPlus,
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/app/lib/supabase";

const DOCUMENT_GROUPS = [
  {
    title: "Documentos Pessoais",
    items: [
      { id: "rg", label: "RG (Frente e Verso)" },
      { id: "cpf", label: "CPF ou CNH" },
      { id: "birth_cert", label: "Certidão de Nascimento ou Casamento" },
      { id: "voter_id", label: "Título de Eleitor" },
      { id: "military", label: "Reservista (Para homens)" },
      { id: "address", label: "Comprovante de Residência atualizado" }
    ]
  },
  {
    title: "Escolares (FATEC/ETEC/SiSU)",
    items: [
      { id: "hs_transcript", label: "Histórico Escolar do Ensino Médio" },
      { id: "hs_diploma", label: "Certificado de Conclusão do Ensino Médio" },
      { id: "photo_3x4", label: "Foto 3x4 digitalizada" }
    ]
  },
  {
    title: "Socioeconômicos (ProUni/Cotas)",
    items: [
      { id: "income_all", label: "Comprovantes de Renda de todos os moradores" },
      { id: "cadunico", label: "Comprovante de Inscrição no CadÚnico (Se houver)" },
      { id: "tax_return", label: "Declaração de IR (Se houver)" }
    ]
  }
];

export default function StudentDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    async function loadProgress() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('student_checklists')
          .select('item_id')
          .eq('user_id', user.id);
        
        if (!error && data) {
          setCheckedItems(data.map(d => d.item_id));
        }
      } catch (e) {
        console.error("Erro ao carregar checklist:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, [user]);

  const toggleItem = async (itemId: string) => {
    if (!user || saving) return;
    
    const isChecked = checkedItems.includes(itemId);
    const newItems = isChecked 
      ? checkedItems.filter(i => i !== itemId)
      : [...checkedItems, itemId];
    
    setCheckedItems(newItems);
    setSaving(true);

    try {
      if (isChecked) {
        await supabase.from('student_checklists').delete().match({ user_id: user.id, item_id: itemId });
      } else {
        await supabase.from('student_checklists').insert({ user_id: user.id, item_id: itemId });
      }
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalItems = DOCUMENT_GROUPS.reduce((acc, group) => acc + group.items.length, 0);
  const completedCount = checkedItems.length;
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-accent" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Documentação...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary italic leading-none">Checklist de Ingresso</h1>
          <p className="text-muted-foreground font-medium italic">Prepare-se para o ProUni, SiSU, FATEC e ETEC.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex justify-between w-40 text-[10px] font-black uppercase text-primary/40">
            <span>Seu Progresso</span>
            <span className="text-accent italic">{progressPercent}%</span>
          </div>
          <div className="h-2 w-40 bg-muted rounded-full overflow-hidden border">
            <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {DOCUMENT_GROUPS.map((group, idx) => (
            <Card key={idx} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-muted/10 p-8">
                <CardTitle className="text-lg font-black text-primary italic uppercase tracking-tight flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-all text-xs">
                    {idx + 1}
                  </div>
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {group.items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      checkedItems.includes(item.id) 
                        ? 'bg-green-50/50 border-green-200' 
                        : 'bg-white border-transparent hover:border-muted/20'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <Checkbox 
                      checked={checkedItems.includes(item.id)} 
                      onCheckedChange={() => toggleItem(item.id)}
                      className="h-6 w-6 rounded-lg border-2"
                    />
                    <span className={`text-sm font-bold italic transition-colors ${
                      checkedItems.includes(item.id) ? 'text-green-700' : 'text-primary'
                    }`}>
                      {item.label}
                    </span>
                    {checkedItems.includes(item.id) && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-primary text-white rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
            <CardHeader className="p-8 pb-4 relative z-10">
              <div className="h-14 w-14 rounded-3xl bg-white/10 flex items-center justify-center mb-6 shadow-xl"><Cloud className="h-8 w-8 text-accent" /></div>
              <CardTitle className="text-2xl font-black italic">Nuvem de Documentos</CardTitle>
              <CardDescription className="text-white/60 font-medium">Organize tudo no Google Drive para não perder nada.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6 relative z-10">
              <div className="space-y-4">
                {[
                  { icon: MousePointer2, text: "Acesse drive.google.com" },
                  { icon: FolderPlus, text: 'Clique em "Novo" > "Pasta"' },
                  { icon: FileCheck, text: 'Nomeie: "Documentos Ingressso"' },
                  { icon: Smartphone, text: 'Use o app "Google Drive" para escanear com a câmera' }
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-all">
                    <step.icon className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-xs font-bold italic opacity-90 leading-tight">{step.text}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full h-14 bg-accent text-accent-foreground font-black text-xs uppercase rounded-2xl shadow-xl shadow-accent/20 hover:scale-105 transition-all">
                <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer">
                  ABRIR MEU GOOGLE DRIVE
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white rounded-[2rem] p-8 space-y-4">
            <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-accent" /> Dica de Segurança
            </h3>
            <p className="text-xs font-medium italic text-primary/70 leading-relaxed">
              "Nunca mande seus documentos originais pelo chat. Salve no seu Drive e use apenas em plataformas oficiais de matrícula."
            </p>
            <div className="pt-4 border-t border-muted/10">
              <div className="flex items-center gap-2 text-primary/40">
                <Info className="h-3 w-3" />
                <span className="text-[9px] font-bold uppercase tracking-tighter italic">Totalmente Offline e Privado</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
