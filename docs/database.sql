-- SCRIPT DE CONFIGURAÇÃO MESTRE - COMPROMISSO SMART EDUCATION
-- Cole este código no SQL Editor do seu Supabase e clique em RUN.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS (Sincronizada com o Cadastro)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  username TEXT UNIQUE,
  profile_type TEXT, -- 'etec', 'uni', 'teacher', 'admin', etc.
  institution TEXT,
  course TEXT,
  favorite_subject TEXT,
  interests TEXT,
  is_financial_aid_eligible BOOLEAN DEFAULT FALSE,
  last_access TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active' ou 'suspended'
  avatar_url TEXT,
  name_changes_count INTEGER DEFAULT 0,
  class_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BANCO DE QUESTÕES E SIMULADOS
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Formato: [{"key": "A", "text": "..."}, ...]
  correct_answer TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  year INTEGER DEFAULT 2024,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.simulation_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ECOSSISTEMA DE COMUNIDADE (Fóruns e Avisos)
CREATE TABLE IF NOT EXISTS public.forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Geral',
  author_id UUID REFERENCES public.profiles(id),
  author_name TEXT,
  is_teacher_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  target_group TEXT DEFAULT 'all',
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRILHAS DE APRENDIZAGEM
CREATE TABLE IF NOT EXISTS public.trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  teacher_name TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'published'
  image_url TEXT,
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.learning_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT, -- 'video', 'pdf', 'quiz', 'text'
  url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0
);

-- 6. GESTÃO E LIVES
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  coordinator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  meet_link TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  teacher_name TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
  percentage INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trail_id)
);

-- 7. FUNÇÕES RPC (Motores do App)

-- Função para pegar questões aleatórias
CREATE OR REPLACE FUNCTION get_random_questions_for_subject(p_subject_id UUID, p_limit INTEGER)
RETURNS SETOF questions AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM questions
  WHERE subject_id = p_subject_id
  ORDER BY random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Função para dashboard de matérias
CREATE OR REPLACE FUNCTION get_subjects_with_question_count()
RETURNS TABLE (id UUID, name TEXT, question_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, COUNT(q.id) as question_count
  FROM subjects s
  LEFT JOIN questions q ON s.id = q.subject_id
  GROUP BY s.id, s.name
  ORDER BY s.name ASC;
END;
$$ LANGUAGE plpgsql;

-- 8. PERMISSÕES BÁSICAS (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso Público Perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Inserção Pública Perfis" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Próprio Perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Gestão Subjects" ON public.subjects FOR ALL USING (true);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Gestão Questions" ON public.questions FOR ALL USING (true);

ALTER TABLE public.simulation_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Simulados Usuário" ON public.simulation_attempts FOR ALL USING (true);

ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Forums" ON public.forums FOR SELECT USING (true);
CREATE POLICY "Escrita Pública Forums" ON public.forums FOR INSERT WITH CHECK (true);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Escrita Pública Posts" ON public.forum_posts FOR INSERT WITH CHECK (true);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Avisos" ON public.announcements FOR SELECT USING (true);

ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Trilhas" ON public.trails FOR SELECT USING (true);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Módulos" ON public.modules FOR SELECT USING (true);

ALTER TABLE public.learning_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Conteúdos" ON public.learning_contents FOR SELECT USING (true);

ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Lives" ON public.lives FOR SELECT USING (true);

ALTER TABLE public.student_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checklist Usuário" ON public.student_checklists FOR ALL USING (true);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Progresso Usuário" ON public.user_progress FOR ALL USING (true);

-- INSERIR MATÉRIAS PADRÃO
INSERT INTO public.subjects (name) VALUES 
('Matemática'), ('Física'), ('Química'), ('Biologia'), 
('Linguagens'), ('História'), ('Geografia'), ('Redação'),
('Não Categorizado') ON CONFLICT DO NOTHING;
