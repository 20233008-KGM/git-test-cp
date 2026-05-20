-- =============================================================================
-- CampusConnect — 팀 피드백 제출 (TeamDetail)
-- =============================================================================
-- 상태: DRAFT — Supabase SQL Editor에서 실행 (H-007)
-- 인간 리뷰·RLS 강화 전 Alpha 정책(공개) — T-011 후 교체
-- =============================================================================

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
