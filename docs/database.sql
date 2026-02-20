
-- SCRIPT DE BANCO DE DADOS - COMPROMISSO | EDUCORI
-- Execute este script no SQL Editor do Supabase para ativar todas as funções reais.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PERFIS E SEGURANÇA
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_financial_aid_eligible BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_access TIMESTAMPTZ DEFAULT now();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Perfis visíveis por todos" ON profiles;
CREATE POLICY "Perfis visíveis por todos" ON profiles FOR SELECT USING (true);

-- 3. MENSAGENS DIRETAS (CHAT PRIVADO)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ver próprias mensagens" ON direct_messages;
CREATE POLICY "Ver próprias mensagens" ON direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Enviar mensagens" ON direct_messages;
CREATE POLICY "Enviar mensagens" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 4. FÓRUM E COMUNIDADE
CREATE TABLE IF NOT EXISTS forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Dúvidas',
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  content TEXT NOT NULL
);

ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total fórum" ON forums FOR ALL USING (true);
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total posts" ON forum_posts FOR ALL USING (true);

-- 5. TRILHAS E CONTEÚDO
CREATE TABLE IF NOT EXISTS trails (
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

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS learning_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0
);

-- 6. POPULAR MENTORES DEMO
INSERT INTO profiles (id, name, email, profile_type, institution, last_access)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Prof. Ricardo (Matemática)', 'ricardo@demo.com', 'teacher', 'ETEC Jorge Street', now()),
('00000000-0000-0000-0000-000000000002', 'Dra. Helena (Mentora ETEC)', 'helena@demo.com', 'teacher', 'Polo Industrial ABC', now())
ON CONFLICT (id) DO NOTHING;
