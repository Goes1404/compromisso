"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { Loader2 } from "lucide-react";

/**
 * Raiz do Dashboard: Redireciona o usuário para a Home correta
 * baseada no seu papel (Role) após a hidratação.
 */
export default function DashboardRoot() {
  const { userRole, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
        return;
      }

      // Redirecionamento por Papel
      if (userRole === 'admin') {
        router.replace("/dashboard/admin/home");
      } else if (userRole === 'teacher') {
        router.replace("/dashboard/teacher/home");
      } else {
        router.replace("/dashboard/home");
      }
    }
  }, [userRole, loading, user, router]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-primary gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-accent" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Sincronizando Perfil...</p>
    </div>
  );
}