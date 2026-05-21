-- 아카이브 팀 회고록 더미 (vision #33·H-009) — 김학생 SWE·OOP 팀
-- 번들 v2 SQL 실행 후 적용

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
