-- vision #60 강의 자료 · vision #73 산출물 부제목
ALTER TABLE public.ai_team_deliverables
  ADD COLUMN IF NOT EXISTS subtitle text;

CREATE TABLE IF NOT EXISTS public.ai_course_materials (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES public.ai_courses (id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text NOT NULL,
  file_size bigint DEFAULT 0,
  mime_type text,
  storage_path text,
  public_url text NOT NULL,
  uploaded_by_user_id text,
  uploader_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_course_materials_course_id_idx
  ON public.ai_course_materials (course_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ai_course_materials', 'ai_course_materials', true, 524288000)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;
