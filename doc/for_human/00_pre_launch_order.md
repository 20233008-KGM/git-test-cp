# 런칭 전에 할 일 — 추천 순서

> **한 줄 요약:** SQL → E2E → AI Edge → RLS 검토 → 배포  
> **상세:** 각 항목은 `28_human_action_items.md` 의 H-00x

| 순서 | ID | 할 일 | 가이드 |
|------|-----|------|--------|
| 0 | — | `npm run prelaunch:check` (빌드·시드 검증) | `doc/for_agent/prelaunch_check.md` |
| 1 | H-011 | **원클릭 SQL** (v2+김학생 시드) | [38](./38_archived_kim_student_setup.md) · `apply_remote_full.sql` |
| 1b | H-007 | Supabase **번들 v2**만 필요 시 | [29](./29_supabase_bundle_sql.md) → [35](./35_smoke_test_after_bundle.md) |
| 2 | (선택) | 채팅 Realtime | `supabase/migrations/20260520100300_realtime_chat.sql` |
| 3 | H-003 | 로컬 `.env` + `npm run test:e2e` | `14_testing.md` |
| 4 | H-004 | GitHub Secrets (CI) | [34_github_ci_secrets.md](./34_github_ci_secrets.md) |
| 5 | H-002 | Edge AI 리포트 | [30_edge_ai_report.md](./30_edge_ai_report.md) |
| 6 | H-001 | RLS 적용 여부 결정 | [31](./31_rls_beta_decision.md) → [rls_staging_verification.md](../for_agent/rls_staging_verification.md) |
| 7 | H-005 | Vercel 배포 GO | [deploy_vercel_checklist.md](../for_agent/deploy_vercel_checklist.md) |
| 8 | H-006 | 약관·개인정보 | 법무 |

완료할 때마다 채팅에 **「H-00x 완료」** 라고 알려 주시면 AI가 문서를 갱신합니다.
