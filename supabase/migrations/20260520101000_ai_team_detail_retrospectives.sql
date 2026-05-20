-- =============================================================================
-- CampusConnect — 팀 회고록 (TeamDetail)
-- =============================================================================
-- 상태: DRAFT — Supabase SQL Editor에서 실행 (H-009)
-- 인간 리뷰·RLS 강화 전 Alpha 정책(공개) — T-011 후 교체
-- =============================================================================

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
