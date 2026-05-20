-- =============================================================================
-- CampusConnect — 팀 상세 쓰기 테이블 일괄 (피드백 + 동료평가)
-- =============================================================================
-- 상태: DRAFT — Supabase SQL Editor에서 **한 번** 실행 (H-007 + H-008 통합)
-- 개별 파일: 20260520094500_ai_team_detail_feedbacks.sql
--           20260520094800_ai_team_detail_peer_reviews.sql
-- RLS: Alpha 공개 정책 — T-011 강화 전
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
