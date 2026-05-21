-- Hot-path indexes for membership & course-scoped team queries (Supabase performance advisor)
-- Safe to re-run: IF NOT EXISTS

CREATE INDEX IF NOT EXISTS ai_team_members_team_id_idx
  ON public.ai_team_members (team_id);

CREATE INDEX IF NOT EXISTS ai_team_members_user_id_idx
  ON public.ai_team_members (user_id);

CREATE INDEX IF NOT EXISTS ai_teams_course_id_idx
  ON public.ai_teams (course_id);

CREATE INDEX IF NOT EXISTS ai_course_memberships_course_id_idx
  ON public.ai_course_memberships (course_id);

CREATE INDEX IF NOT EXISTS ai_course_memberships_user_id_idx
  ON public.ai_course_memberships (user_id);
