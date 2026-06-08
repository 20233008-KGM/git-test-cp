-- 사전 구축 강의 카탈로그 (엑셀 import → 자율 입장)
CREATE TABLE IF NOT EXISTS public.ai_course_catalog (
  id text PRIMARY KEY,
  course_name text NOT NULL,
  course_code text NOT NULL,
  department text,
  semester text NOT NULL,
  professor text,
  schedule text,
  room text,
  grade text,
  credit text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_code, semester)
);

CREATE INDEX IF NOT EXISTS ai_course_catalog_name_idx
  ON public.ai_course_catalog (course_name);

CREATE INDEX IF NOT EXISTS ai_course_catalog_semester_idx
  ON public.ai_course_catalog (semester);

ALTER TABLE public.ai_courses
  ADD COLUMN IF NOT EXISTS catalog_id text REFERENCES public.ai_course_catalog(id);

ALTER TABLE public.ai_course_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select ai_course_catalog" ON public.ai_course_catalog;
CREATE POLICY "Allow public select ai_course_catalog"
  ON public.ai_course_catalog FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert ai_course_catalog" ON public.ai_course_catalog;
CREATE POLICY "Allow public insert ai_course_catalog"
  ON public.ai_course_catalog FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update ai_course_catalog" ON public.ai_course_catalog;
CREATE POLICY "Allow public update ai_course_catalog"
  ON public.ai_course_catalog FOR UPDATE
  USING (true);
