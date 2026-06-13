-- ================================================================
-- SagaNote — SECURITY FIXES migration
-- Run this in Supabase SQL Editor if you ALREADY ran schema.sql before.
-- It patches the critical vulnerabilities found in the security audit.
-- Safe to run once. (Fresh installs of the updated schema.sql already include
-- these — running this again is harmless but not needed.)
-- ================================================================

-- ----------------------------------------------------------------
-- C1 — Stop users from writing privileged columns on their own row
--      (previously any logged-in user could set credits_balance / is_admin).
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users own profile" ON public.users;

CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

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

-- ----------------------------------------------------------------
-- C2 — Lock down deduct_credits so only the server (service role) can call it.
--      Previously any user could rpc('deduct_credits', { p_amount: -9999 })
--      to add unlimited credits.
-- ----------------------------------------------------------------
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

REVOKE EXECUTE ON FUNCTION deduct_credits(uuid, integer, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(uuid, integer, text) TO service_role;

-- ----------------------------------------------------------------
-- H3 (optional but recommended) — keep payment receipts OUT of the public
-- bucket. Create a PRIVATE "receipts" bucket and scope it per user.
-- After running this, see the note in the checklist about updating the
-- credits upload path (the app code change is included in this release).
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
