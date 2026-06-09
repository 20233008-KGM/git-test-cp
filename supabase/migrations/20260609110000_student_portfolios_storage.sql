-- Student portfolio files (ai_user_learning_profiles.portfolio_file metadata)

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ai_student_portfolios', 'ai_student_portfolios', true, 52428800)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "ai_student_portfolios_storage_select" ON storage.objects;
CREATE POLICY "ai_student_portfolios_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai_student_portfolios');

DROP POLICY IF EXISTS "ai_student_portfolios_storage_insert" ON storage.objects;
CREATE POLICY "ai_student_portfolios_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai_student_portfolios');

DROP POLICY IF EXISTS "ai_student_portfolios_storage_delete" ON storage.objects;
CREATE POLICY "ai_student_portfolios_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ai_student_portfolios');
