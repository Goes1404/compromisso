
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Camera, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  Palette,
  Lock,
  Star,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/app/lib/supabase";

const PRESET_AVATARS = [
  "https://picsum.photos/seed/user1/200/200",
  "https://picsum.photos/seed/user2/200/200",
  "https://picsum.photos/seed/user3/200/200",
  "https://picsum.photos/seed/user4/200/200",
  "https://picsum.photos/seed/user5/200/200",
  "https://picsum.photos/seed/user6/200/200",
];

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    avatar_url: "",
    favorite_subject: ""
  });

  useEffect(() => {
    async function fetchSubjects() {
      setLoadingSubjects(true);
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setSubjects(data || []);
      } catch (e) {
        console.error("Erro ao carregar matérias:", e);
      } finally {
        setLoadingSubjects(false);
      }
    }

    fetchSubjects();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        avatar_url: profile.avatar_url || "",
        favorite_subject: profile.favorite_subject || ""
      });
    }
  }, [profile]);

  const isNameDisabled = (profile?.name_changes_count ?? 0) >= 1;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isUpdating) return;

    setIsUpdating(true);
    try {
      const isNameChanged = formData.name !== profile?.name;
      
      const updateData: any = {
        avatar_url: formData.avatar_url,
        favorite_subject: formData.favorite_subject,
        updated_at: new Date().toISOString()
      };

      if (isNameChanged && !isNameDisabled) {
        updateData.name = formData.name;
        updateData.name_changes_count = (profile?.name_changes_count ?? 0) + 1;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil Atualizado! ✅",
        description: "Suas preferências foram sincronizadas com a rede."
      });
    } catch (err: any) {
      toast({ title: "Erro na Atualização", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast({ title: "Foto carregada! 📸" });
    } catch (err: any) {
      toast({ title: "Falha no Upload", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-2 md:px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary italic leading-none">Configurações</h1>
          <p className="text-muted-foreground font-medium">Personalize sua identidade e preferências acadêmicas.</p>
        </div>
        <Badge className="bg-accent/10 text-accent font-black border-none px-4 py-2 flex items-center gap-2 w-fit rounded-xl">
          <ShieldCheck className="h-4 w-4" /> CONTA VALIDADA
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Visual */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden text-center p-8 flex flex-col items-center">
            <div className="relative group mb-6">
              <div className="h-40 w-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={formData.avatar_url || `https://picsum.photos/seed/${user.id}/400/400`} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white text-5xl font-black">{formData.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading} 
                className="absolute -bottom-2 -right-2 h-12 w-12 bg-accent rounded-2xl border-4 border-white flex items-center justify-center text-accent-foreground shadow-xl hover:scale-110 active:scale-95 transition-all"
                title="Trocar Foto"
              >
                <Camera className="h-6 w-6" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-primary italic leading-none truncate max-w-[200px]">{formData.name || "Usuário"}</h3>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{profile?.profile_type?.replace('_', ' ')}</p>
            </div>
          </Card>

          <Card className="border-none shadow-xl bg-primary text-white rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-widest">Insight do Sistema</h4>
              </div>
              <p className="text-sm font-medium italic opacity-80 leading-relaxed">
                "Manter sua foto atualizada ajuda os mentores a reconhecerem você mais rápido nas sessões ao vivo."
              </p>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-accent/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
          </Card>
        </div>

        {/* Coluna Formulário */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/5 p-10 border-b border-dashed">
              <CardTitle className="text-2xl font-black text-primary italic">Dados Cadastrais</CardTitle>
              <CardDescription className="font-medium italic">As alterações de nome são limitadas por segurança.</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 px-2 flex items-center gap-2">
                      <User className="h-3 w-3" /> Nome de Exibição
                    </Label>
                    <div className="relative">
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        disabled={isNameDisabled} 
                        className={`h-14 rounded-2xl border-none font-bold text-lg italic ${isNameDisabled ? 'bg-muted/20 opacity-50' : 'bg-muted/30 shadow-inner focus:ring-accent'}`} 
                      />
                      {isNameDisabled && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/20" />}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 px-2 flex items-center gap-2">
                      <Star className="h-3 w-3" /> Matéria Foco
                    </Label>
                    <Select value={formData.favorite_subject} onValueChange={(v) => setFormData({...formData, favorite_subject: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none font-bold italic shadow-inner">
                        {loadingSubjects ? (
                          <div className="flex items-center gap-2"><RefreshCw className="h-3 w-3 animate-spin" /> Sincronizando...</div>
                        ) : (
                          <SelectValue placeholder="Selecione sua matéria" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl max-h-60">
                        {subjects.map(s => <SelectItem key={s.id} value={s.name} className="font-bold py-3">{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 px-2 flex items-center gap-2">
                    <Palette className="h-3 w-3" /> Galeria de Avatares Rápidos
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {PRESET_AVATARS.map((url, i) => (
                      <button 
                        key={i} 
                        type="button" 
                        onClick={() => setFormData({...formData, avatar_url: url})} 
                        className={`relative rounded-2xl overflow-hidden aspect-square border-4 transition-all hover:scale-105 active:scale-95 ${formData.avatar_url === url ? 'border-accent shadow-xl scale-110' : 'border-transparent opacity-60'}`}
                      >
                        <Avatar className="w-full h-full rounded-none"><AvatarImage src={url} className="object-cover" /></Avatar>
                        {formData.avatar_url === url && (
                          <div className="absolute inset-0 bg-accent/20 flex items-center justify-center animate-in zoom-in duration-300">
                            <CheckCircle2 className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={isUpdating} className="w-full h-16 bg-primary text-white font-black text-lg rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4">
                  {isUpdating ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <CheckCircle2 className="h-6 w-6 mr-2 text-accent" />}
                  Salvar Preferências
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
