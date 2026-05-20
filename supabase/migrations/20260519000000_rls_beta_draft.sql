-- =============================================================================
-- CampusConnect — RLS Beta 초안 (T-011)
-- =============================================================================
-- 상태: DRAFT — 인간 리뷰 전 원격 적용 금지
-- 전제: Supabase JWT에 firebase_uid 클레임 존재 (Custom JWT 또는 Third-Party Auth)
-- 현재 Alpha는 anon + USING(true) 정책 — 이 파일은 Beta 목표 스케치
-- =============================================================================

-- 예시 헬퍼 (실제 적용 시 검증 필요)
-- CREATE OR REPLACE FUNCTION public.current_firebase_uid()
-- RETURNS text LANGUAGE sql STABLE AS $$
--   SELECT coalesce(auth.jwt() ->> 'firebase_uid', auth.jwt() ->> 'sub');
-- $$;

-- ---------------------------------------------------------------------------
-- ai_users: 본인 프로필만 UPDATE
-- ---------------------------------------------------------------------------
-- DROP POLICY IF EXISTS "Allow public update ai_users" ON public.ai_users;
-- CREATE POLICY "users_update_own_firebase"
--   ON public.ai_users FOR UPDATE TO authenticated
--   USING (firebase_uid = public.current_firebase_uid())
--   WITH CHECK (firebase_uid = public.current_firebase_uid());

-- ---------------------------------------------------------------------------
-- ai_course_memberships: 본인 enrollment INSERT, 멤버십 있는 course만 SELECT
-- ---------------------------------------------------------------------------
-- CREATE POLICY "memberships_select_enrolled"
--   ON public.ai_course_memberships FOR SELECT TO authenticated
--   USING (
--     user_id IN (
--       SELECT id FROM public.ai_users WHERE firebase_uid = public.current_firebase_uid()
--     )
--     OR course_id IN (
--       SELECT course_id FROM public.ai_course_memberships m
--       JOIN public.ai_users u ON u.id = m.user_id
--       WHERE u.firebase_uid = public.current_firebase_uid()
--     )
--   );

-- ---------------------------------------------------------------------------
-- ai_questions: course 멤버 SELECT; 작성자 UPDATE/DELETE
-- ---------------------------------------------------------------------------
-- (course_id IN accessible courses) AND (author_user_id = current ai_users.id)

-- ---------------------------------------------------------------------------
-- ai_team_detail_chat_messages: course 멤버 INSERT; 본인·팀 SELECT
-- ---------------------------------------------------------------------------
-- CREATE POLICY "chat_select_team_members" ON public.ai_team_detail_chat_messages
--   FOR SELECT USING (team_id IN (accessible teams for current user));

-- ---------------------------------------------------------------------------
-- ai_team_detail_feedbacks: 본인 1건 per team INSERT/UPDATE
-- ---------------------------------------------------------------------------
-- CREATE POLICY "feedback_upsert_own" ON public.ai_team_detail_feedbacks
--   FOR ALL USING (author_user_id = current ai_users.id from firebase_uid);

-- ---------------------------------------------------------------------------
-- Storage ai_team_deliverables: 팀 멤버만 업로드, listing 제한
-- ---------------------------------------------------------------------------
-- signed URL + path convention: {teamId}/{userId}/{filename}

-- 끝 — 적용 전 rls_review_packet.md 체크리스트 완료
