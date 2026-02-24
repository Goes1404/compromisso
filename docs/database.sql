/**
 * MASTER DATABASE SCRIPT - COMPROMISSO
 * Este script deve ser executado no SQL Editor do Supabase.
 * Ele configura todas as tabelas, permissões e funções necessárias.
 */

-- 1. TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_type TEXT CHECK (profile_type IN ('etec', 'uni', 'teacher', 'admin')),
    institution TEXT,
    course TEXT,
    interests TEXT,
    avatar_url TEXT,
    name_changes_count INTEGER DEFAULT 0,
    is_financial_aid_eligible BOOLEAN DEFAULT FALSE,
    last_access TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. ESTRUTURA DE TRILHAS
CREATE TABLE IF NOT EXISTS public.trails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES auth.users(id),
    teacher_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'active')),
    image_url TEXT,
    target_audience TEXT DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- video, pdf, quiz, text, file
    url TEXT,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. BANCO DE QUESTÕES E MATÉRIAS
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    year INTEGER,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id),
    correct_answer TEXT,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. LIVES E AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.lives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id),
    teacher_name TEXT,
    meet_link TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. COMUNIDADE (FÓRUM)
CREATE TABLE IF NOT EXISTS public.forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
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

-- 6. CHAT DIRETO
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. PROGRESSO DO USUÁRIO
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
    percentage INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, trail_id)
);

-- 8. BIBLIOTECA
CREATE TABLE IF NOT EXISTS public.library_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT,
    url TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- INSERIR MATÉRIAS BASE
INSERT INTO public.subjects (name) VALUES 
('Matemática'), ('Física'), ('Química'), ('Biologia'), ('Português'), ('História'), ('Geografia')
ON CONFLICT (name) DO NOTHING;

-- FUNÇÕES RPC (PARA SIMULADOS)
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

-- POLÍTICAS DE SEGURANÇA (RLS - MODO LIBERAL PARA DEMO)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Perfis" ON public.profiles FOR ALL USING (true);

ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Trilhas" ON public.trails FOR ALL USING (true);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Módulos" ON public.modules FOR ALL USING (true);

ALTER TABLE public.learning_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Conteúdos" ON public.learning_contents FOR ALL USING (true);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Matérias" ON public.subjects FOR ALL USING (true);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Questões" ON public.questions FOR ALL USING (true);

ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Lives" ON public.lives FOR ALL USING (true);

ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Forums" ON public.forums FOR ALL USING (true);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Posts" ON public.forum_posts FOR ALL USING (true);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Chat" ON public.direct_messages FOR ALL USING (true);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Progresso" ON public.user_progress FOR ALL USING (true);

ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissão Total Biblioteca" ON public.library_resources FOR ALL USING (true);

-- ATUALIZAR CACHE DE ESQUEMA
NOTIFY pgrst, 'reload schema';