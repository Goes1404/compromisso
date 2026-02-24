-- COMPROMISSO | SMART EDUCATION
-- SCRIPT MESTRE DE BANCO DE DADOS (SUPABASE)
-- Versão: 2.1.0 (Agosto/2024)

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE MATÉRIAS (Banco de Questões)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TABELA DE QUESTÕES (Simulados)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    year INTEGER,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    correct_answer TEXT NOT NULL DEFAULT 'A',
    options JSONB NOT NULL DEFAULT '[]',
    teacher_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TABELA DE LIVES (Agenda de Mentoria)
CREATE TABLE IF NOT EXISTS public.lives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meet_link TEXT,
    teacher_id UUID REFERENCES auth.users(id),
    teacher_name TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TABELA DE FÓRUNS
CREATE TABLE IF NOT EXISTS public.forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Geral',
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. TABELA DE CHAT DIRETO (Mensagens em tempo real)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. TABELA DE ACERVO (Biblioteca Digital)
CREATE TABLE IF NOT EXISTS public.library_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT CHECK (type IN ('PDF', 'Video', 'E-book', 'Artigo')),
    url TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. FUNÇÕES RPC (Lógica de Simulados)
CREATE OR REPLACE FUNCTION get_subjects_with_question_count()
RETURNS TABLE (id UUID, name TEXT, question_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, COUNT(q.id) as question_count
    FROM public.subjects s
    LEFT JOIN public.questions q ON s.id = q.subject_id
    GROUP BY s.id, s.name
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_random_questions_for_subject(p_subject_id UUID, p_limit INTEGER)
RETURNS TABLE (
    id UUID, 
    question_text TEXT, 
    year INTEGER, 
    correct_answer TEXT, 
    options JSONB,
    subjects JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id, 
        q.question_text, 
        q.year, 
        q.correct_answer, 
        q.options,
        json_build_object('name', s.name)::jsonb as subjects
    FROM public.questions q
    JOIN public.subjects s ON q.subject_id = s.id
    WHERE q.subject_id = p_subject_id
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 9. DADOS INICIAIS (Matérias)
INSERT INTO public.subjects (name) VALUES 
('Matemática'), ('Física'), ('Química'), ('Biologia'), ('Português'), ('História'), ('Geografia')
ON CONFLICT (name) DO NOTHING;

-- 10. SEGURANÇA (RLS)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura Pública Autenticada" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura Pública Autenticada" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestão Questões Professor" ON public.questions FOR ALL TO authenticated USING (true);
CREATE POLICY "Leitura Pública Autenticada" ON public.lives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestão Lives Professor" ON public.lives FOR ALL TO authenticated USING (true);
CREATE POLICY "Leitura Pública Autenticada" ON public.forums FOR SELECT TO authenticated USING (true);
CREATE POLICY "Interação Fórum" ON public.forums FOR ALL TO authenticated USING (true);
CREATE POLICY "Interação Posts Fórum" ON public.forum_posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Chat Mensagens" ON public.direct_messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Leitura Biblioteca" ON public.library_resources FOR SELECT TO authenticated USING (true);

-- 11. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';