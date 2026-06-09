-- 팀 AI 메모리 — 워크스페이스 요약·활동 증분 커서 확장

ALTER TABLE public.ai_team_detail_ai_memory
  ADD COLUMN IF NOT EXISTS workspace_excerpt text,
  ADD COLUMN IF NOT EXISTS analyzed_activity_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS compact_version int NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.ai_team_detail_ai_memory.workspace_excerpt IS '팀 워크스페이스 UI용 짧은 통합 요약';
COMMENT ON COLUMN public.ai_team_detail_ai_memory.analyzed_activity_ids IS '채팅·피드백·회의록 등 증분 분석 커서';
