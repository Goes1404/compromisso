
-- COMPROMISSO | SMART EDUCATION - SQL DATABASE MIGRATION
-- Versão: 2.2.0 (Industrial Master Idempotent)

-- 1. GARANTIR EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  profile_type TEXT DEFAULT 'student',
  institution TEXT,
  course TEXT,
  interests TEXT,
  is_financial_aid_eligible BOOLEAN DEFAULT false,
  last_access TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE TRILHAS (Com image_url garantido)
CREATE TABLE IF NOT EXISTS public.trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  description TEXT,
  teacher_id UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  status TEXT DEFAULT 'draft',
  image_url TEXT,
  target_audience TEXT DEFAULT 'all'
);

-- Forçar a existência da coluna se a tabela já existia
ALTER TABLE public.trails ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. TABELAS DE CONTEÚDO
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
  type TEXT NOT NULL,
  url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0
);

-- 5. MENSAGENS E COMUNIDADE
CREATE TABLE IF NOT EXISTS public.forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Dúvidas',
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PROGRESSO
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
  percentage INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trail_id)
);

-- 7. SEGURANÇA (RLS - Permissão Total para Demo)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Profiles" ON public.profiles;
CREATE POLICY "Permissao Total Profiles" ON public.profiles FOR ALL USING (true);

ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Trails" ON public.trails;
CREATE POLICY "Permissao Total Trails" ON public.trails FOR ALL USING (true);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Modules" ON public.modules;
CREATE POLICY "Permissao Total Modules" ON public.modules FOR ALL USING (true);

ALTER TABLE public.learning_contents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Contents" ON public.learning_contents;
CREATE POLICY "Permissao Total Contents" ON public.learning_contents FOR ALL USING (true);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Messages" ON public.direct_messages;
CREATE POLICY "Permissao Total Messages" ON public.direct_messages FOR ALL USING (true);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Posts" ON public.forum_posts;
CREATE POLICY "Permissao Total Posts" ON public.forum_posts FOR ALL USING (true);

ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Forums" ON public.forums;
CREATE POLICY "Permissao Total Forums" ON public.forums FOR ALL USING (true);

-- 8. ATIVAÇÃO DE REALTIME (Idempotente)
DO $$
BEGIN
  -- Garantir que a publicação existe
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Adicionar tabelas se não estiverem lá
  IF NOT EXISTS (SELECT 1 FROM pg_publication_rel r JOIN pg_class c ON r.prrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_publication p ON r.prpubid = p.oid WHERE p.pubname = 'supabase_realtime' AND n.nspname = 'public' AND c.relname = 'direct_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_rel r JOIN pg_class c ON r.prrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_publication p ON r.prpubid = p.oid WHERE p.pubname = 'supabase_realtime' AND n.nspname = 'public' AND c.relname = 'forum_posts') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;';
  END IF;
END;
$$;

-- 9. DADOS DE TESTE
INSERT INTO public.profiles (id, name, email, profile_type, institution, last_access)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Prof. Ricardo (Matemática)', 'ricardo@demo.com', 'teacher', 'ETEC Jorge Street', now()),
('00000000-0000-0000-0000-000000000002', 'Dra. Helena (Mentoria ETEC)', 'helena@demo.com', 'teacher', 'Polo Industrial ABC', now())
ON CONFLICT (id) DO NOTHING;
