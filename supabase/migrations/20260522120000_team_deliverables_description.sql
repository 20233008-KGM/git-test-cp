-- 산출물 등록 모달: 제목·메시지(설명) 저장
ALTER TABLE public.ai_team_deliverables
  ADD COLUMN IF NOT EXISTS description text;
