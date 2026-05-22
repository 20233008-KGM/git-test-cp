-- 김학생(673b60f9-…) → 김학생2(c9b6a5ca-…) 데이터 이전
-- 목적: 수동 사용 계정을 김학생2로 통일, 동일 팀·수업에 두 계정이 동시에 속하지 않도록 함
-- E2E는 기존 김학생 계정을 쓸 수 있음 — 수동 검증·E2E 전환 시 .env 의 E2E_TEST_* 를 dev_stu2@gmail.com 으로 변경
--
-- 실행: Supabase SQL Editor 또는 scripts/clone-kim-student-to-kim2.mjs

BEGIN;

-- 고정 ID (검증 스크립트·시드와 동일)
-- 김학생:  673b60f9-3c6c-4ed4-847a-e24536c472a5
-- 김학생2: c9b6a5ca-110d-40d7-851d-703f077deb81

-- 1) 프로필(이름·이메일·firebase_uid 제외) 동기화
UPDATE ai_users AS k2
SET
  major = k1.major,
  skills = k1.skills,
  bio = k1.bio,
  student_number = k1.student_number,
  updated_at = NOW()
FROM ai_users AS k1
WHERE k1.id = '673b60f9-3c6c-4ed4-847a-e24536c472a5'
  AND k2.id = 'c9b6a5ca-110d-40d7-851d-703f077deb81';

-- 2) 수업 등록 — 김학생2에 없는 수업만 추가
INSERT INTO ai_course_memberships (id, course_id, user_id, role)
SELECT
  gen_random_uuid(),
  cm.course_id,
  'c9b6a5ca-110d-40d7-851d-703f077deb81',
  cm.role
FROM ai_course_memberships cm
WHERE cm.user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5'
  AND NOT EXISTS (
    SELECT 1
    FROM ai_course_memberships existing
    WHERE existing.course_id = cm.course_id
      AND existing.user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81'
  );

-- 3) 팀 멤버십 — 김학생2가 없는 팀은 슬롯을 김학생2로 이전, 이미 있으면 김학생만 제거
UPDATE ai_team_members tm
SET user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81',
    initial = '김'
WHERE tm.user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5'
  AND NOT EXISTS (
    SELECT 1 FROM ai_team_members o
    WHERE o.team_id = tm.team_id
      AND o.user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81'
  );

DELETE FROM ai_team_members
WHERE user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

-- 4) 조원평가·피드백·회고·교수 평가·산출물
UPDATE ai_team_detail_peer_reviews
SET reviewer_user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81'
WHERE reviewer_user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

UPDATE ai_team_detail_peer_reviews
SET teammate_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81'
WHERE teammate_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

UPDATE ai_team_detail_feedbacks
SET author_user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81',
    author_name = '김학생2'
WHERE author_user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

UPDATE ai_team_detail_retrospectives
SET author_user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81',
    author_name = '김학생2'
WHERE author_user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

UPDATE ai_team_detail_professor_student_evals
SET student_row_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81'
WHERE student_row_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

UPDATE ai_team_deliverables
SET uploaded_by_user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81'
WHERE uploaded_by_user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

-- 5) Q&A · 트러블슈팅 · 팀원 표시명 · 채팅
UPDATE ai_questions
SET author_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81',
    author_user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81',
    author_name = '김학생2'
WHERE author_user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5'
   OR author_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

UPDATE ai_team_detail_troubleshooting_logs
SET author = '김학생2'
WHERE author = '김학생';

UPDATE ai_team_detail_teammates
SET name = '김학생2'
WHERE name = '김학생';

UPDATE ai_team_detail_chat_messages
SET sender = '김학생2'
WHERE sender = '김학생';

-- 6) 수강생 네트워크 확장 프로필
UPDATE ai_user_learning_profiles
SET
  temperature = src.temperature,
  team_project_count = src.team_project_count,
  portfolio_file = REPLACE(src.portfolio_file, '김학생', '김학생2'),
  detailed_bio = src.detailed_bio,
  keywords = src.keywords,
  updated_at = NOW()
FROM ai_user_learning_profiles AS src
WHERE src.user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5'
  AND ai_user_learning_profiles.user_id = 'c9b6a5ca-110d-40d7-851d-703f077deb81';

INSERT INTO ai_user_learning_profiles (
  user_id, temperature, team_project_count, portfolio_file, detailed_bio, keywords
)
SELECT
  'c9b6a5ca-110d-40d7-851d-703f077deb81',
  temperature,
  team_project_count,
  REPLACE(portfolio_file, '김학생', '김학생2'),
  detailed_bio,
  keywords
FROM ai_user_learning_profiles
WHERE user_id = '673b60f9-3c6c-4ed4-847a-e24536c472a5'
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
