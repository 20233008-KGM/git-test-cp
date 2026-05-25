-- 팀 채팅·팀 활동 기록: RLS INSERT (SELECT만 있어 클라이언트 insert 실패)

ALTER TABLE public.ai_team_detail_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert ai_team_detail_chat_messages" ON public.ai_team_detail_chat_messages;
CREATE POLICY "Allow public insert ai_team_detail_chat_messages"
  ON public.ai_team_detail_chat_messages FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.ai_team_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert ai_team_activities" ON public.ai_team_activities;
CREATE POLICY "Allow public insert ai_team_activities"
  ON public.ai_team_activities FOR INSERT
  WITH CHECK (true);
