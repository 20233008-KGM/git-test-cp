# 02 — 현재 상태 (항상 최신 유지)

> **관련:** `05_todo.md` · `17_handoff.md` · `27_vision_feature_matrix.md` · `28_human_action_items.md`  
> **마지막 갱신:** 2026-05-20 · **단계:** Alpha → Beta 진입 중 · **전체 진행률:** ~58%

## 스냅샷

| 영역 | % | 상태 |
|------|---|------|
| 프론트엔드 UI | 75 | 과목 active/archived, 마이페이지 리포트 3페이지 |
| 데이터 연동 (읽기) | 60 | `supabase-api.ts` → Supabase `ai_*` |
| 데이터 연동 (쓰기) | 54 | Q&A·트러블슈팅·채팅·피드백·회고록·네트워크·산출물 |
| 인증 | 58 | Firebase + `ai_users` + JWT 스캐폴드(기본 off) + ProtectedRoute |
| DB / RLS | 45 | 리뷰 패키지·Beta 초안 SQL (T-011, 미적용) |
| DevOps | 35 | CI build + E2E, `vercel.json`, `deploy_vercel_checklist.md` (H-005) |
| AI 리포트 | 62 | DB·A4·Edge 전 활동 스니펫; deploy·OPENAI H-002 |
| E2E 테스트 | 60 | Playwright 12플로우 + 인증 가드, GH Actions |

## 구현 완료 (기능)

- [o] 랜딩·로그인 UI (`/`, `/signin`)
- [o] 과목 목록 **현재/종료** 필터, 생성·보관 (교수)
- [o] 과목·팀·Q&A·네트워크·팀 상세 — Supabase 읽기·쓰기 (대부분)
- [o] `AuthContext` + Firebase + `ai_users` (`firebase_uid`)
- [o] Protected routes, course-scoped URL, 레거시 리다이렉트
- [o] 멤버십·수업 코드·랜덤 팀 (T-012)
- [o] Q&A·트러블슈팅·네트워크 프로필·팀 산출물 Storage (T-020~023)
- [o] 팀 상세 채팅 DB 저장 + Supabase Realtime (`sendChatMessage`, TeamDetailPage)
- [o] 팀 상세 피드백 DB 저장 (`submitFeedback`, H-007 SQL)
- [o] 팀 동료평가 DB 저장 (`submitPeerReview`, H-008 SQL)
- [o] 팀 회고록 DB 저장 (`submitRetrospective`, 트러블슈팅 자동연동, H-009 SQL)
- [o] 교수 팀 평가 DB·제출 현황 조회·AI 진행 요약 (H-010, 번들 v2)
- [o] AI 리포트 DB 집계·A4 인쇄·마이페이지 실데이터 (T-030/031, LLM 제외)
- [o] Playwright E2E + GitHub Actions (T-040, T-041)
- [o] 종료 수업 시드 (김학생 등) — `supabase/seed/archived_courses_kim_student.sql`
- [o] `supabase-api.ts` rename (TD-001)

## 미완료 / 진행 중

- [ ] RLS 정책 검증·강화·원격 적용 (T-011, H-001)
- [ ] Edge `generate-report` **배포**·OPENAI Secret (T-030, H-002) — 코드는 `supabase/functions/`
- [ ] 프로덕션 배포 실행 (T-042, H-005)
- [ ] E2E 전체 green (H-003, H-004 시크릿)

## 최근 검증 (2026-05-20)

- doc 전반 코드·DB 대조 갱신
- 종료 수업 2건(SWE/OOP 2025) Supabase 반영

## 알려진 블로커

1. **RLS:** enabled, 정책 강화 미적용 (T-011 / H-001)
2. **Figma imports:** `src/imports/` 레거시 유지
3. **인간:** `28_human_action_items.md` H-001~006

## 다음 즉시 액션

→ `05_todo.md` P1 T-011 · P3 T-030 LLM · P4 T-042 · `28` 인간 항목
