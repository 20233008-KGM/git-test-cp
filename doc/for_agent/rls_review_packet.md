# RLS 리뷰 패키지 (T-011)

> **생성:** 2026-05-19 · **원격 DB:** Supabase MCP `pg_policies` + security advisors  
> **상태:** 인간 리뷰 대기 — **원격에 마이그레이션 적용 금지** (초안만 `supabase/migrations/`)

## 요약

| 항목 | 내용 |
|------|------|
| 인증 모델 | Firebase Auth (클라이언트) + Supabase **anon** key |
| `auth.uid()` | **미연동** — JWT에 Firebase uid 없음 |
| `ai_*` 쓰기 정책 | 대부분 `USING (true)` / `WITH CHECK (true)` → **사실상 공개** |
| 앱 레벨 보호 | `supabase-api.ts`에서 `getAccessibleCourseIds()`, 작성자 체크 등 |

프로덕션(Beta) 전에는 JWT 연동 후 RLS를 강화해야 합니다. **권장:** ADR-012 — [Supabase Third-Party Auth (Firebase)](https://supabase.com/docs/guides/auth/third-party/firebase-auth). 대안: Supabase Auth 전면 이전 · Custom JWT 서버.

## Supabase Security Advisor (WARN, `ai_*` 관련)

| 대상 | 이슈 |
|------|------|
| `ai_users` | INSERT/UPDATE `WITH CHECK (true)` |
| `ai_questions` | INSERT/UPDATE/DELETE permissive |
| `ai_courses` | INSERT/UPDATE permissive |
| `ai_course_memberships` | INSERT permissive |
| `ai_team_*` | INSERT/DELETE permissive |
| `ai_team_deliverables` | INSERT/DELETE permissive |
| `ai_team_detail_troubleshooting_logs` | INSERT/UPDATE/DELETE permissive |
| `ai_team_detail_chat_messages` | INSERT permissive (2026-05-20 앱 저장) |
| `ai_team_detail_feedbacks` | 신규 테이블 — H-007 SQL 실행 후 Alpha 정책 |
| `ai_team_detail_peer_reviews` | 신규 — 번들 v2 / H-008 |
| `ai_team_detail_retrospectives` | 신규 — 번들 v2 / H-009 |
| `ai_team_detail_professor_student_evals` | 신규 — 번들 v2 / H-010 |
| `ai_team_detail_professor_project_evals` | 신규 — 번들 v2 / H-010 |
| Storage `ai_team_deliverables` | public bucket listing |

레거시 `User`, `problems`, `source_posts` 테이블에도 WARN/INFO — 앱 미사용.

## `ai_*` 정책 목록 (2026-05-19 스냅샷)

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `ai_users` | public read | public insert | public update | — |
| `ai_courses` | public read | client insert | client update | — |
| `ai_course_memberships` | public read | public insert | — | — |
| `ai_questions` | public read | public insert | public update | public delete |
| `ai_teams` | public read | insert | — | delete |
| `ai_team_members` | public read | insert | — | delete |
| `ai_team_deliverables` | select | insert | — | delete |
| `ai_team_detail_troubleshooting_logs` | read | insert | update | delete |
| `ai_team_detail_chat_messages` | read | insert | — | — |
| `ai_team_detail_feedbacks` | read | insert | update (upsert) | — |
| `ai_team_detail_peer_reviews` | read | insert | update (upsert) | — |
| `ai_team_detail_retrospectives` | read | insert | update (upsert) | — |
| `ai_team_detail_professor_student_evals` | read | insert | update (upsert) | — |
| `ai_team_detail_professor_project_evals` | read | insert | update (upsert) | — |
| 기타 `ai_*` (read-only UI) | public read | — | — | — |

`ai_user_learning_profiles`: **SELECT만** — `saveProfile`은 `ai_users` UPDATE 사용.

## 인간 리뷰 체크리스트

- [ ] Firebase ↔ Supabase JWT 전략 결정 ([Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party/firebase-auth) 또는 Custom Claims)
- [ ] `ai_users`: 본인 `firebase_uid` row만 UPDATE
- [ ] `ai_course_memberships`: 본인 INSERT + 수강 course만 SELECT
- [ ] `ai_questions`: course 멤버 SELECT; 작성자만 UPDATE/DELETE
- [ ] `ai_teams` / members: course 스코프 + 교수/자동배정 역할
- [ ] Storage: signed URL, path에 `teamId/userId` 제한
- [ ] 초안 SQL 검토: `supabase/migrations/20260519000000_rls_beta_draft.sql`
- [ ] 스테이징에서 anon 키로 타 사용자 데이터 수정 **불가** 재현 테스트

## 앱에서 이미 하는 방어 (RLS 보완 전)

- `ProtectedRoute` — 미로그인 차단
- `questions.*` — accessible course, author checks
- `saveProfile` — `firebase_uid` 매칭
- `teamDetail` troubleshooting — 팀·작성자 검증 (클라이언트)
- `teamDetail` chat·feedback — course 접근·archived 차단 (클라이언트)

→ **anon 키로 PostgREST 직접 호출 시 우회 가능** — RLS 강화 필수.

## 다음 단계 (에이전트)

1. 인간 승인 후 `apply_migration` 또는 Supabase Dashboard
2. E2E에 RLS 회귀 시나리오 추가 (선택)
3. `22_security_notes.md` 체크리스트 갱신
