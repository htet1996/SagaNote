-- ================================================================
-- SagaNote — Make yourself an admin
-- Replace the email below with YOUR Google account email,
-- then run in Supabase SQL Editor AFTER you have signed in once
-- (so your row exists in public.users).
-- ================================================================

UPDATE public.users
SET is_admin = true
WHERE email = 'nexushub.nxh@gmail.com';

-- Verify:
-- SELECT email, is_admin, credits_balance FROM public.users;
