-- ================================================================
-- SagaNote — Supabase Storage policies for the "recordings" bucket
-- ----------------------------------------------------------------
-- FIRST create the bucket in the dashboard:
--   Storage > New bucket > name: recordings > Public bucket: ON
-- THEN run this SQL (Dashboard > SQL Editor) to scope access per user.
--
-- Files are stored at: {user_id}/{timestamp}.webm
-- Payment receipts at:  {user_id}/receipts/{timestamp}.jpg
-- The first path segment is the user's id, which we match against auth.uid().
-- ================================================================

-- Allow authenticated users to UPLOAD into their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to READ their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to UPDATE/replace their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to DELETE their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public READ so audio_url / screenshot_url public links work in the app
-- (the bucket is public; this policy makes the intent explicit).
CREATE POLICY "Public can read recordings"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'recordings');
