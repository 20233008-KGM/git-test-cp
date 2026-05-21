-- 통합 시드: 김학생 아카이브 수업 + 평가 (vision #35·#36)
-- Supabase SQL Editor에서 이 파일만 실행해도 됩니다 (번들 v2 선행).
-- 개별 실행: archived_courses_kim_student.sql → archived_evals_kim_student.sql
INSERT INTO ai_courses (
  id, name, code, instructor_user_id, schedule, room,
  students_count, max_students, semester, description,
  status, archived_at, archived_by, created_at, updated_at
) VALUES (
  'course-swe-2025-archived',
  '소프트웨어공학',
  'SWE-2025-2',
  '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '월, 수 14:00-16:00',
  '창의관 401호',
  6,
  30,
  '2025-2',
  '요구사항 분석부터 설계·구현·테스트·배포까지 팀 단위로 소프트웨어 개발 전 과정을 경험하는 수업입니다. 애자일 스프린트와 Git 협업, CI 파이프라인 구성을 포함합니다.',
  'archived',
  '2025-12-20 09:00:00+00',
  '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '2025-09-01 00:00:00+00',
  '2025-12-20 09:00:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_course_stages (id, course_id, name, position, description, is_required) VALUES
  ('a1000001-0001-4000-8000-000000000001', 'course-swe-2025-archived', '요구사항 정의', 1, '페르소나·유스케이스·백로그 작성', true),
  ('a1000001-0001-4000-8000-000000000002', 'course-swe-2025-archived', '아키텍처 설계', 2, 'C4 다이어그램·API 명세', true),
  ('a1000001-0001-4000-8000-000000000003', 'course-swe-2025-archived', '스프린트 구현', 3, '2주 단위 기능 개발', true),
  ('a1000001-0001-4000-8000-000000000004', 'course-swe-2025-archived', '통합 테스트', 4, 'E2E·부하 테스트', true),
  ('a1000001-0001-4000-8000-000000000005', 'course-swe-2025-archived', '최종 발표', 5, '데모·회고·산출물 제출', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_course_memberships (id, course_id, user_id, role) VALUES
  ('b1000001-0001-4000-8000-000000000001', 'course-swe-2025-archived', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'student'),
  ('b1000001-0001-4000-8000-000000000002', 'course-swe-2025-archived', 'a355e683-3699-4b79-9673-6ac2c7f313cd', 'student'),
  ('b1000001-0001-4000-8000-000000000003', 'course-swe-2025-archived', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', 'student'),
  ('b1000001-0001-4000-8000-000000000004', 'course-swe-2025-archived', '68ca614d-75e3-43fc-8832-cbbf4366ee90', 'student'),
  ('b1000001-0001-4000-8000-000000000005', 'course-swe-2025-archived', 'fedf3771-268f-4f3e-93b3-de7e7490f10e', 'student'),
  ('b1000001-0001-4000-8000-000000000006', 'course-swe-2025-archived', '4e88cc5f-165a-41c3-a934-dce13e33ae03', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_announcements (id, course_id, title, description, d_day, sort_order) VALUES
  ('ann-swe-mid', 'course-swe-2025-archived', '중간 점검 미팅', '각 팀은 스프린트 2 목표 달성률과 리스크를 1페이지로 정리해 제출하세요.', 0, 1),
  ('ann-swe-final', 'course-swe-2025-archived', '최종 발표 및 수업 종료', '데모 15분 + Q&A 5분. 종료 후 GitHub 저장소를 read-only로 전환합니다.', 0, 2),
  ('ann-swe-retro', 'course-swe-2025-archived', '팀 회고 제출 안내', 'KPT 회고와 개인 기여도를 팀 워크스페이스에 업로드해 주세요.', 0, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_questions (
  id, title, content, author_id, author_name, author_user_id, course_id,
  tags, answers, views, likes, created_at, updated_at
) VALUES
  (
    'q-swe-1', '스프린트 번다운 차트를 어디에 기록하나요?',
    'Jira 대신 CampusConnect 팀 활동에 기록해도 되는지 궁금합니다.',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    'course-swe-2025-archived',
    '["애자일","스프린트","문서화"]'::jsonb,
    '[{"author":"김교수","content":"팀 활동 로그와 함께 주간 스프린트 노트를 첨부하면 충분합니다.","createdAt":"2025-10-12T00:00:00Z"}]'::jsonb,
    28, 4, '2025-10-10 00:00:00+00', '2025-10-12 00:00:00+00'
  ),
  (
    'q-swe-2', 'CI에서 E2E 테스트가 flaky할 때',
    'Playwright 테스트가 로컬에서는 통과하는데 GitHub Actions에서 간헐 실패합니다.',
    'a355e683-3699-4b79-9673-6ac2c7f313cd', '이서연', 'a355e683-3699-4b79-9673-6ac2c7f313cd',
    'course-swe-2025-archived',
    '["CI","Playwright","테스트"]'::jsonb,
    '[{"author":"김학생","content":"webServer 대기 시간을 늘리고 test.retry를 1회 설정했더니 안정됐어요.","createdAt":"2025-11-05T00:00:00Z"}]'::jsonb,
    19, 3, '2025-11-03 00:00:00+00', '2025-11-05 00:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_teams (id, name, course_id, badge, project_title, progress, completed_stages, sort_order) VALUES
  ('team-swe-schedule', 'SWE 1조', 'course-swe-2025-archived', '김학생 팀 · 최종 A', '학사 일정 통합 관리 플랫폼', 100, 5, 1),
  ('team-swe-qa', 'SWE 2조', 'course-swe-2025-archived', '품질 관리 자동화', '테스트 커버리지 대시보드', 100, 5, 2),
  ('team-swe-docs', 'SWE 3조', 'course-swe-2025-archived', '문서화 우수', 'API 문서 자동 생성 도구', 95, 5, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_members (id, team_id, user_id, initial, color, role, sort_order) VALUES
  ('tm-swe-1-kim', 'team-swe-schedule', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김', 'bg-[#dbeafe]', 'leader', 1),
  ('tm-swe-1-lee', 'team-swe-schedule', 'a355e683-3699-4b79-9673-6ac2c7f313cd', '이', 'bg-[#e5e7eb]', 'member', 2),
  ('tm-swe-1-park', 'team-swe-schedule', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', '박', 'bg-[#d1d5dc]', 'member', 3),
  ('tm-swe-2-choi', 'team-swe-qa', '68ca614d-75e3-43fc-8832-cbbf4366ee90', '최', 'bg-[#dbeafe]', 'leader', 1),
  ('tm-swe-2-jung', 'team-swe-qa', 'fedf3771-268f-4f3e-93b3-de7e7490f10e', '정', 'bg-[#e5e7eb]', 'member', 2),
  ('tm-swe-3-han', 'team-swe-docs', '4e88cc5f-165a-41c3-a934-dce13e33ae03', '한', 'bg-[#dbeafe]', 'leader', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_activities (id, team_id, tag, title, description, display_time, sort_order) VALUES
  ('act-swe-1', 'team-swe-schedule', '완료', '최종 데모 통과', '학사 일정 API 연동과 캘린더 UI를 교수님 앞에서 시연했습니다.', '2025-12-18', 1),
  ('act-swe-2', 'team-swe-schedule', '트러블슈팅', 'RLS 정책 검토', '수강생별 일정 조회 범위를 membership 기준으로 제한했습니다.', '2025-11-20', 2),
  ('act-swe-3', 'team-swe-schedule', '산출물', '최종 보고서 제출', '요구사항·설계·테스트 결과 PDF를 업로드했습니다.', '2025-12-19', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_projects (id, title, description, course_id, team_id, status, deadline, created_at, updated_at) VALUES
  ('proj-swe-schedule', '학사 일정 통합 관리 플랫폼', '김학생 1조 최종 프로젝트 — 수강·시험·팀 일정을 한 화면에 통합.', 'course-swe-2025-archived', 'team-swe-schedule', 'review', '2025-12-15 00:00:00+00', '2025-09-05 00:00:00+00', '2025-12-18 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_config (id, team_id, feedback_options, good_keywords, bad_keywords) VALUES
  ('team-swe-schedule-config', 'team-swe-schedule',
   '["참신해요","퀄리티가 좋아요","실용적이에요","실제로 사용해보고 싶어요"]'::jsonb,
   '["다시 팀하고 싶어요","시간 약속을 잘 지켜요","문서화를 잘 해요","끝까지 책임감을 가지고 완성해요"]'::jsonb,
   '["연락을 잘 안봐요","시간 약속을 잘 못지켜요","참여도가 낮아요","맡은 역할을 다 하지 않았어요"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_chat_messages (id, team_id, sender, text, display_time, is_mine, is_anon, sort_order) VALUES
  ('team-swe-schedule-chat-1', 'team-swe-schedule', '김학생', '최종 발표 슬라이드 초안 공유합니다. 피드백 부탁해요.', '2025-12-17', false, false, 1),
  ('team-swe-schedule-chat-2', 'team-swe-schedule', '김교수 교수님', '일정 충돌 알림 UX가 실제 학생 니즈에 잘 맞습니다. 수고했습니다.', '2025-12-18', false, false, 2),
  ('team-swe-schedule-chat-3', 'team-swe-schedule', '익명', '데모 때 API 응답이 느렸던 부분은 캐시 넣으면 더 좋을 것 같아요.', '2025-12-18', false, true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_peer_review_students (id, team_id, name, contribution, peer_keywords, peer_comment, roles, sort_order) VALUES
  ('team-swe-schedule-review-1', 'team-swe-schedule', '김학생', 40, '["다시 팀하고 싶어요","끝까지 책임감을 가지고 완성해요"]'::jsonb, '백엔드 API와 일정 충돌 로직을 주도했습니다.', '["PM","백엔드"]'::jsonb, 1),
  ('team-swe-schedule-review-2', 'team-swe-schedule', '이서연', 35, '["디자인을 잘 해요","시간 약속을 잘 지켜요"]'::jsonb, '캘린더 UI와 반응형 레이아웃을 담당했습니다.', '["UI/UX","프론트"]'::jsonb, 2),
  ('team-swe-schedule-review-3', 'team-swe-schedule', '박민준', 25, '["문서화를 잘 해요"]'::jsonb, '테스트 시나리오와 CI 파이프라인을 구축했습니다.', '["QA","DevOps"]'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_teammates (id, team_id, name, contribution, sort_order) VALUES
  ('team-swe-schedule-mate-1', 'team-swe-schedule', '김학생', 40, 1),
  ('team-swe-schedule-mate-2', 'team-swe-schedule', '이서연', 35, 2),
  ('team-swe-schedule-mate-3', 'team-swe-schedule', '박민준', 25, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_troubleshooting_logs (id, team_id, author, status, display_timestamp, problem, plan, solution, sort_order) VALUES
  ('team-swe-schedule-log-1', 'team-swe-schedule', '김학생', 'resolved', '2025-11-15', '학사 API 응답 지연으로 캘린더 초기 로딩이 8초 이상 걸렸습니다.', '핵심 일정만 먼저 로드하고 상세는 lazy fetch하도록 분리합니다.', 'React Query staleTime과 prefetch로 체감 로딩을 2초 이내로 줄였습니다.', 1),
  ('team-swe-schedule-log-2', 'team-swe-schedule', '이서연', 'resolved', '2025-12-01', '모바일에서 주간 뷰가 겹쳐 보이는 레이아웃 이슈.', 'grid minmax와 overflow 규칙을 재정의합니다.', 'tailwind grid-cols 조정 및 터치 스크롤 영역 분리로 해결.', 2),
  ('team-swe-schedule-log-3', 'team-swe-schedule', '박민준', 'resolved', '2025-12-10', 'E2E 테스트가 CI에서 간헐 실패.', 'webServer timeout 증가 및 retry 1회 설정.', 'playwright.config webServer 90s, expect timeout 15s 적용.', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_courses (
  id, name, code, instructor_user_id, schedule, room,
  students_count, max_students, semester, description,
  status, archived_at, archived_by, created_at, updated_at
) VALUES (
  'course-oop-2025-archived',
  '객체지향프로그래밍',
  'OOP-2025-1',
  '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '화, 목 13:00-15:00',
  '공학관 301호',
  6,
  35,
  '2025-1',
  'Java 기반 OOP 원리(캡슐화·상속·다형성)와 디자인 패턴을 학습하고, 팀 프로젝트로 도메인 모델링과 리팩터링을 실습합니다.',
  'archived',
  '2025-06-25 09:00:00+00',
  '5e589f7e-6eec-4a5c-beaa-92db76733484',
  '2025-03-01 00:00:00+00',
  '2025-06-25 09:00:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_course_stages (id, course_id, name, position, description, is_required) VALUES
  ('a1000002-0001-4000-8000-000000000001', 'course-oop-2025-archived', '도메인 모델링', 1, 'UML 클래스 다이어그램', true),
  ('a1000002-0001-4000-8000-000000000002', 'course-oop-2025-archived', '핵심 기능 구현', 2, 'Spring Boot 또는 JavaFX', true),
  ('a1000002-0001-4000-8000-000000000003', 'course-oop-2025-archived', '디자인 패턴 적용', 3, 'Strategy·Observer 리팩터링', true),
  ('a1000002-0001-4000-8000-000000000004', 'course-oop-2025-archived', '코드 리뷰', 4, '팀 간 상호 리뷰', true),
  ('a1000002-0001-4000-8000-000000000005', 'course-oop-2025-archived', '최종 발표', 5, '데모 및 회고', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_course_memberships (id, course_id, user_id, role) VALUES
  ('b1000002-0001-4000-8000-000000000001', 'course-oop-2025-archived', '673b60f9-3c6c-4ed4-847a-e24536c472a5', 'student'),
  ('b1000002-0001-4000-8000-000000000002', 'course-oop-2025-archived', 'a355e683-3699-4b79-9673-6ac2c7f313cd', 'student'),
  ('b1000002-0001-4000-8000-000000000003', 'course-oop-2025-archived', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', 'student'),
  ('b1000002-0001-4000-8000-000000000004', 'course-oop-2025-archived', '68ca614d-75e3-43fc-8832-cbbf4366ee90', 'student'),
  ('b1000002-0001-4000-8000-000000000005', 'course-oop-2025-archived', 'fedf3771-268f-4f3e-93b3-de7e7490f10e', 'student'),
  ('b1000002-0001-4000-8000-000000000006', 'course-oop-2025-archived', '4e88cc5f-165a-41c3-a934-dce13e33ae03', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_announcements (id, course_id, title, description, d_day, sort_order) VALUES
  ('ann-oop-mid', 'course-oop-2025-archived', '중간고사 대체 과제', '디자인 패턴 2종을 적용한 리팩터링 PR 링크를 제출하세요.', 0, 1),
  ('ann-oop-final', 'course-oop-2025-archived', '기말 프로젝트 발표', '도메인 모델·테스트 커버리지·팀 회고를 포함해 발표합니다.', 0, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_questions (
  id, title, content, author_id, author_name, author_user_id, course_id,
  tags, answers, views, likes, created_at, updated_at
) VALUES
  (
    'q-oop-1', 'Strategy 패턴과 if-else 분기',
    '결제 수단별 로직을 Strategy로 빼면 테스트가 쉬워지나요?',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김학생', '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    'course-oop-2025-archived',
    '["디자인패턴","Java","리팩터링"]'::jsonb,
    '[{"author":"김교수","content":"맞습니다. 각 Strategy를 mock으로 교체해 단위 테스트하기 좋아집니다.","createdAt":"2025-04-20T00:00:00Z"}]'::jsonb,
    34, 5, '2025-04-18 00:00:00+00', '2025-04-20 00:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_teams (id, name, course_id, badge, project_title, progress, completed_stages, sort_order) VALUES
  ('team-oop-lost', 'OOP 1조', 'course-oop-2025-archived', '김학생 팀 · 우수', '캠퍼스 분실물 찾기 앱', 100, 5, 1),
  ('team-oop-lib', 'OOP 2조', 'course-oop-2025-archived', '도서관 연동', '도서 대출·반납 알림 서비스', 100, 5, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_members (id, team_id, user_id, initial, color, role, sort_order) VALUES
  ('tm-oop-1-kim', 'team-oop-lost', '673b60f9-3c6c-4ed4-847a-e24536c472a5', '김', 'bg-[#dbeafe]', 'leader', 1),
  ('tm-oop-1-choi', 'team-oop-lost', '68ca614d-75e3-43fc-8832-cbbf4366ee90', '최', 'bg-[#e5e7eb]', 'member', 2),
  ('tm-oop-1-jung', 'team-oop-lost', 'fedf3771-268f-4f3e-93b3-de7e7490f10e', '정', 'bg-[#d1d5dc]', 'member', 3),
  ('tm-oop-2-lee', 'team-oop-lib', 'a355e683-3699-4b79-9673-6ac2c7f313cd', '이', 'bg-[#dbeafe]', 'leader', 1),
  ('tm-oop-2-park', 'team-oop-lib', '5f2a9b43-f497-4d7d-8053-c051a3bba96e', '박', 'bg-[#e5e7eb]', 'member', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_activities (id, team_id, tag, title, description, display_time, sort_order) VALUES
  ('act-oop-1', 'team-oop-lost', '완료', '기말 데모 완료', '분실물 등록·매칭·알림 플로우를 시연했습니다.', '2025-06-20', 1),
  ('act-oop-2', 'team-oop-lost', '리팩터링', 'Observer 패턴 적용', '분실물 상태 변경 시 구독자에게 알림을내도록 구조 개선.', '2025-05-28', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_projects (id, title, description, course_id, team_id, status, deadline, created_at, updated_at) VALUES
  ('proj-oop-lost', '캠퍼스 분실물 찾기 앱', '김학생 1조 — 분실물 등록·이미지 매칭·습득물 알림.', 'course-oop-2025-archived', 'team-oop-lost', 'review', '2025-06-20 00:00:00+00', '2025-03-10 00:00:00+00', '2025-06-22 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_config (id, team_id, feedback_options, good_keywords, bad_keywords) VALUES
  ('team-oop-lost-config', 'team-oop-lost',
   '["참신해요","퀄리티가 좋아요","실용적이에요","실제로 사용해보고 싶어요"]'::jsonb,
   '["다시 팀하고 싶어요","시간 약속을 잘 지켜요","코드를 깔끔하게 짜요","끝까지 책임감을 가지고 완성해요"]'::jsonb,
   '["연락을 잘 안봐요","시간 약속을 잘 못지켜요","참여도가 낮아요","맡은 역할을 다 하지 않았어요"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_chat_messages (id, team_id, sender, text, display_time, is_mine, is_anon, sort_order) VALUES
  ('team-oop-lost-chat-1', 'team-oop-lost', '김학생', 'Observer 리팩터링 PR 올렸습니다. 리뷰 부탁드려요.', '2025-05-29', false, false, 1),
  ('team-oop-lost-chat-2', 'team-oop-lost', '김교수 교수님', '도메인 모델과 패턴 적용이 균형 있게 잘 되었습니다.', '2025-06-21', false, false, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_peer_review_students (id, team_id, name, contribution, peer_keywords, peer_comment, roles, sort_order) VALUES
  ('team-oop-lost-review-1', 'team-oop-lost', '김학생', 45, '["다시 팀하고 싶어요","코드를 깔끔하게 짜요"]'::jsonb, '도메인 모델과 매칭 알고리즘을 설계·구현했습니다.', '["도메인 설계","백엔드"]'::jsonb, 1),
  ('team-oop-lost-review-2', 'team-oop-lost', '최하린', 30, '["시간 약속을 잘 지켜요"]'::jsonb, 'UI 플로우와 사용자 테스트를 담당했습니다.', '["UI","테스트"]'::jsonb, 2),
  ('team-oop-lost-review-3', 'team-oop-lost', '정다은', 25, '["문서화를 잘 해요"]'::jsonb, 'API 문서와 클래스 다이어그램을 정리했습니다.', '["문서","QA"]'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_teammates (id, team_id, name, contribution, sort_order) VALUES
  ('team-oop-lost-mate-1', 'team-oop-lost', '김학생', 45, 1),
  ('team-oop-lost-mate-2', 'team-oop-lost', '최하린', 30, 2),
  ('team-oop-lost-mate-3', 'team-oop-lost', '정다은', 25, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_troubleshooting_logs (id, team_id, author, status, display_timestamp, problem, plan, solution, sort_order) VALUES
  ('team-oop-lost-log-1', 'team-oop-lost', '김학생', 'resolved', '2025-05-10', '분실물 이미지 해시 비교 시 false positive가 많았습니다.', '임계값 조정 및 메타데이터(장소·날짜) 가중치 추가.', '복합 스코어링으로 정확도 78%→91% 개선.', 1),
  ('team-oop-lost-log-2', 'team-oop-lost', '최하린', 'resolved', '2025-06-05', '알림이 중복 발송되는 버그.', 'Observer 구독 해제 누락 확인.', 'dispose 패턴 적용 후 중복 알림 제거.', 2)
ON CONFLICT (id) DO NOTHING;

-- ========== 평가 시드 ==========

INSERT INTO ai_team_detail_peer_reviews (
  id, team_id, reviewer_user_id, teammate_id, good_keywords, bad_keywords, comment, updated_at
) VALUES
  (
    'pr-swe-kim-lee',
    'team-swe-schedule',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    'a355e683-3699-4b79-9673-6ac2c7f313cd',
    '["리더십","책임감"]'::jsonb,
    '[]'::jsonb,
    '일정 조율과 문서화를 잘 해줬습니다.',
    '2025-12-15 10:00:00+00'
  ),
  (
    'pr-swe-lee-kim',
    'team-swe-schedule',
    'a355e683-3699-4b79-9673-6ac2c7f313cd',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '["기술력","문제해결"]'::jsonb,
    '[]'::jsonb,
    '백엔드 설계와 테스트 자동화에 기여했습니다.',
    '2025-12-15 10:05:00+00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_peer_reviews (
  id, team_id, reviewer_user_id, teammate_id, good_keywords, bad_keywords, comment, updated_at
) VALUES
  (
    'pr-oop-kim-choi',
    'team-oop-lost',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '68ca614d-75e3-43fc-8832-cbbf4366ee90',
    '["협업","UI"]'::jsonb,
    '[]'::jsonb,
    '사용자 테스트와 화면 플로우를 꼼꼼히 챙겨줬습니다.',
    '2025-06-12 11:00:00+00'
  ),
  (
    'pr-oop-choi-kim',
    'team-oop-lost',
    '68ca614d-75e3-43fc-8832-cbbf4366ee90',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '["도메인 설계","문서화"]'::jsonb,
    '[]'::jsonb,
    'Observer 리팩터링과 도메인 모델 정리에 기여했습니다.',
    '2025-06-12 11:05:00+00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_professor_student_evals (
  id, team_id, student_row_id, professor_user_id, comment, updated_at
) VALUES
  (
    'pe-swe-kim',
    'team-swe-schedule',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '5e589f7e-6eec-4a5c-beaa-92db76733484',
    '팀 내 기술 리드 역할을 충실히 수행했고, 발표도 명확했습니다.',
    '2025-12-18 09:00:00+00'
  ),
  (
    'pe-oop-kim',
    'team-oop-lost',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '5e589f7e-6eec-4a5c-beaa-92db76733484',
    '디자인 패턴 적용과 트러블슈팅 기록이 우수합니다.',
    '2025-06-18 09:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_team_detail_professor_project_evals (
  id, team_id, professor_user_id, completion_comment, problem_solving_comment, holistic_comment, updated_at
) VALUES
  (
    'pp-swe-schedule',
    'team-swe-schedule',
    '5e589f7e-6eec-4a5c-beaa-92db76733484',
    '요구사항 대비 구현 완성도가 높습니다.',
    'CI·E2E 이슈를 스스로 해결한 기록이 우수합니다.',
    '학사 일정 통합 플랫폼은 실서비스 수준에 가깝습니다. 팀 협업도 안정적이었습니다.',
    '2025-12-18 09:30:00+00'
  ),
  (
    'pp-oop-lost',
    'team-oop-lost',
    '5e589f7e-6eec-4a5c-beaa-92db76733484',
    '분실물 매칭 정확도와 데모 완성도가 높습니다.',
    'Observer 버그를 팀이 스스로 해결한 점이 인상적입니다.',
    '캠퍼스 분실물 앱은 도메인 모델링 수업 목표를 잘 충족했습니다.',
    '2025-06-18 09:30:00+00'
  )
ON CONFLICT (id) DO NOTHING;

-- ========== 회고록 시드 ==========

INSERT INTO ai_team_detail_retrospectives (
  id, team_id, author_user_id, author_name, sections, updated_at
) VALUES
  (
    'retro-swe-kim',
    'team-swe-schedule',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '{
      "role": {"auto": "백엔드·일정 조율", "custom": "팀 기술 리드로 API·CI를 담당했습니다."},
      "strengths": {"auto": "문서화·테스트", "custom": "E2E 실패를 끝까지 추적해 해결했습니다."},
      "regrets": {"auto": "초기 범위 산정", "custom": "1스프린트에 기능을 너무 많이 넣었습니다."},
      "growth": {"auto": "협업·리더십", "custom": "코드 리뷰 문화를 팀에 정착시켰습니다."}
    }'::jsonb,
    '2025-12-20 10:00:00+00'
  ),
  (
    'retro-oop-kim',
    'team-oop-lost',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '{
      "role": {"auto": "도메인·Observer 리팩터링", "custom": "분실물 매칭 도메인 모델을 설계했습니다."},
      "strengths": {"auto": "패턴 적용", "custom": "Observer 버그를 dispose 패턴으로 해결했습니다."},
      "regrets": {"auto": "UI 테스트 시점", "custom": "사용자 테스트를 더 일찍 시작할 걸 그랬습니다."},
      "growth": {"auto": "도메인 모델링", "custom": "UML과 코드 일치를 팀 규칙으로 맞췄습니다."}
    }'::jsonb,
    '2025-06-20 10:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;

-- ========== 피드백 시드 ==========

INSERT INTO ai_team_detail_feedbacks (
  id, team_id, author_user_id, author_name, selected_options, custom_text, updated_at
) VALUES
  (
    'fb-swe-kim',
    'team-swe-schedule',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '["좋은 팀워크","빠른 피드백"]'::jsonb,
    '일정 공유와 코드 리뷰가 수월했습니다.',
    '2025-12-14 09:00:00+00'
  ),
  (
    'fb-oop-kim',
    'team-oop-lost',
    '673b60f9-3c6c-4ed4-847a-e24536c472a5',
    '김학생',
    '["디자인 패턴","협업"]'::jsonb,
    'Observer 리팩터링 논의가 팀에 도움이 됐습니다.',
    '2025-06-11 09:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;
