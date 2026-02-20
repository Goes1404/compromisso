
-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS (PROFILES)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_financial_aid_eligible BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_access TIMESTAMPTZ DEFAULT now();

-- 3. MENSAGENS DIRETAS (CHAT PRIVADO)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false
);

-- 4. COMUNIDADE (FÓRUM)
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

-- 5. TRANSMISSÕES AO VIVO (CHAT DE SALA)
CREATE TABLE IF NOT EXISTS lives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  teacher_id UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  status TEXT DEFAULT 'scheduled',
  youtube_id TEXT
);

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

-- 6. HABILITAR REALTIME (IMPORTANTE)
ALTER publication supabase_realtime ADD TABLE forum_posts;
ALTER publication supabase_realtime ADD TABLE live_messages;
ALTER publication supabase_realtime ADD TABLE direct_messages;
ALTER publication supabase_realtime ADD TABLE lives;

-- 7. POLÍTICAS DE ACESSO (RLS)
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários veem suas próprias mensagens" ON direct_messages 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Usuários enviam mensagens" ON direct_messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);
