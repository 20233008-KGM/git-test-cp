-- 통합 시드: 김학생 아카이브 수업 + 평가 (vision #35·#36)
-- Supabase SQL Editor에서 이 파일만 실행해도 됩니다 (번들 v2 선행).
-- 개별 실행: archived_courses_kim_student.sql → archived_evals_kim_student.sql
INSERT INTO ai_courses (
  id, name, code, instructor_user_id, schedule, room,
  students_count, max_students, semester, description,
  status, archived_at, archived_by, created_at, updated_at
) VALUES (
  'course-swe-2025-archived',
  '웹프로그래밍 실습',
  'WEB-2025-2',
  '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '월, 수 14:00-16:00',
  '창의관 401호',
  6, 30, '2025-2',
  'React·Supabase 기반 웹 서비스를 팀 단위로 기획·설계·구현·배포하는 실습 수업입니다.',
  'archived',
  '2025-12-20 09:00:00+00',
  '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '2025-09-01 00:00:00+00',
  '2025-12-20 09:00:00+00'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, code = EXCLUDED.code, description = EXCLUDED.description,
  status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

INSERT INTO ai_course_stages (id, course_id, name, position, description, is_required) VALUES
  ('a1000001-0001-4000-8000-000000000001', 'course-swe-2025-archived', '서비스 기획', 1, '페르소나·와이어프레임', true),
  ('a1000001-0001-4000-8000-000000000002', 'course-swe-2025-archived', 'UI 설계', 2, '피그마 프로토타입', true),
  ('a1000001-0001-4000-8000-000000000003', 'course-swe-2025-archived', '프론트 구현', 3, 'React 화면 개발', true),
  ('a1000001-0001-4000-8000-000000000004', 'course-swe-2025-archived', '백엔드·연동', 4, 'Supabase API', true),
  ('a1000001-0001-4000-8000-000000000005', 'course-swe-2025-archived', '최종 발표', 5, '데모·회고·산출물', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_course_memberships (id, course_id, user_id, role) VALUES
  ('b1000001-0001-4000-8000-000000000001', 'course-swe-2025-archived', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'student'),
  ('b1000001-0001-4000-8000-000000000002', 'course-swe-2025-archived', 'a355e683-3699-4b79-9673-6ac2c7f313cd', 'student'),
  ('b1000001-0001-4000-8000-000000000003', 'course-swe-2025-archived', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', 'student'),
  ('b1000001-0001-4000-8000-000000000004', 'course-swe-2025-archived', '68ca614d-75e3-43fc-8832-cbbf4366ee90', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_teams (id, name, course_id, badge, project_title, progress, completed_stages, sort_order) VALUES
  ('team-swe-schedule', '웹프 1조', 'course-swe-2025-archived', '김학생 팀 · 최종 A', '캠퍼스 커넥트', 100, 5, 1),
  ('team-swe-qa', '웹프 2조', 'course-swe-2025-archived', '네트워킹 특화', '스터디 매칭 플랫폼', 100, 5, 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, project_title = EXCLUDED.project_title, badge = EXCLUDED.badge;

INSERT INTO ai_team_members (id, team_id, user_id, initial, color, role, sort_order) VALUES
  ('tm-swe-1-kim', 'team-swe-schedule', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김', 'bg-[#dbeafe]', 'leader', 1),
  ('tm-swe-1-lee', 'team-swe-schedule', 'a355e683-3699-4b79-9673-6ac2c7f313cd', '이', 'bg-[#e5e7eb]', 'member', 2),
  ('tm-swe-1-park', 'team-swe-schedule', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', '박', 'bg-[#d1d5dc]', 'member', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_projects (id, title, description, course_id, team_id, status, deadline, created_at, updated_at) VALUES
  ('proj-swe-schedule', '캠퍼스 커넥트', '수업 입장·팀플·AI 리포트를 통합한 캠퍼스 협업 플랫폼.', 'course-swe-2025-archived', 'team-swe-schedule', 'review', '2025-12-15 00:00:00+00', '2025-09-05 00:00:00+00', '2025-12-18 00:00:00+00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

INSERT INTO ai_team_detail_config (id, team_id, feedback_options, good_keywords, bad_keywords) VALUES
  ('team-swe-schedule-config', 'team-swe-schedule',
   '["참신해요","퀄리티가 좋아요","실용적이에요","실제로 사용해보고 싶어요"]'::jsonb,
   '["다시 팀하고 싶어요","디자인을 잘 해요","문서화를 잘 해요","끝까지 책임감을 가지고 완성해요"]'::jsonb,
   '["연락을 잘 안봐요","시간 약속을 잘 못지켜요","참여도가 낮아요"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_teammates (id, team_id, name, contribution, sort_order) VALUES
  ('team-swe-schedule-mate-1', 'team-swe-schedule', '김학생', 42, 1),
  ('team-swe-schedule-mate-2', 'team-swe-schedule', '이서연', 33, 2),
  ('team-swe-schedule-mate-3', 'team-swe-schedule', '박민준', 25, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_peer_review_students (id, team_id, name, contribution, peer_keywords, peer_comment, roles, sort_order) VALUES
  ('team-swe-schedule-review-1', 'team-swe-schedule', '김학생', 42, '["다시 팀하고 싶어요","디자인을 잘 해요","문서화를 잘 해요"]'::jsonb, '서비스 기획·와이어프레임·수업 입장 기능을 주도했습니다.', '["PM","기획","프론트"]'::jsonb, 1),
  ('team-swe-schedule-review-2', 'team-swe-schedule', '이서연', 33, '["시간 약속을 잘 지켜요"]'::jsonb, '동료평가 UI와 채팅 연동을 담당했습니다.', '["UI/UX","프론트"]'::jsonb, 2),
  ('team-swe-schedule-review-3', 'team-swe-schedule', '박민준', 25, '["문서화를 잘 해요"]'::jsonb, 'E2E 테스트와 CI 파이프라인을 구축했습니다.', '["QA","DevOps"]'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_chat_messages (id, team_id, sender, text, display_time, is_mine, is_anon, sort_order) VALUES
  ('team-swe-schedule-chat-1', 'team-swe-schedule', '김학생', '회의록_0527 업로드했습니다. 정성적 평가 방향 피드백 부탁해요.', '2025-05-27', false, false, 1),
  ('team-swe-schedule-chat-2', 'team-swe-schedule', '김교수 교수님', '캠퍼스 커넥트 기획 의도가 수업 운영 문제를 잘 짚었습니다.', '2025-12-18', false, false, 2),
  ('team-swe-schedule-chat-3', 'team-swe-schedule', '이서연', '마이페이지 리포트 모달 와이어프레임 확인해 주세요.', '2025-06-24', false, false, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_troubleshooting_logs (
  id, team_id, author, author_user_id, status, display_timestamp, problem, plan, solution, sort_order
) VALUES
  ('team-swe-schedule-log-1', 'team-swe-schedule', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-10-12',
   '수업 검색·입장 UX가 분산되어 학생이 수업을 찾기 어렵습니다.',
   '검색 기반 자동 입장과 팀플 스테이지를 한 흐름으로 통합 설계합니다.',
   '수업 검색 API와 입장 버튼을 일원화해 3클릭 이내 입장을 달성했습니다.', 1),
  ('team-swe-schedule-log-2', 'team-swe-schedule', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-10-28',
   '교수가 수정한 팀플 스테이지가 수업 화면에 반영되지 않습니다.',
   'course_stages와 팀 progress·completed_stages 연동을 점검합니다.',
   '스테이지 동기화 로직을 수정해 진행률이 실시간 반영되도록 했습니다.', 2),
  ('team-swe-schedule-log-3', 'team-swe-schedule', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-11-08',
   '개별 파트 코딩 후 병합 시 충돌과 인수인계 누락으로 비효율이 발생합니다.',
   '기간별 인수인계·담당자 명시 규칙을 도입합니다.',
   '인수인계 체크리스트와 핸드오프 일정으로 머지 충돌을 크게 줄였습니다.', 3),
  ('team-swe-schedule-log-4', 'team-swe-schedule', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-11-22',
   '정량 점수만으로는 포트폴리오에 담을 역량이 드러나지 않습니다.',
   '트러블슈팅·회의록 기반 정성 리포트 구조를 기획합니다.',
   '마이페이지 AI 리포트 3페이지 구조와 데이터 집계 방식을 합의했습니다.', 4),
  ('team-swe-schedule-log-5', 'team-swe-schedule', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-12-01',
   '동료평가 키워드가 누적만 되고 탐색·검색이 되지 않습니다.',
   '키워드 인덱스와 수강자 네트워크 필터 UI를 설계합니다.',
   '키워드 검색과 1:1 채팅 연동으로 팀원 탐색 흐름을 완성했습니다.', 5),
  ('team-swe-schedule-log-6', 'team-swe-schedule', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'in-progress', '2025-12-10',
   '모바일에서 팀 워크스페이스 산출물·트러블슈팅 탭 레이아웃이 깨집니다.',
   'flex/grid 반응형 규칙을 재정의하는 중입니다.',
   '주요 브레이크포인트별 QA 진행 중입니다.', 6),
  ('team-swe-schedule-log-7', 'team-swe-schedule', '이서연', 'a355e683-3699-4b79-9673-6ac2c7f313cd', 'resolved', '2025-11-15',
   '회의록 AI 요약이 섹션 제목만 추출되어 품질이 낮습니다.',
   'substance 키워드 휴리스틱을 보완합니다.',
   '요약 문장에 결정·역할·과제 키워드가 포함되도록 개선했습니다.', 7),
  ('team-swe-schedule-log-8', 'team-swe-schedule', '박민준', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', 'resolved', '2025-12-05',
   'Playwright E2E가 CI에서 간헐 실패합니다.',
   'webServer timeout 증가 및 retry 1회 설정.',
   'playwright.config 안정화 후 CI 통과율 95% 이상.', 8)
ON CONFLICT (id) DO UPDATE SET
  author_user_id = EXCLUDED.author_user_id,
  problem = EXCLUDED.problem, plan = EXCLUDED.plan, solution = EXCLUDED.solution;

INSERT INTO ai_team_deliverables (
  id, team_id, course_id, uploaded_by_user_id, uploader_name,
  file_name, subtitle, description, storage_path, file_size, mime_type, public_url,
  created_at, updated_at
) VALUES
  (
    'del-cc-meeting-0527', 'team-swe-schedule', 'course-swe-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '회의록_0527.md', '5월 27일 팀 회의',
    E'회의요약::회의록_0527::정량적 수치보다는 토론과 트러블슈팅 등 구체적인 과정 중심의 정성적 평가를 강화하고, 이를 통해 서비스의 신뢰도와 포트폴리오 활용 가치를 극대화하는 것에 집중하기로 합의했습니다.',
    'seed/demo/team-swe-schedule/회의록_0527.md', 2048, 'text/markdown',
    'https://example.com/demo/회의록_0527.md',
    '2025-05-27 14:00:00+00', '2025-05-27 14:00:00+00'
  ),
  (
    'del-cc-meeting-0610', 'team-swe-schedule', 'course-swe-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '회의록_0610.md', '6월 10일 팀 회의',
    E'회의요약::회의록_0610::팀 빌딩과 동료평가 키워드 UX를 기획하고, 수강자 네트워크에서 키워드 검색과 1:1 채팅으로 팀원 탐색이 가능하도록 화면 흐름을 확정했습니다.',
    'seed/demo/team-swe-schedule/회의록_0610.md', 1856, 'text/markdown',
    'https://example.com/demo/회의록_0610.md',
    '2025-06-10 15:00:00+00', '2025-06-10 15:00:00+00'
  ),
  (
    'del-cc-meeting-0624', 'team-swe-schedule', 'course-swe-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '회의록_0624.md', '6월 24일 팀 회의',
    E'회의요약::회의록_0624::마이페이지 AI 요약 리포트 3페이지 구조와 발표 시연 범위(캠퍼스 커넥트 중심)를 확정하고, 회고록·트러블슈팅 데이터 연동 항목을 정리했습니다.',
    'seed/demo/team-swe-schedule/회의록_0624.md', 1920, 'text/markdown',
    'https://example.com/demo/회의록_0624.md',
    '2025-06-24 16:00:00+00', '2025-06-24 16:00:00+00'
  ),
  (
    'del-cc-figma', 'team-swe-schedule', 'course-swe-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '캠퍼스커넥트_Figma_프로토타입', 'UI/UX 프로토타입',
    '수업 입장·팀 워크스페이스·마이페이지 리포트 화면 와이어프레임.',
    'link://del-cc-figma', 0, 'text/url',
    'https://www.figma.com/file/demo-campus-connect',
    '2025-10-05 10:00:00+00', '2025-10-05 10:00:00+00'
  ),
  (
    'del-cc-notion', 'team-swe-schedule', 'course-swe-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '기획서_Notion', '서비스 기획서',
    '캠퍼스 커넥트 5대 기능·페르소나·사용자 여정 정리.',
    'link://del-cc-notion', 0, 'text/url',
    'https://www.notion.so/demo-campus-connect-plan',
    '2025-09-20 11:00:00+00', '2025-09-20 11:00:00+00'
  ),
  (
    'del-cc-github', 'team-swe-schedule', 'course-swe-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    'GitHub_캠퍼스커넥트', '소스 저장소',
    E'캠퍼스 커넥트 프론트·백엔드 monorepo.\n🔗 배포 링크: https://campus-connect-demo.vercel.app',
    'link://del-cc-github', 0, 'text/url',
    'https://github.com/demo-org/campus-connect',
    '2025-11-01 09:00:00+00', '2025-11-01 09:00:00+00'
  ),
  (
    'del-cc-vercel', 'team-swe-schedule', 'course-swe-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    'v1.0_배포_Vercel', 'v1.0 배포',
    '최종 데모용 프로덕션 배포.',
    'link://del-cc-vercel', 0, 'text/url',
    'https://campus-connect-demo.vercel.app',
    '2025-12-15 18:00:00+00', '2025-12-15 18:00:00+00'
  ),
  (
    'del-cc-midterm', 'team-swe-schedule', 'course-swe-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '중간발표_캠퍼스커넥트.pdf', '중간 발표 자료',
    '수업 입장·팀플 스테이지·동료평가 키워드·AI 리포트 방향을 발표한 중간 점검 자료.',
    'seed/demo/team-swe-schedule/중간발표_요약.txt', 4096, 'application/pdf',
    'https://example.com/demo/중간발표_캠퍼스커넥트.pdf',
    '2025-11-20 14:00:00+00', '2025-11-20 14:00:00+00'
  )
ON CONFLICT (id) DO UPDATE SET
  file_name = EXCLUDED.file_name, description = EXCLUDED.description, subtitle = EXCLUDED.subtitle;

INSERT INTO ai_team_activities (id, team_id, tag, title, description, display_time, sort_order) VALUES
  ('act-cc-1', 'team-swe-schedule', '산출물', '회의록_0527 업로드', '정성적 평가 방향 회의록을 공유했습니다.', '2025-05-27', 1),
  ('act-cc-2', 'team-swe-schedule', '트러블슈팅', '수업 입장 UX 개선', '검색 기반 자동 입장 흐름을 설계·구현했습니다.', '2025-10-12', 2),
  ('act-cc-3', 'team-swe-schedule', '산출물', 'Figma 프로토타입 공유', '마이페이지 리포트 와이어프레임을 업로드했습니다.', '2025-10-05', 3),
  ('act-cc-4', 'team-swe-schedule', '산출물', 'v1.0 Vercel 배포', '최종 데모용 배포 링크를 등록했습니다.', '2025-12-15', 4),
  ('act-cc-5', 'team-swe-schedule', '완료', '최종 발표 완료', '캠퍼스 커넥트 데모를 교수님 앞에서 시연했습니다.', '2025-12-18', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_ai_memory (team_id, memory_markdown, workspace_excerpt, updated_at) VALUES
  ('team-swe-schedule',
   '# 캠퍼스 커넥트\n\n수업 입장·팀플·AI 리포트 통합 플랫폼.',
   '캠퍼스 커넥트는 수업 검색 입장, 동료평가 키워드, AI 회의록·트러블슈팅 분석, 마이페이지 경험 자산화를 하나로 묶은 팀플 협업 서비스입니다.',
   '2025-12-18 09:00:00+00')
ON CONFLICT (team_id) DO UPDATE SET
  memory_markdown = EXCLUDED.memory_markdown,
  workspace_excerpt = EXCLUDED.workspace_excerpt;

INSERT INTO ai_courses (
  id, name, code, instructor_user_id, schedule, room,
  students_count, max_students, semester, description,
  status, archived_at, archived_by, created_at, updated_at
) VALUES (
  'course-oop-2025-archived',
  '서비스기획 실습',
  'PLAN-2025-1',
  '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '화, 목 13:00-15:00', '공학관 301호', 6, 35, '2025-1',
  '페르소나·문제 정의·서비스 기획서 작성을 팀 프로젝트로 실습하는 수업입니다.',
  'archived', '2025-06-25 09:00:00+00', '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '2025-03-01 00:00:00+00', '2025-06-25 09:00:00+00'
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, description = EXCLUDED.description;

INSERT INTO ai_course_memberships (id, course_id, user_id, role) VALUES
  ('b1000002-0001-4000-8000-000000000001', 'course-oop-2025-archived', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'student'),
  ('b1000002-0001-4000-8000-000000000002', 'course-oop-2025-archived', '68ca614d-75e3-43fc-8832-cbbf4366ee90', 'student'),
  ('b1000002-0001-4000-8000-000000000003', 'course-oop-2025-archived', 'fedf3771-268f-4f3e-93b3-de7e7490f10e', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_teams (id, name, course_id, badge, project_title, progress, completed_stages, sort_order) VALUES
  ('team-oop-lost', '기획 1조', 'course-oop-2025-archived', '김학생 팀 · 우수', '강의실 좌석·출결 편의 앱', 100, 5, 1)
ON CONFLICT (id) DO UPDATE SET project_title = EXCLUDED.project_title, name = EXCLUDED.name;

INSERT INTO ai_team_members (id, team_id, user_id, initial, color, role, sort_order) VALUES
  ('tm-oop-1-kim', 'team-oop-lost', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김', 'bg-[#dbeafe]', 'leader', 1),
  ('tm-oop-1-choi', 'team-oop-lost', '68ca614d-75e3-43fc-8832-cbbf4366ee90', '최', 'bg-[#e5e7eb]', 'member', 2),
  ('tm-oop-1-jung', 'team-oop-lost', 'fedf3771-268f-4f3e-93b3-de7e7490f10e', '정', 'bg-[#d1d5dc]', 'member', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_teammates (id, team_id, name, contribution, sort_order) VALUES
  ('team-oop-lost-mate-1', 'team-oop-lost', '김학생', 45, 1),
  ('team-oop-lost-mate-2', 'team-oop-lost', '최하린', 30, 2),
  ('team-oop-lost-mate-3', 'team-oop-lost', '정다은', 25, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_troubleshooting_logs (
  id, team_id, author, author_user_id, status, display_timestamp, problem, plan, solution, sort_order
) VALUES
  ('team-oop-lost-log-1', 'team-oop-lost', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-04-15',
   '강의실 좌석 배치 정보가 분산되어 수업 전 혼잡 예측이 어렵습니다.',
   '좌석 현황·출결 알림을 한 앱으로 통합 기획합니다.',
   '페르소나 3종과 핵심 시나리오 5개로 MVP 범위를 확정했습니다.', 1),
  ('team-oop-lost-log-2', 'team-oop-lost', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-05-20',
   '출결 확인 절차가 복잡해 수업 시작이 지연됩니다.',
   'QR·위치 기반 간편 출결 플로우를 설계합니다.',
   '와이어프레임 검증 후 개발 우선순위를 정리했습니다.', 2)
ON CONFLICT (id) DO UPDATE SET author_user_id = EXCLUDED.author_user_id;

INSERT INTO ai_team_deliverables (
  id, team_id, course_id, uploaded_by_user_id, uploader_name,
  file_name, subtitle, description, storage_path, file_size, mime_type, public_url,
  created_at, updated_at
) VALUES
  (
    'del-plan-notion', 'team-oop-lost', 'course-oop-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '좌석출결_기획서_Notion', '서비스 기획서', '강의실 좌석·출결 편의 앱 페르소나·문제 정의.',
    'link://del-plan-notion', 0, 'text/url', 'https://www.notion.so/demo-seat-plan',
    '2025-04-10 10:00:00+00', '2025-04-10 10:00:00+00'
  ),
  (
    'del-plan-figma', 'team-oop-lost', 'course-oop-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '좌석출결_와이어프레임', 'UI 와이어프레임', '좌석 조회·출결 확인 화면 흐름.',
    'link://del-plan-figma', 0, 'text/url', 'https://www.figma.com/file/demo-seat-app',
    '2025-05-01 11:00:00+00', '2025-05-01 11:00:00+00'
  ),
  (
    'del-plan-report', 'team-oop-lost', 'course-oop-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '중간기획발표_요약.md', '중간 발표', '수업 편의성 문제 발굴과 해결 방향 발표 자료.',
    'seed/demo/team-oop-lost/기획발표.md', 1024, 'text/markdown',
    'https://example.com/demo/기획발표.md',
    '2025-05-15 14:00:00+00', '2025-05-15 14:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_activities (id, team_id, tag, title, description, display_time, sort_order) VALUES
  ('act-plan-1', 'team-oop-lost', '산출물', '기획서 업로드', '노션 기획서 링크를 공유했습니다.', '2025-04-10', 1),
  ('act-plan-2', 'team-oop-lost', '완료', '중간 발표', '수업 편의성 문제 정의를 발표했습니다.', '2025-05-15', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_courses (
  id, name, code, instructor_user_id, schedule, room,
  students_count, max_students, semester, description,
  status, archived_at, archived_by, created_at, updated_at
) VALUES (
  'course-ux-2025-archived',
  'UX디자인 워크숍',
  'UX-2025-1',
  '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '금 10:00-13:00', '디자인관 201호', 6, 30, '2025-1',
  '사용자 리서치·UI 디자인·프로토타입 검증을 단기 집중 프로젝트로 수행합니다.',
  'archived', '2025-06-25 09:00:00+00', '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '2025-03-01 00:00:00+00', '2025-06-25 09:00:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_course_memberships (id, course_id, user_id, role) VALUES
  ('b1000003-0001-4000-8000-000000000001', 'course-ux-2025-archived', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'student'),
  ('b1000003-0001-4000-8000-000000000002', 'course-ux-2025-archived', 'a355e683-3699-4b79-9673-6ac2c7f313cd', 'student'),
  ('b1000003-0001-4000-8000-000000000003', 'course-ux-2025-archived', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_teams (id, name, course_id, badge, project_title, progress, completed_stages, sort_order) VALUES
  ('team-ux-notify', 'UX 1조', 'course-ux-2025-archived', '디자인 우수', '수강신청 알림·일정 안내 앱', 100, 5, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_members (id, team_id, user_id, initial, color, role, sort_order) VALUES
  ('tm-ux-1-kim', 'team-ux-notify', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김', 'bg-[#dbeafe]', 'leader', 1),
  ('tm-ux-1-lee', 'team-ux-notify', 'a355e683-3699-4b79-9673-6ac2c7f313cd', '이', 'bg-[#e5e7eb]', 'member', 2),
  ('tm-ux-1-park', 'team-ux-notify', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', '박', 'bg-[#d1d5dc]', 'member', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_config (id, team_id, feedback_options, good_keywords, bad_keywords) VALUES
  ('team-ux-notify-config', 'team-ux-notify',
   '["참신해요","퀄리티가 좋아요","실용적이에요"]'::jsonb,
   '["디자인을 잘 해요","문서화를 잘 해요","다시 팀하고 싶어요"]'::jsonb,
   '["연락을 잘 안봐요","참여도가 낮아요"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_teammates (id, team_id, name, contribution, sort_order) VALUES
  ('team-ux-mate-1', 'team-ux-notify', '김학생', 48, 1),
  ('team-ux-mate-2', 'team-ux-notify', '이서연', 28, 2),
  ('team-ux-mate-3', 'team-ux-notify', '박민준', 24, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_troubleshooting_logs (
  id, team_id, author, author_user_id, status, display_timestamp, problem, plan, solution, sort_order
) VALUES
  ('team-ux-log-1', 'team-ux-notify', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-05-08',
   '수강신청 일정·마감 알림이 여러 채널에 흩어져 놓침이 잦습니다.',
   '푸시·이메일·앱 내 알림을 통합한 일정 안내 UX를 설계합니다.',
   '알림 우선순위와 D-day 배너 패턴을 프로토타입으로 검증했습니다.', 1),
  ('team-ux-log-2', 'team-ux-notify', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'resolved', '2025-06-01',
   '모바일에서 일정 카드 가독성이 낮습니다.',
   '타이포·색상 대비·카드 간격을 재설계합니다.',
   '사용자 테스트 5명 기준 과제 인지 속도가 개선되었습니다.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_deliverables (
  id, team_id, course_id, uploaded_by_user_id, uploader_name,
  file_name, subtitle, description, storage_path, file_size, mime_type, public_url,
  created_at, updated_at
) VALUES
  (
    'del-ux-figma', 'team-ux-notify', 'course-ux-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '수강알림_UI_프로토타입', 'Figma 프로토타입', '수강신청 알림·일정 안내 앱 하이파이 UI.',
    'link://del-ux-figma', 0, 'text/url', 'https://www.figma.com/file/demo-enroll-notify',
    '2025-05-20 10:00:00+00', '2025-05-20 10:00:00+00'
  ),
  (
    'del-ux-research', 'team-ux-notify', 'course-ux-2025-archived',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생',
    '사용자리서치_요약.md', '리서치 노트', '수강생 8명 인터뷰 — 일정 놓침·알림 피로도 인사이트.',
    'seed/demo/team-ux-notify/리서치.md', 1536, 'text/markdown',
    'https://example.com/demo/리서치.md',
    '2025-04-25 11:00:00+00', '2025-04-25 11:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_activities (id, team_id, tag, title, description, display_time, sort_order) VALUES
  ('act-ux-1', 'team-ux-notify', '산출물', 'UI 프로토타입 공유', 'Figma 하이파이 프로토타입을 업로드했습니다.', '2025-05-20', 1),
  ('act-ux-2', 'team-ux-notify', '완료', '사용자 테스트 완료', '5명 대상 일정 안내 UX 테스트를 마쳤습니다.', '2025-06-10', 2)
ON CONFLICT (id) DO NOTHING;

-- ========== 평가 시드 ==========

INSERT INTO ai_team_detail_peer_reviews (
  id, team_id, reviewer_user_id, teammate_id, good_keywords, bad_keywords, comment, contribution_rating, updated_at
) VALUES
  ('pr-cc-kim-lee', 'team-swe-schedule', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'a355e683-3699-4b79-9673-6ac2c7f313cd',
   '["협업","UI"]'::jsonb, '[]'::jsonb, '동료평가 화면과 채팅 연동을 꼼꼼히 챙겨줬습니다.', 4, '2025-12-10 10:00:00+00'),
  ('pr-cc-lee-kim', 'team-swe-schedule', 'a355e683-3699-4b79-9673-6ac2c7f313cd', '673b60f9-3c6c-4ed4-847a-e24536c472a5',
   '["디자인을 잘 해요","문서화를 잘 해요"]'::jsonb, '[]'::jsonb, '서비스 방향을 명확히 잡고 회의·기획 문서를 잘 정리해 팀 진행을 안정화했습니다.', 5, '2025-12-10 10:05:00+00'),
  ('pr-cc-park-kim', 'team-swe-schedule', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', '673b60f9-3c6c-4ed4-847a-e24536c472a5',
   '["다시 팀하고 싶어요","문제해결"]'::jsonb, '[]'::jsonb, '기획 단계 의견 충돌 시 중재하고 개발 일정에 맞춰 디자인을 빠르게 수정해 줬습니다.', 5, '2025-12-11 09:00:00+00'),
  ('pr-cc-kim-park', 'team-swe-schedule', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '5f2a9b43-f497-4d7d-8053-c051a3bba96e',
   '["책임감","기술력"]'::jsonb, '[]'::jsonb, 'E2E·CI 안정화에 기여했습니다.', 4, '2025-12-11 09:05:00+00'),
  ('pr-cc-kim-lee2', 'team-swe-schedule', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'a355e683-3699-4b79-9673-6ac2c7f313cd',
   '["시간 약속을 잘 지켜요"]'::jsonb, '[]'::jsonb, '마이페이지 모달 UI 구현을 일정대로 마쳤습니다.', 4, '2025-12-12 10:00:00+00'),
  ('pr-cc-lee-kim2', 'team-swe-schedule', 'a355e683-3699-4b79-9673-6ac2c7f313cd', '673b60f9-3c6c-4ed4-847a-e24536c472a5',
   '["기획력","디자인 센스"]'::jsonb, '[]'::jsonb, '와이어프레임 품질이 높고 발표 자료도 설득력 있었습니다.', 5, '2025-12-12 10:05:00+00')
ON CONFLICT (id) DO UPDATE SET good_keywords = EXCLUDED.good_keywords, comment = EXCLUDED.comment;

INSERT INTO ai_team_detail_professor_student_evals (
  id, team_id, student_row_id, professor_user_id, comment, updated_at
) VALUES
  ('pe-cc-kim', 'team-swe-schedule', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '5e589f7e-6eec-4a5c-beaa-92db76733484',
   '프로젝트 기획서와 와이어프레임 완성도가 높습니다. 기획과 디자인 역량이 두드러지며, 최종 발표에서 수업 입장·팀플 운영의 실질적 불편을 해소하는 서비스로 구현했습니다.',
   '2025-12-18 09:00:00+00')
ON CONFLICT (id) DO UPDATE SET comment = EXCLUDED.comment;

INSERT INTO ai_team_detail_professor_project_evals (
  id, team_id, professor_user_id, completion_comment, problem_solving_comment, holistic_comment, updated_at
) VALUES
  ('pp-cc-schedule', 'team-swe-schedule', '5e589f7e-6eec-4a5c-beaa-92db76733484',
   '캠퍼스 커넥트 5대 기능이 기획서 대비 높은 완성도로 구현되었습니다.',
   '트러블슈팅·회의록 기반 정성 평가 방향이 프로젝트 전반에 일관됩니다.',
   '정량 점수보다 과정 기록을 포트폴리오로 전환하려는 기획 의도가 인상적입니다. 팀 협업도 안정적이었습니다.',
   '2025-12-18 09:30:00+00')
ON CONFLICT (id) DO UPDATE SET holistic_comment = EXCLUDED.holistic_comment;

INSERT INTO ai_team_detail_peer_reviews (
  id, team_id, reviewer_user_id, teammate_id, good_keywords, bad_keywords, comment, contribution_rating, updated_at
) VALUES
  ('pr-plan-choi-kim', 'team-oop-lost', '68ca614d-75e3-43fc-8832-cbbf4366ee90', '673b60f9-3c6c-4ed4-847a-e24536c472a5',
   '["기획력","문서화"]'::jsonb, '[]'::jsonb, '수업 편의성 문제를 구조적으로 정리해 팀 방향을 잡아줬습니다.', 5, '2025-06-10 11:00:00+00'),
  ('pr-plan-kim-choi', 'team-oop-lost', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '68ca614d-75e3-43fc-8832-cbbf4366ee90',
   '["협업"]'::jsonb, '[]'::jsonb, '사용자 인터뷰 정리를 도와줬습니다.', 4, '2025-06-10 11:05:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_professor_student_evals (
  id, team_id, student_row_id, professor_user_id, comment, updated_at
) VALUES
  ('pe-plan-kim', 'team-oop-lost', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '5e589f7e-6eec-4a5c-beaa-92db76733484',
   '문제 발굴과 기획서 품질이 우수합니다. 수업 편의성에 대한 진정성이 드러납니다.',
   '2025-06-18 09:00:00+00')
ON CONFLICT (id) DO UPDATE SET comment = EXCLUDED.comment;

INSERT INTO ai_team_detail_professor_project_evals (
  id, team_id, professor_user_id, completion_comment, problem_solving_comment, holistic_comment, updated_at
) VALUES
  ('pp-plan-lost', 'team-oop-lost', '5e589f7e-6eec-4a5c-beaa-92db76733484',
   '강의실 좌석·출결 편의 앱 기획이 실용적입니다.',
   '출결 UX 문제를 체계적으로 해결했습니다.',
   '서비스 기획 실습 목표를 충실히 달성한 팀입니다.',
   '2025-06-18 09:30:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_peer_reviews (
  id, team_id, reviewer_user_id, teammate_id, good_keywords, bad_keywords, comment, contribution_rating, updated_at
) VALUES
  ('pr-ux-lee-kim', 'team-ux-notify', 'a355e683-3699-4b79-9673-6ac2c7f313cd', '673b60f9-3c6c-4ed4-847a-e24536c472a5',
   '["디자인을 잘 해요","다시 팀하고 싶어요"]'::jsonb, '[]'::jsonb, '일정 안내 UI가 직관적이고 사용자 테스트 준비도 철저했습니다.', 5, '2025-06-15 10:00:00+00'),
  ('pr-ux-kim-lee', 'team-ux-notify', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'a355e683-3699-4b79-9673-6ac2c7f313cd',
   '["협업"]'::jsonb, '[]'::jsonb, '프로토타입 피드백을 빠르게 반영해 줬습니다.', 4, '2025-06-15 10:05:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_professor_student_evals (
  id, team_id, student_row_id, professor_user_id, comment, updated_at
) VALUES
  ('pe-ux-kim', 'team-ux-notify', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '5e589f7e-6eec-4a5c-beaa-92db76733484',
   'UI 프로토타입 완성도와 사용자 리서치 정리가 뛰어납니다. 디자인 역량이 돋보입니다.',
   '2025-06-20 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_professor_project_evals (
  id, team_id, professor_user_id, completion_comment, problem_solving_comment, holistic_comment, updated_at
) VALUES
  ('pp-ux-notify', 'team-ux-notify', '5e589f7e-6eec-4a5c-beaa-92db76733484',
   '수강신청 알림·일정 안내 앱 UI가 완성도 높습니다.',
   '알림 피로도 문제를 UX 관점에서 잘 풀었습니다.',
   '수업 편의성 프로젝트로서 설득력 있는 디자인 결과물입니다.',
   '2025-06-20 09:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ========== 회고록 시드 ==========

INSERT INTO ai_team_detail_retrospectives (
  id, team_id, author_user_id, author_name, sections, updated_at
) VALUES
  (
    'retro-cc-kim',
    'team-swe-schedule',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '{
      "role": {"auto": "", "custom": "팀 리더·서비스 기획·UI/UX·프론트/백엔드 총괄"},
      "strengths": {"auto": "", "custom": "개별 파트 병합 비효율을 인수인계 방식으로 개선했고, 수업 입장·팀플 스테이지 기능을 직접 구현했습니다."},
      "regrets": {"auto": "", "custom": "모바일 반응형 QA를 더 일찍 시작할 걸 그랬습니다."},
      "growth": {"auto": "", "custom": "정성적 평가·AI 리포트 기획을 통해 기획-개발-평가를 연결하는 경험을 쌓았습니다."}
    }'::jsonb,
    '2025-12-20 10:00:00+00'
  ),
  (
    'retro-plan-kim',
    'team-oop-lost',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '{
      "role": {"auto": "", "custom": "서비스 기획 리드 — 페르소나·문제 정의·기획서"},
      "strengths": {"auto": "", "custom": "수업 편의성 문제를 구조화하고 MVP 범위를 팀과 합의했습니다."},
      "regrets": {"auto": "", "custom": "개발 연동 일정을 더 여유 있게 잡을 걸 그랬습니다."},
      "growth": {"auto": "", "custom": "기획서만이 아니라 와이어프레임까지 책임지는 올라운더 역량을 키웠습니다."}
    }'::jsonb,
    '2025-06-20 10:00:00+00'
  ),
  (
    'retro-ux-kim',
    'team-ux-notify',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '{
      "role": {"auto": "", "custom": "UI/UX 디자인 리드 — 리서치·프로토타입·사용자 테스트"},
      "strengths": {"auto": "", "custom": "일정 안내 UX를 사용자 테스트로 검증하고 개선했습니다."},
      "regrets": {"auto": "", "custom": "접근성(색상 대비) 점검을 중간에 넣을 걸 그랬습니다."},
      "growth": {"auto": "", "custom": "수업 편의성 문제에 대한 디자인 관점의 해결 경험을 쌓았습니다."}
    }'::jsonb,
    '2025-06-22 10:00:00+00'
  )
ON CONFLICT (id) DO UPDATE SET sections = EXCLUDED.sections;

-- ========== 피드백 시드 ==========

INSERT INTO ai_team_detail_feedbacks (
  id, team_id, author_user_id, author_name, selected_options, custom_text, updated_at
) VALUES
  (
    'fb-cc-kim',
    'team-swe-schedule',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '["참신해요","실용적이에요","실제로 사용해보고 싶어요"]'::jsonb,
    '정성적 평가와 AI 리포트 방향이 팀에 잘 맞았습니다.',
    '2025-12-14 09:00:00+00'
  ),
  (
    'fb-plan-kim',
    'team-oop-lost',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '["퀄리티가 좋아요","실용적이에요"]'::jsonb,
    '기획서와 와이어프레임 품질이 높아 중간 발표가 수월했습니다.',
    '2025-06-11 09:00:00+00'
  ),
  (
    'fb-ux-kim',
    'team-ux-notify',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '["참신해요","퀄리티가 좋아요"]'::jsonb,
    '사용자 테스트 기반 UI 개선이 인상적이었습니다.',
    '2025-06-18 09:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;

-- ========== 마이페이지 프로필·AI 컨텍스트 ==========

UPDATE ai_users
SET
  skills = '["피그마", "일러스트", "노션", "깃허브", "라이노", "포토샵"]'::jsonb,
  bio = '안녕하세요, 서비스 기획과 UX 디자인에 관심이 많은 김학생입니다.

대학 수업과 팀 프로젝트를 진행하면서 「수업 입장이 불편하다」「팀원을 잘 모른다」「점수만으로는 내 역량이 드러나지 않는다」는 문제를 반복적으로 발견했고, 이를 해결하는 서비스를 기획·디자인하는 데 집중해 왔습니다.

피그마로 사용자 여정과 와이어프레임을 먼저 정리하고, 노션으로 요구사항을 문서화한 뒤 개발 팀과 핸드오프하는 방식으로 협업합니다. 동료평가와 교수 피드백에서 기획력·디자인 센스·문서화를 잘한다는 키워드를 자주 받았습니다.

캠퍼스 커넥트 프로젝트에서는 기획부터 프론트·백엔드 구현까지 전 과정을 경험했으며, 특히 수업 편의성을 높이는 문제에 높은 관심과 진정성을 보여 왔습니다.',
  updated_at = now()
WHERE id = '673b60f9-3c6c-4ed4-847a-e24536c472a5';

INSERT INTO ai_user_ai_context (
  user_id, report_excerpt, context_markdown, updated_at
) VALUES (
  '673b60f9-3c6c-4ed4-847a-e24536c472a5',
  '진행했던 프로젝트들을 분석한 결과, 기획부터 개발까지 전 과정을 경험해 보았으며, 특히 기획과 디자인을 위주로 진행했습니다. 기획과 디자인에 관련해서는 동료평가와 교수의 프로젝트 평가에서 뛰어나다는 키워드를 받았습니다. 팀프로젝트는 주로 서비스 기획을 많이 진행했고, 그중 학교 수업의 편의성을 높여 주는 프로젝트를 3회 진행한 것으로 보아 수업 편의성 문제에 높은 관심과 진정성이 보입니다.',
  '# 김학생 팀플 요약

## 웹프로그래밍 실습 · 캠퍼스 커넥트
- 역할: 팀 리더, 기획·디자인·프론트/백엔드
- 핵심: 수업 검색 입장, 팀플 스테이지, 동료평가 키워드, AI 리포트
- 트러블슈팅 6건(본인), 산출물 8건, 회의록 3건

## 서비스기획 실습 · 강의실 좌석·출결 편의 앱
- 역할: 서비스 기획 리드
- 수업 편의성 프로젝트 1

## UX디자인 워크숍 · 수강신청 알림·일정 안내 앱
- 역할: UI/UX 디자인 리드
- 수업 편의성 프로젝트 2',
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  report_excerpt = EXCLUDED.report_excerpt,
  context_markdown = EXCLUDED.context_markdown,
  updated_at = EXCLUDED.updated_at;
