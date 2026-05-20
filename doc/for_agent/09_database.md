# 09 — 데이터베이스 (Supabase / PostgreSQL)

> **관련:** `07_backend.md` · `22_security_notes.md` · `11_api_spec.md` · `supabase/seed/`  
> **검증:** 2026-05-20 Supabase MCP · 시드 `archived_courses_kim_student.sql`

## 현재

- **호스트:** `VITE_SUPABASE_URL` (프로젝트: `exsboyynrmxtdyyyqkyy.supabase.co`)
- **접근:** 클라이언트 `@supabase/supabase-js` + `src/app/api/supabase-api.ts` facade
- **RLS:** 대부분 테이블 `rls_enabled: true` (정책 세부는 T-011)
- **로컬 마이그레이션:** `supabase/migrations/20260519000000_rls_beta_draft.sql` (RLS Beta 초안, **미적용**)

## 핵심 테이블 (`ai_*` — 앱에서 사용)

| 테이블 | 용도 |
|--------|------|
| `ai_users` | 프로필 (uuid `id` + `firebase_uid` 별도) |
| `ai_courses` | 수업 |
| `ai_course_memberships` | 수강·역할 (student/professor/assistant) |
| `ai_course_stages` | 수업별 단계 |
| `ai_teams` | 팀 |
| `ai_team_members` | 팀원 |
| `ai_team_activities` | 팀 활동 |
| `ai_announcements` | 공지 |
| `ai_questions` | Q&A |
| `ai_projects` | 프로젝트 목록 |
| `ai_team_detail_*` | 팀 상세 (채팅·피드백·피어리뷰·트러블슈팅 로그 등) |
| `ai_team_detail_feedbacks` | 팀 피드백 제출 (H-007 마이그레이션) |
| `ai_team_deliverables` | 팀 산출물 메타 (Storage `ai_team_deliverables` bucket) |
| `ai_user_learning_profiles` | 수강생 네트워크 확장 프로필 |
| `ai_my_page_*` | 마이페이지 (선택; 리포트는 팀·트러블슈팅 집계 우선) |

## `ai_users` 주요 컬럼

| 컬럼 | 용도 |
|------|------|
| `id` | uuid (PK, Supabase 내부 ID) |
| `firebase_uid` | Firebase Auth uid (**조회 시 이 컬럼 사용**) |
| `email`, `name`, `role` | 기본 |
| `student_number`, `major`, `skills`, `bio` | student |
| `department`, `office`, `office_hours`, `research_areas` | professor |

## 레거시·미연동 테이블 (참고)

`User`, `problems`, `source_posts` 등 — 앱 `supabase-api.ts`에서 **사용하지 않음**.

## RLS 원칙 (초안)

- **student:** enrollment 과목·팀 범위
- **professor:** 담당 course
- **admin:** 제한적 전체

→ T-011 인간 리뷰 후 강화

## 시드 데이터

- `supabase/seed/archived_courses_kim_student.sql` — 김학생 종료 수업 2건 (SWE/OOP 2025)

## 마이그레이션 (`supabase/migrations/`)

| 파일 | 용도 |
|------|------|
| `README.md` | 실행 순서·28 ID 매핑 |
| `20260520095400_team_detail_writes_bundle.sql` | 피드백 + 동료평가 (H-007·H-008 통합) |
| `20260519000000_rls_beta_draft.sql` | RLS Beta 스케치 (H-001) |

## 다음 액션

1. RLS 정책 적용 (T-011, H-001, ADR-012)
2. 번들 SQL 원격 실행 (H-007·H-008)
