-- =============================================================================
-- CampusConnect — 교수 팀 평가 (학생별 + 프로젝트)
-- =============================================================================
-- 상태: DRAFT — Supabase SQL Editor (H-010) · 번들 v2에 포함 가능
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_team_detail_professor_student_evals (
  id text PRIMARY KEY,
  team_id text NOT NULL,
  student_row_id text NOT NULL,
  professor_user_id uuid NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_team_detail_professor_student_evals_unique
    UNIQUE (team_id, professor_user_id, student_row_id)
);

CREATE INDEX IF NOT EXISTS ai_team_detail_professor_student_evals_team_id_idx
  ON public.ai_team_detail_professor_student_evals (team_id);

ALTER TABLE public.ai_team_detail_professor_student_evals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ai_team_detail_professor_student_evals"
  ON public.ai_team_detail_professor_student_evals;
CREATE POLICY "Allow public read ai_team_detail_professor_student_evals"
  ON public.ai_team_detail_professor_student_evals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert ai_team_detail_professor_student_evals"
  ON public.ai_team_detail_professor_student_evals;
CREATE POLICY "Allow public insert ai_team_detail_professor_student_evals"
  ON public.ai_team_detail_professor_student_evals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update ai_team_detail_professor_student_evals"
  ON public.ai_team_detail_professor_student_evals;
CREATE POLICY "Allow public update ai_team_detail_professor_student_evals"
  ON public.ai_team_detail_professor_student_evals FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ai_team_detail_professor_project_evals (
  id text PRIMARY KEY,
  team_id text NOT NULL,
  professor_user_id uuid NOT NULL,
  completion_comment text,
  problem_solving_comment text,
  holistic_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_team_detail_professor_project_evals_unique
    UNIQUE (team_id, professor_user_id)
);

CREATE INDEX IF NOT EXISTS ai_team_detail_professor_project_evals_team_id_idx
  ON public.ai_team_detail_professor_project_evals (team_id);

ALTER TABLE public.ai_team_detail_professor_project_evals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ai_team_detail_professor_project_evals"
  ON public.ai_team_detail_professor_project_evals;
CREATE POLICY "Allow public read ai_team_detail_professor_project_evals"
  ON public.ai_team_detail_professor_project_evals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert ai_team_detail_professor_project_evals"
  ON public.ai_team_detail_professor_project_evals;
CREATE POLICY "Allow public insert ai_team_detail_professor_project_evals"
  ON public.ai_team_detail_professor_project_evals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update ai_team_detail_professor_project_evals"
  ON public.ai_team_detail_professor_project_evals;
CREATE POLICY "Allow public update ai_team_detail_professor_project_evals"
  ON public.ai_team_detail_professor_project_evals FOR UPDATE USING (true) WITH CHECK (true);
