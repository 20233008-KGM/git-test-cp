-- 아카이브 수업 평가 더미 (vision #36) — 김학생 SWE·OOP 팀
-- 번들 v2 SQL 실행 후 적용

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
