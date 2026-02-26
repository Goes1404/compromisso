
-- ==========================================================
-- SCRIPT DE SINCRONIZAÇÃO: HISTÓRICO E PROGRESSO
-- Execute este bloco no SQL Editor do Supabase
-- ==========================================================

-- 1. Garante que a tabela de trilhas tenha a estrutura correta
CREATE TABLE IF NOT EXISTS public.trails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    teacher_id UUID,
    teacher_name TEXT,
    status TEXT DEFAULT 'draft',
    image_url TEXT,
    target_audience TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Cria/Corrige a tabela de progresso com a Chave Estrangeira (CRÍTICO)
-- A relação REFERENCES public.trails(id) é o que permite o "Join" no front-end
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
    percentage INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, trail_id)
);

-- 3. Índice de performance para o histórico (deixa o carregamento instantâneo)
CREATE INDEX IF NOT EXISTS idx_user_progress_last_accessed ON public.user_progress(last_accessed DESC);

-- 4. Habilitar RLS (Segurança)
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso Total (Modo Desenvolvimento/Protótipo)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow all on user_progress" ON public.user_progress;
    DROP POLICY IF EXISTS "Allow all on trails" ON public.trails;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Allow all on user_progress" ON public.user_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on trails" ON public.trails FOR ALL USING (true) WITH CHECK (true);

-- 6. Dados de Teste (Caso sua tabela esteja vazia)
INSERT INTO public.trails (title, category, description, status, image_url)
VALUES 
('Cálculo I: Limites e Derivadas', 'Matemática', 'Domine os fundamentos do cálculo diferencial.', 'active', 'https://picsum.photos/seed/math1/800/600'),
('Redação Nota 1000', 'Linguagens', 'Técnicas avançadas de argumentação para o ENEM.', 'active', 'https://picsum.photos/seed/essay1/800/600'),
('Física: Leis de Newton', 'Física', 'Aprenda a mecânica clássica de forma prática.', 'active', 'https://picsum.photos/seed/phys1/800/600')
ON CONFLICT DO NOTHING;
