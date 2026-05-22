-- 산출물 수정 API (updateDeliverable)용 RLS
DROP POLICY IF EXISTS ai_team_deliverables_update ON public.ai_team_deliverables;
CREATE POLICY ai_team_deliverables_update ON public.ai_team_deliverables
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
