# Supabase 시드 (CampusConnect)

| 파일 | 용도 |
|------|------|
| `archived_courses_kim_student.sql` | 종료 수업·팀·트러블슈팅 등 (김학생) |
| `archived_evals_kim_student.sql` | 동료·교수 평가 (SWE·OOP) |
| `archived_retrospectives_kim_student.sql` | 회고록 (SWE·OOP) |
| `archived_feedbacks_kim_student.sql` | 팀 피드백 (SWE·OOP) |
| `archived_kim_student_bundle.sql` | 위 파일 통합 (`npm run seed:archived-bundle`) |

**원격 한 번에:** `supabase/apply_remote_full.sql` (`npm run supabase:apply-remote-full`)  
→ bundle v2 + 통합 시드 + `20260521061800_hot_path_membership_indexes.sql`

**검증:** `npm run verify:archived-kim` · JSON: `node scripts/verify-archived-kim-setup.mjs --json`  
**가이드:** `doc/for_human/38_archived_kim_student_setup.md`

**타입 생성(선택):** Cursor MCP `generate_typescript_types` → `supabase/types/` 에 저장
