
-- SCRIPT DE MIGRACAO MESTRE - COMPROMISSO | EDUCORI
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. EXTENSÕES E SEGURANÇA BÁSICA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PERFIS DE USUÁRIOS (PROFILES)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  profile_type TEXT DEFAULT 'student', -- student, teacher, admin
  institution TEXT,
  course TEXT,
  is_financial_aid_eligible BOOLEAN DEFAULT false,
  last_access TIMESTAMPTZ DEFAULT now(),
  interests TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Perfis visíveis por todos logados" ON profiles;
CREATE POLICY "Perfis visíveis por todos logados" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Usuários editam próprio perfil" ON profiles;
CREATE POLICY "Usuários editam próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. TRILHAS E CONTEÚDO
CREATE TABLE IF NOT EXISTS trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  description TEXT,
  teacher_id UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  status TEXT DEFAULT 'draft', -- draft, review, active
  image_url TEXT,
  target_audience TEXT DEFAULT 'all'
);

ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de trilhas" ON trails FOR SELECT USING (true);
CREATE POLICY "Escrita total para professores" ON trails FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público módulos" ON modules FOR SELECT USING (true);
CREATE POLICY "Gestão total módulos" ON modules FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS learning_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- video, pdf, quiz, text
  url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0
);

ALTER TABLE learning_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público conteúdos" ON learning_contents FOR SELECT USING (true);
CREATE POLICY "Gestão total conteúdos" ON learning_contents FOR ALL USING (true);

-- 4. COMUNIDADE E DEBATES (FORUM)
CREATE TABLE IF NOT EXISTS forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Dúvidas',
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT
);

ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total fórum" ON forums FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  content TEXT NOT NULL
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total posts" ON forum_posts FOR ALL USING (auth.role() = 'authenticated');

-- 5. MENSAGENS DIRETAS (CHAT)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver próprias mensagens" ON direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Enviar mensagens" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 6. LIVES E MENSAGENS DE LIVE
CREATE TABLE IF NOT EXISTS lives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  teacher_id UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  status TEXT DEFAULT 'scheduled' -- scheduled, live, finished
);

ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso público lives" ON lives FOR SELECT USING (true);
CREATE POLICY "Gestão total lives" ON lives FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS live_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  live_id UUID REFERENCES lives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  content TEXT NOT NULL,
  is_question BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false
);

ALTER TABLE live_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total live_msgs" ON live_messages FOR ALL USING (auth.role() = 'authenticated');

-- 7. PROGRESSO
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  percentage INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trail_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total progresso" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- 8. HABILITAR REALTIME
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;

-- 9. SEED: MENTORES DEMO
INSERT INTO profiles (id, name, email, profile_type, institution, last_access)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Prof. Ricardo (Matemática)', 'ricardo@demo.com', 'teacher', 'ETEC Jorge Street', now()),
('00000000-0000-0000-0000-000000000002', 'Dra. Helena (Mentora ETEC)', 'helena@demo.com', 'teacher', 'Polo Industrial ABC', now())
ON CONFLICT (id) DO NOTHING;
