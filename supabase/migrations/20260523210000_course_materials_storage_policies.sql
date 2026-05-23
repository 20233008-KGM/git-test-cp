-- vision #83 — 강의 자료 Storage 버킷·객체 정책 (deliverables와 동일 Alpha 패턴)

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ai_course_materials', 'ai_course_materials', true, 524288000)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

ALTER TABLE public.ai_course_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ai_course_materials" ON public.ai_course_materials;
CREATE POLICY "Allow public read ai_course_materials"
  ON public.ai_course_materials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert ai_course_materials" ON public.ai_course_materials;
CREATE POLICY "Allow public insert ai_course_materials"
  ON public.ai_course_materials FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete ai_course_materials" ON public.ai_course_materials;
CREATE POLICY "Allow public delete ai_course_materials"
  ON public.ai_course_materials FOR DELETE USING (true);

DROP POLICY IF EXISTS "ai_course_materials_storage_select" ON storage.objects;
CREATE POLICY "ai_course_materials_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai_course_materials');

DROP POLICY IF EXISTS "ai_course_materials_storage_insert" ON storage.objects;
CREATE POLICY "ai_course_materials_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai_course_materials');

DROP POLICY IF EXISTS "ai_course_materials_storage_delete" ON storage.objects;
CREATE POLICY "ai_course_materials_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ai_course_materials');
