
-- SCRIPT DE MIGRAÇÃO COMPLETA PARA ESTADO INDUSTRIAL
-- Execute este script no SQL Editor do Supabase

-- 1. Tabelas de Perfis e Progresso (Garantia)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type TEXT; -- 'etec', 'uni', 'teacher', 'admin'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_financial_aid_eligible BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_access TIMESTAMPTZ DEFAULT now();

-- 2. Tabela de Trilhas (Garantia de colunas administrativas)
ALTER TABLE trails ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'; -- 'draft', 'review', 'active'
ALTER TABLE trails ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all';
ALTER TABLE trails ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral';

-- 3. Estrutura Interna das Trilhas
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'video', 'pdf', 'quiz', 'text'
  url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Sistema de Fórum Real-time
CREATE TABLE IF NOT EXISTS forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Biblioteca Digital
CREATE TABLE IF NOT EXISTS library_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Habilitar Real-time para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE forums;

-- 7. Inserir alguns dados iniciais na Biblioteca (Opcional)
INSERT INTO library_resources (title, description, category, type, image_url)
VALUES 
('Guia ENEM 2024', 'Manual completo de redação.', 'Linguagens', 'PDF', 'https://picsum.photos/seed/lib1/400/250'),
('Física do Zero', 'Curso intensivo de cinemática.', 'Física', 'Video', 'https://picsum.photos/seed/lib2/400/250');
