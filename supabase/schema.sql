-- ================================================================
-- SagaNote — Database schema
-- Run this in Supabase: Dashboard > SQL Editor > New Query > Run
-- ================================================================

-- ================================================================
-- USERS TABLE
-- ================================================================
CREATE TABLE public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  notion_access_token text,
  notion_workspace_id text,
  notion_workspace_name text,
  notion_workspace_icon text,
  credits_balance integer NOT NULL DEFAULT 1800,
  is_trial_used boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  preferred_language text NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- NOTION CONFIGS
-- ================================================================
CREATE TABLE public.notion_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  setup_type text NOT NULL DEFAULT 'template',
  transcription_db_id text,
  meetings_db_id text,
  actions_db_id text,
  notes_db_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- RECORDINGS
-- ================================================================
CREATE TABLE public.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  audio_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  recording_type text NOT NULL DEFAULT 'voice',
  status text NOT NULL DEFAULT 'pending',
  file_size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- TRANSCRIPTIONS
-- ================================================================
CREATE TABLE public.transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES public.recordings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  english_text text,
  burmese_text text,
  save_preference text NOT NULL DEFAULT 'both',
  summary text,
  action_items jsonb DEFAULT '[]',
  notion_page_id text,
  notion_database_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- NOTES
-- ================================================================
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  notion_page_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- PAYMENTS
-- ================================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount_mmk integer NOT NULL,
  payment_method text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  credits_granted integer,
  verified_by uuid REFERENCES public.users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- CREDIT LOGS
-- ================================================================
CREATE TABLE public.credit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_logs ENABLE ROW LEVEL SECURITY;

-- USERS: a user may READ and UPDATE their own row, but must NOT be able to
-- write privileged columns (credits_balance, is_admin, is_trial_used).
-- Those are mutated only by the service role / SECURITY DEFINER functions.
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Column-level grants: the browser (authenticated role) can only update these
-- safe columns. credits_balance / is_admin / is_trial_used / id / email are NOT
-- in the list, so a malicious UPDATE of those is rejected at the SQL layer.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (
  full_name,
  avatar_url,
  preferred_language,
  notion_access_token,
  notion_workspace_id,
  notion_workspace_name,
  notion_workspace_icon,
  updated_at
) ON public.users TO authenticated;

CREATE POLICY "Own notion config" ON public.notion_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own recordings" ON public.recordings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own transcriptions" ON public.transcriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own payments view" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own payments create" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own credit logs" ON public.credit_logs FOR SELECT USING (auth.uid() = user_id);

-- ================================================================
-- CREDITS FUNCTION
-- Deducts credits (use a NEGATIVE p_amount to ADD credits, e.g. top-ups).
-- SECURITY DEFINER + pinned search_path. EXECUTE is granted ONLY to the
-- service role, so a normal (browser/authenticated) client CANNOT call it to
-- mint itself credits.
-- ================================================================
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_desc text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.users
  SET credits_balance = GREATEST(0, credits_balance - p_amount)
  WHERE id = p_user_id;

  INSERT INTO public.credit_logs (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'deduct', p_desc);
END;
$$;

-- Lock the function down: not callable by anonymous or logged-in users.
REVOKE EXECUTE ON FUNCTION deduct_credits(uuid, integer, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(uuid, integer, text) TO service_role;
