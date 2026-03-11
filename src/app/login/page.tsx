"use client";

import { LoginForm } from "@/app/login/LoginForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-blue-gradient">
      {/* Botão de Voltar para a Home */}
      <div className="absolute top-6 left-6 z-50">
        <Button asChild variant="ghost" className="text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-[0.3em] gap-2 rounded-xl transition-all active:scale-95">
          <Link href="/">
            <ChevronLeft className="h-4 w-4 text-accent" />
            Voltar ao Início
          </Link>
        </Button>
      </div>

      <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Centro_Hist%C3%B3rico_de_Santana_de_Parna%C3%ADba_-_SP.jpg/1280px-Centro_Hist%C3%B3rico_de_Santana_de_Parna%C3%ADba_-_SP.jpg')] bg-cover bg-center grayscale opacity-10"></div>
      
      <LoginForm />
    </div>
  );
}
