-- 아카이브 팀 피드백 더미 (H-007) — 김학생 SWE·OOP 팀
-- 번들 v2 SQL 실행 후 적용

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
