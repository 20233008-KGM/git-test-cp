-- =============================================================================
-- CampusConnect — 팀 상세 쓰기 테이블 일괄 v2
-- =============================================================================
-- 상태: DRAFT — Supabase SQL Editor에서 **한 번** 실행
-- 포함: H-007 피드백 · H-008 동료평가 · H-009 회고록 · H-010 교수 평가
-- 이전 v1(95400)만 실행했다면: 101000 + 101500 만 추가 실행해도 됨
-- =============================================================================

-- ----- 피드백 (H-007) -----
CREATE TABLE IF NOT EXISTS public.ai_team_detail_feedbacks (
  id text PRIMARY KEY,
  team_id text NOT NULL,
  author_user_id uuid NOT NULL,
  author_name text NOT NULL,
  selected_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  custom_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_team_detail_feedbacks_team_author_unique UNIQUE (team_id, author_user_id)
);

CREATE INDEX IF NOT EXISTS ai_team_detail_feedbacks_team_id_idx
  ON public.ai_team_detail_feedbacks (team_id);

ALTER TABLE public.ai_team_detail_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ai_team_detail_feedbacks" ON public.ai_team_detail_feedbacks;
CREATE POLICY "Allow public read ai_team_detail_feedbacks"
  ON public.ai_team_detail_feedbacks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert ai_team_detail_feedbacks" ON public.ai_team_detail_feedbacks;
CREATE POLICY "Allow public insert ai_team_detail_feedbacks"
  ON public.ai_team_detail_feedbacks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update ai_team_detail_feedbacks" ON public.ai_team_detail_feedbacks;
CREATE POLICY "Allow public update ai_team_detail_feedbacks"
  ON public.ai_team_detail_feedbacks FOR UPDATE USING (true) WITH CHECK (true);

-- ----- 동료평가 (H-008) -----
CREATE TABLE IF NOT EXISTS public.ai_team_detail_peer_reviews (
  id text PRIMARY KEY,
  team_id text NOT NULL,
  reviewer_user_id uuid NOT NULL,
  teammate_id text NOT NULL,
  good_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  bad_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_team_detail_peer_reviews_unique UNIQUE (team_id, reviewer_user_id, teammate_id)
);

CREATE INDEX IF NOT EXISTS ai_team_detail_peer_reviews_team_id_idx
  ON public.ai_team_detail_peer_reviews (team_id);

ALTER TABLE public.ai_team_detail_peer_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ai_team_detail_peer_reviews" ON public.ai_team_detail_peer_reviews;
CREATE POLICY "Allow public read ai_team_detail_peer_reviews"
  ON public.ai_team_detail_peer_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert ai_team_detail_peer_reviews" ON public.ai_team_detail_peer_reviews;
CREATE POLICY "Allow public insert ai_team_detail_peer_reviews"
  ON public.ai_team_detail_peer_reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update ai_team_detail_peer_reviews" ON public.ai_team_detail_peer_reviews;
CREATE POLICY "Allow public update ai_team_detail_peer_reviews"
  ON public.ai_team_detail_peer_reviews FOR UPDATE USING (true) WITH CHECK (true);

-- ----- 회고록 (H-009) -----
CREATE TABLE IF NOT EXISTS public.ai_team_detail_retrospectives (
  id text PRIMARY KEY,
  team_id text NOT NULL,
  author_user_id uuid NOT NULL,
  author_name text NOT NULL,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_team_detail_retrospectives_team_author_unique UNIQUE (team_id, author_user_id)
);

CREATE INDEX IF NOT EXISTS ai_team_detail_retrospectives_team_id_idx
  ON public.ai_team_detail_retrospectives (team_id);

ALTER TABLE public.ai_team_detail_retrospectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ai_team_detail_retrospectives" ON public.ai_team_detail_retrospectives;
CREATE POLICY "Allow public read ai_team_detail_retrospectives"
  ON public.ai_team_detail_retrospectives FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert ai_team_detail_retrospectives" ON public.ai_team_detail_retrospectives;
CREATE POLICY "Allow public insert ai_team_detail_retrospectives"
  ON public.ai_team_detail_retrospectives FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update ai_team_detail_retrospectives" ON public.ai_team_detail_retrospectives;
CREATE POLICY "Allow public update ai_team_detail_retrospectives"
  ON public.ai_team_detail_retrospectives FOR UPDATE USING (true) WITH CHECK (true);

-- ----- 교수 평가 (H-010) -----
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
