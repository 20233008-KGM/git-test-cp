-- 팀 채팅 sort_order: Date.now() 밀리초 타임스탬프 저장 (integer 범위 초과 방지)
ALTER TABLE public.ai_team_detail_chat_messages
  ALTER COLUMN sort_order TYPE bigint;
