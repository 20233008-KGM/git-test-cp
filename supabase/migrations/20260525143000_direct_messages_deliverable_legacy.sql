-- 1:1 채팅 (수업 스코프) + 레거시 산출물 subtitle 백필

CREATE TABLE IF NOT EXISTS public.ai_direct_messages (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES public.ai_courses(id) ON DELETE CASCADE,
  sender_user_id text NOT NULL,
  recipient_user_id text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_direct_messages_course_pair
  ON public.ai_direct_messages (course_id, sender_user_id, recipient_user_id, created_at DESC);

-- UI 변경 전 산출물: subtitle 없으면 file_name을 카드 부제로 사용
UPDATE public.ai_team_deliverables
SET subtitle = LEFT(file_name, 120)
WHERE (subtitle IS NULL OR TRIM(subtitle) = '')
  AND file_name IS NOT NULL
  AND TRIM(file_name) <> '';
