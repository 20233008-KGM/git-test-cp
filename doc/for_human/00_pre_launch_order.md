# 런칭 전에 할 일 — 추천 순서

> **한 줄 요약:** MCP 연결 → E2E → RLS 검토 (H-002·H-005·H-011 완료)  
> **상세:** `28_human_action_items.md` · **DB 일상:** `doc/for_agent/33_supabase_mcp_db_operations.md` (인간 SQL 불필요)

| 순서 | ID | 할 일 | 가이드 |
|------|-----|------|--------|
| 0 | — | Cursor **Supabase MCP** 연결 | `33_supabase_mcp_db_operations.md` |
| 0b | — | `npm run prelaunch:check` (빌드·시드 검증) | `doc/for_agent/prelaunch_check.md` |
| ~~1~~ | H-011 | ~~원클릭 SQL~~ | ✅ MCP·완료 — [38](./38_archived_kim_student_setup.md) 레거시 참고 |
| ~~1b~~ | H-007 | ~~번들 v2~~ | ✅ 완료 — [29](./29_supabase_bundle_sql.md) 레거시 |
| 2 | (선택) | 채팅 Realtime | `supabase/migrations/20260520100300_realtime_chat.sql` |
| 3 | H-003 | 로컬 `.env` + `npm run test:e2e` | `14_testing.md` |
| 4 | H-004 | GitHub Secrets (CI) | [34_github_ci_secrets.md](./34_github_ci_secrets.md) |
| 5 | H-001 | RLS 적용 여부 결정 | [31](./31_rls_beta_decision.md) → [rls_staging_verification.md](../for_agent/rls_staging_verification.md) |
| 6 | H-006 | 약관·개인정보 | 법무 |

**완료 (순서에서 제외):** H-002 Edge Gemini · H-005 Production https://git-test-cp.vercel.app — AI 재설정 시 [30](./30_edge_ai_report.md)

완료할 때마다 채팅에 **「H-00x 완료」** 라고 알려 주시면 AI가 문서를 갱신합니다.
