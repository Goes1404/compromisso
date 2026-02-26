
-- ==========================================================
-- COMPROMISSO | SMART EDUCATION - SCRIPT CONSOLIDADO V3.0
-- ==========================================================

-- 1. ESTRUTURA DE PERFIS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    profile_type TEXT CHECK (profile_type IN ('etec', 'uni', 'teacher', 'admin', 'student')),
    institution TEXT,
    course TEXT,
    interests TEXT,
    avatar_url TEXT,
    is_financial_aid_eligible BOOLEAN DEFAULT FALSE,
    name_changes_count INTEGER DEFAULT 0,
    last_access TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. ESTRUTURA PEDAGÓGICA (TRILHAS)
CREATE TABLE IF NOT EXISTS public.trails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    image_url TEXT,
    teacher_id UUID REFERENCES public.profiles(id),
    teacher_name TEXT,
    status TEXT DEFAULT 'draft', -- draft, review, published, active
    target_audience TEXT DEFAULT 'all',
    average_rating NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.learning_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT, -- video, quiz, pdf, text, file
    url TEXT,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. PROGRESSO E DOCUMENTAÇÃO
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    trail_id UUID REFERENCES public.trails(id) ON DELETE CASCADE,
    percentage INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, trail_id)
);

CREATE TABLE IF NOT EXISTS public.student_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, item_id)
);

-- 4. COMUNICAÇÃO (CHATS E FÓRUNS)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.forums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. BIBLIOTECA E LIVES
CREATE TABLE IF NOT EXISTS public.library_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT,
    url TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.lives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    meet_link TEXT,
    teacher_id UUID REFERENCES public.profiles(id),
    teacher_name TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. FUNÇÕES RPC (SIMULADOS)
CREATE OR REPLACE FUNCTION get_subjects_with_question_count()
RETURNS TABLE (id UUID, name TEXT, question_count BIGINT) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY SELECT s.id, s.name, COUNT(q.id) as question_count
    FROM public.subjects s LEFT JOIN public.questions q ON q.subject_id = s.id
    GROUP BY s.id, s.name ORDER BY s.name ASC;
END; $$;

CREATE OR REPLACE FUNCTION get_random_questions_for_subject(p_subject_id UUID, p_limit INT)
RETURNS TABLE (id UUID, question_text TEXT, options JSONB, correct_answer TEXT, year INTEGER, subjects JSONB) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY SELECT q.id, q.question_text, q.options::JSONB, q.correct_answer, q.year, row_to_json(s.*)::JSONB as subjects
    FROM public.questions q JOIN public.subjects s ON q.subject_id = s.id
    WHERE q.subject_id = p_subject_id ORDER BY RANDOM() LIMIT p_limit;
END; $$;

-- 7. TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, profile_type)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, COALESCE(new.raw_user_meta_data->>'role', 'student'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. POLÍTICAS DE SEGURANÇA (DEMO)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Demo" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.trails FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.modules FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.learning_contents FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.user_progress FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.student_checklists FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.direct_messages FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.library_resources FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.lives FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.forums FOR ALL USING (true);
CREATE POLICY "Acesso Demo" ON public.forum_posts FOR ALL USING (true);

-- 9. STORAGE (AVATARS)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Avatares Públicos" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Upload Autenticado" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Update Próprio" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
