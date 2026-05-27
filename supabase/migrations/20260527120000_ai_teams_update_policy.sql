-- 팀장 팀 관리: completed_stages·progress·팀명 등 UPDATE (기존에는 INSERT/SELECT/DELETE만 있어 저장이 무시됨)

ALTER TABLE public.ai_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_teams_update ON public.ai_teams;
CREATE POLICY ai_teams_update ON public.ai_teams
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
