# 17 — 인수인계

> **관련:** `02_current_state.md` · `05_todo.md` · `28_human_action_items.md` · `25_ai_work_log.md`  
> **마지막 갱신:** 2026-05-20

## 지금 여기까지

- **단계:** Alpha → Beta 진입 (~58%)
- **API:** `supabase-api.ts` — 과목·팀·Q&A·네트워크·Storage·팀 상세 쓰기 전반
- **인증:** Firebase + `ai_users` + ProtectedRoute + JWT 스캐폴드 (`VITE_ENABLE_SUPABASE_FIREBASE_JWT`, **기본 off**)
- **팀 상세:** 채팅·Realtime, 피드백·동료평가·회고록 DB, 교수 평가·제출 현황 패널, AI 진행 요약(실데이터)
- **마이페이지:** 리포트 3페이지 + A4(전 활동 스니펫·성장 회고 초안) + Edge `generate-report` (deploy H-002)
- **E2E:** 12플로우 + 인증 가드 · CI `build.yml` + `e2e.yml`
- **RLS:** `rls_review_packet.md` + `20260519000000_rls_beta_draft.sql` — **미적용** (H-001)
- **DB 마이그레이션(로컬 DRAFT):** 번들 v2 `20260520102000_team_detail_writes_bundle_v2.sql` — **인간 실행 필요**

## 바로 이어서 (인간 우선)

→ [`for_human/00_pre_launch_order.md`](../for_human/00_pre_launch_order.md)

1. **H-007** — 번들 v2 SQL → [35](../for_human/35_smoke_test_after_bundle.md) · 리포트 집계 [37](../for_human/37_verify_ai_report.md)
2. **H-003 / H-004** — 로컬 E2E · GitHub Secrets ([34](../for_human/34_github_ci_secrets.md))
3. **H-002** — Edge `generate-report` + OPENAI ([30](../for_human/30_edge_ai_report.md))
4. **H-001** — RLS 승인 ([31](../for_human/31_rls_beta_decision.md)) → JWT ([33](../for_human/33_firebase_supabase_jwt_setup.md))
5. **H-005** — Vercel 배포 (`deploy_vercel_checklist.md`)

## AI가 다음에 할 수 있는 것 (H-001 승인 후)

- RLS Beta SQL 스테이징 검증
- `VITE_ENABLE_SUPABASE_FIREBASE_JWT=true` 회귀 테스트
- [o] `gatherAiReportContext` 교수 평가 집계 (2026-05-20, 260520-23)

## 건드리지 말 것

- `vision.md`, `doit.md`
- `src/imports/` 대량 삭제
- RLS SQL **무승인** 원격 적용

## 참고

| 주제 | 문서·코드 |
|------|-----------|
| SQL 번들 | `supabase/migrations/20260520102000_team_detail_writes_bundle_v2.sql`, [29](../for_human/29_supabase_bundle_sql.md) |
| RLS | `rls_review_packet.md`, ADR-012·013 |
| AI | `10_ai_system.md`, `ai-report.ts`, `functions/generate-report/` |
| E2E | `14_testing.md`, `tests/e2e/core-flows.spec.ts` |
| 배포 | `13_devops.md`, `vercel.json`, `deploy_vercel_checklist.md` |

## 세션 종료 체크리스트

`23_agent_operating_rules.md` — `02`, `05`, `17`, `27`, `for_human/01`, `26`, `25_ai_work_log`
