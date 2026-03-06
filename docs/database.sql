
-- SCHEMA COMPLETO COMPROMISSO | SMART EDUCATION
-- Versão: 3.0.0 (Industrial)

-- 1. TABELA DE PERFIS (Extensão do Auth.Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  profile_type TEXT DEFAULT 'student', -- 'student', 'teacher', 'admin', 'etec', 'enem', 'cpop_santana', 'cpop_osasco'
  institution TEXT,
  course TEXT,
  favorite_subject TEXT,
  interests TEXT,
  name_changes_count INTEGER DEFAULT 0,
  is_financial_aid_eligible BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- 'active', 'suspended'
  last_access TIMESTAMPTZ DEFAULT NOW(),
  class_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE TURMAS (CLASSES)
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coordinator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BANCO DE QUESTÕES
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Formato: [{"key": "A", "text": "..."}, ...]
  correct_answer TEXT NOT NULL, -- 'A', 'B', 'C', 'D', 'E'
  explanation TEXT,
  year INTEGER DEFAULT 2024,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRILHAS DE APRENDIZAGEM
CREATE TABLE IF NOT EXISTS public.trails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  teacher_name TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'published', 'review'
  target_audience TEXT DEFAULT 'all',
  average_rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'video', -- 'video', 'pdf', 'quiz', 'text', 'file'
  url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROGRESSO E SIMULADOS
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
  percentage INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trail_id)
);

CREATE TABLE IF NOT EXISTS public.simulation_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMUNICAÇÃO E COMUNIDADE
CREATE TABLE IF NOT EXISTS public.forums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Geral',
  author_id UUID REFERENCES public.profiles(id),
  author_name TEXT,
  is_teacher_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  target_group TEXT DEFAULT 'all',
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LIVES E TRANSMISSÕES
CREATE TABLE IF NOT EXISTS public.lives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  meet_link TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished'
  teacher_id UUID REFERENCES public.profiles(id),
  teacher_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDITORIA E DOCUMENTOS
CREATE TABLE IF NOT EXISTS public.student_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FUNÇÕES INTELIGENTES (RPC)

-- Função para buscar questões aleatórias por matéria
CREATE OR REPLACE FUNCTION get_random_questions_for_subject(p_subject_id UUID, p_limit INTEGER)
RETURNS SETOF questions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM questions
  WHERE subject_id = p_subject_id
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Função para dashboard de questões
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

-- 10. POLÍTICAS DE SEGURANÇA (RLS - Modo Facilitado para MVP)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total perfis" ON public.profiles FOR ALL USING (true);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total materias" ON public.subjects FOR ALL USING (true);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total questões" ON public.questions FOR ALL USING (true);

-- (Repetir habilitação de RLS para outras tabelas conforme necessário)

-- 11. INSERÇÃO DE DADOS INICIAIS (SEED)
INSERT INTO public.subjects (name) VALUES 
('Matemática'), ('Física'), ('Química'), ('Biologia'), 
('Linguagens'), ('História'), ('Geografia'), ('Redação'), ('Filosofia'), ('Sociologia')
ON CONFLICT (name) DO NOTHING;
