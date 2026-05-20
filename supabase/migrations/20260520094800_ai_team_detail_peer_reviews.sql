-- =============================================================================
-- CampusConnect — 팀 동료평가 제출 (TeamDetail 학생 모달)
-- =============================================================================
-- 상태: DRAFT — Supabase SQL Editor에서 실행 (H-008)
-- =============================================================================

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
