# 22 — 보안 노트

> **관련:** `28_human_action_items.md` (H-001) · `rls_review_packet.md` · `for_human/19_security_basics.md`  
> **인간 리뷰 필수:** RLS, 배포, 법무  
> **마지막 갱신:** 2026-05-20

## 현재 리스크

| 리스크 | 등급 | 조치 |
|--------|------|------|
| ~~API 키 소스 노출~~ | — | **완료** `.env` + gitignore (T-003) |
| RLS 정책 미검증 | HIGH | 테이블별 정책 검토 (T-011) |
| 클라이언트 직접 LLM 호출 | HIGH | 금지, Edge/BFF only |
| ~~미인증 /app 접근~~ | — | **완료** `ProtectedRoute` (T-010) |

## RLS 현황 (2026-05-19)

| 테이블 | SELECT | INSERT | UPDATE | 비고 |
|--------|--------|--------|--------|------|
| `ai_users` | public | public | public | Firebase 연동 전 임시; 강화 필요 |
| `ai_questions` | public | public | public | UPDATE·DELETE 추가 (2026-05-19) |
| `ai_course_memberships` | public | public | — | INSERT 추가 |
| `ai_team_detail_troubleshooting_logs` | public | public | public | INSERT·UPDATE·DELETE 추가 (2026-05-19) |
| `ai_team_detail_chat_messages` | public | public | — | INSERT (채팅 저장, 2026-05-20) |
| `ai_team_detail_feedbacks` | public | public | public | H-007 SQL 후 (2026-05-20) |
| `ai_team_detail_retrospectives` | public | public | public | H-009 SQL 후 (2026-05-20) |
| `ai_team_detail_professor_*_evals` | public | public | public | H-010 / 번들 v2 (2026-05-20) |
| `ai_team_deliverables` | public | public | — | Storage bucket public read (Alpha) |
| Storage `ai_team_deliverables` | — | anon | — | SELECT/INSERT/DELETE on objects |
| `ai_teams` / `ai_team_members` | public | public | — | INSERT·DELETE (자동배정, 2026-05-19) |

> 앱은 Firebase Auth + anon key — `auth.uid()` 기반 RLS는 미적용. 프로덕션 전 인간 리뷰 필수 (T-011).

## Beta RLS 경로 (ADR-012, 2026-05-20)

1. 인간 결정 → [`for_human/31_rls_beta_decision.md`](../for_human/31_rls_beta_decision.md) (H-001)  
2. Firebase **Third-Party Auth** 활성화 (Supabase Dashboard)  
3. `20260519000000_rls_beta_draft.sql` 스테이징 검증  
4. E2E·수동 회귀 후 프로덕션 적용 GO  

## 인간 리뷰 패키지

→ `doc/for_agent/rls_review_packet.md` (pg_policies 스냅샷, advisor WARN, 체크리스트)

## RLS 체크리스트 (목표)

- [ ] `ai_users`: 본인 row만 UPDATE
- [ ] `ai_courses` / memberships: enrollment 기반 SELECT
- [ ] `ai_teams`: course 멤버만
- [ ] Storage bucket: signed URL, path에 userId

## Firebase

- 이메일/비밀번호 — 비밀번호 정책 Firebase 콘솔
- (선택) 이메일 검증
- 프로필 연결: `ai_users.firebase_uid`

## 프론트

- XSS: React 기본 이스케이프, `dangerouslySetInnerHTML` 금지
- CSRF: Supabase JWT — SameSite 쿠키 정책 호스팅에 따름

## 시크릿 관리

- 커밋 금지: `.env`, service role key
- `anon` key만 클라이언트 — RLS로 보호

## 인간 협업

- 학교 개인정보·FERPA 유사 규정
- 프로덕션 배포 전 보안 점검 승인
