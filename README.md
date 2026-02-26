
# Compromisso | Smart Education

*Tecnologia a serviço da aprovação.*

---

## ✨ Status Atual (CONSOLIDAÇÃO PREMIUM)

O projeto está **ESTÁVEL, OTIMIZADO e SINCRONIZADO**. Implementamos uma interface de alta fidelidade focada em performance e experiência do usuário (UX).

---

## 🚀 Novas Funcionalidades (Últimas Atualizações)
- **Cards Premium na Home**: Substituição da lista simples por cards verticais compactos com imagens, badges de categoria e progresso real.
- **Sistema de Fixação de Trilhas**: Botão "Salvar no Dashboard" dentro da Sala de Aula para controle manual do histórico de estudos.
- **Otimização Mobile Total**: Ajustes finos nas telas de Trilhas e Sala de Aula para garantir uma experiência perfeita em celulares.
- **Sincronização Resiliente**: Lógica de busca no Supabase aprimorada para lidar com relacionamentos de dados de forma robusta.

---

## 🎯 Configuração do Banco de Dados (Supabase)

Para garantir que o histórico de trilhas ("Continuar Aprendizado") funcione, é **obrigatório** rodar o script de relacionamento no Supabase:

1. Acesse o **SQL Editor**.
2. Execute o código:
   ```sql
   CREATE TABLE IF NOT EXISTS public.user_progress (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       trail_id UUID NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
       percentage INTEGER DEFAULT 0,
       last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
       UNIQUE(user_id, trail_id)
   );
   ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Acesso Total" ON public.user_progress FOR ALL USING (true);
   ```

---

## 🛠️ Arquitetura
- **Next.js 15**: Rotas dinâmicas e hidratação estável.
- **Supabase**: Auth, PostgreSQL e Real-time.
- **Genkit**: Suporte pedagógico via Aurora IA.
- **Shadcn UI + Tailwind**: Design industrial de alta fidelidade.
