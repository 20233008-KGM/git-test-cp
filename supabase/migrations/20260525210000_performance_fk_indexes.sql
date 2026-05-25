-- vision #118 — Supabase performance advisor: unindexed foreign keys (hot paths)
-- Safe: IF NOT EXISTS only

CREATE INDEX IF NOT EXISTS ai_announcements_course_id_idx
  ON public.ai_announcements (course_id);

CREATE INDEX IF NOT EXISTS ai_courses_archived_by_idx
  ON public.ai_courses (archived_by);

CREATE INDEX IF NOT EXISTS ai_questions_course_id_idx
  ON public.ai_questions (course_id);

CREATE INDEX IF NOT EXISTS ai_questions_author_user_id_idx
  ON public.ai_questions (author_user_id);

CREATE INDEX IF NOT EXISTS ai_team_detail_chat_messages_team_id_idx
  ON public.ai_team_detail_chat_messages (team_id);

CREATE INDEX IF NOT EXISTS ai_team_detail_teammates_team_id_idx
  ON public.ai_team_detail_teammates (team_id);

CREATE INDEX IF NOT EXISTS ai_team_detail_troubleshooting_logs_team_id_idx
  ON public.ai_team_detail_troubleshooting_logs (team_id);

CREATE INDEX IF NOT EXISTS ai_team_detail_config_team_id_idx
  ON public.ai_team_detail_config (team_id);

CREATE INDEX IF NOT EXISTS ai_team_detail_peer_review_students_team_id_idx
  ON public.ai_team_detail_peer_review_students (team_id);

CREATE INDEX IF NOT EXISTS ai_team_activities_team_id_idx
  ON public.ai_team_activities (team_id);
