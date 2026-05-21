# 당신이 해줘야 하는 일 — 대기 목록

> **AI는 이 목록을 세션마다 갱신합니다.** 완료하면 체크 칸을 `[o]`로 바꾸거나 AI에게 “H-00x 완료”라고 알려주세요.  
> **정본:** 이 파일 · **에이전트 규칙:** `doc/for_agent/28_human_action_items.md`

코딩을 몰라도 됩니다. **막혀 있는 일만** 모아 둔 체크리스트입니다. AI는 이 항목 때문에 **다른 작업을 멈추지 않고** 미룬 뒤, 여기에 기록합니다.

---

## 오늘 가장 먼저

| 순서 | 문서 |
|------|------|
| 전체 순서 | **[00_pre_launch_order.md](./00_pre_launch_order.md)** |
| SQL 5분 | **[29_supabase_bundle_sql.md](./29_supabase_bundle_sql.md)** |
| AI 리포트 10분 | **[30_edge_ai_report.md](./30_edge_ai_report.md)** |
| RLS 결정 3분 | **[31_rls_beta_decision.md](./31_rls_beta_decision.md)** |
| 회고록 SQL 3분 | **[32_retrospective_sql.md](./32_retrospective_sql.md)** |
| CI 시크릿 10분 | **[34_github_ci_secrets.md](./34_github_ci_secrets.md)** |
| SQL 후 확인 5분 | **[35_smoke_test_after_bundle.md](./35_smoke_test_after_bundle.md)** |
| 리포트 집계 3분 | **[37_verify_ai_report.md](./37_verify_ai_report.md)** |
| 김학생 아카이브 시드 5분 | **[38_archived_kim_student_setup.md](./38_archived_kim_student_setup.md)** |
| **원클릭 SQL (권장)** | `npm run supabase:apply-remote-full` → `supabase/apply_remote_full.sql` |

---

## 지금 막혀 있는 일 (미완료)

| 체크 | ID | 우선순위 | 할 일 | 왜 필요한지 | 완료 확인 방법 |
|------|----|----------|------|-------------|----------------|
| [ ] | H-001 | 높음 | RLS Beta 결정 — **[31](./31_rls_beta_decision.md)** · 승인 후 **[33 JWT](./33_firebase_supabase_jwt_setup.md)** | DB 행 단위 보안 | “RLS 적용 승인” 또는 “RLS 보류” |
| [ ] | H-002 | 높음 | AI 리포트 Edge 배포 — **[30_edge_ai_report.md](./30_edge_ai_report.md)** | 마이페이지 AI 문단 생성 | 「AI 리포트 생성」 501 아님 |
| [ ] | H-003 | 중간 | 로컬 `.env`에 `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` (Firebase **학생** 테스트 계정 권장) | 로컬 E2E 10플로우 | `npm run test:e2e` 전체 통과 (번들 SQL 후) |
| [ ] | H-004 | 중간 | GitHub Secrets — **[34_github_ci_secrets.md](./34_github_ci_secrets.md)** (`E2E_*`, `VITE_*`, 선택 `E2E_PROFESSOR_*`) | PR마다 CI E2E | 「H-004 완료」 |
| [ ] | H-005 | 낮음 | **프로덕션 배포** GO/NO-GO — [`deploy_vercel_checklist.md`](../for_agent/deploy_vercel_checklist.md) 따라 Vercel 연결·`VITE_*` 설정 | 실제 서비스 공개 | 배포 URL 공유 |
| [ ] | H-006 | 낮음 | 이용약관·개인정보·학교 AI 사용 규정 확인 | 런칭 전 법무 | 내부 승인 메모 |
| [ ] | H-007 | 중간 | Supabase **번들 v2** — **H-011 `apply_remote_full.sql` 권장** (피드백·평가·회고 포함) · [38](./38_archived_kim_student_setup.md) | 팀 상세 쓰기 테이블 | `npm run human:verify` (H-007 `[o]`) |
| [ ] | H-008 | 중간 | 동료평가 — **H-011에 포함** · 개별: `20260520094800_ai_team_detail_peer_reviews.sql` | 팀 동료평가 DB | `npm run human:verify` (H-008 `[o]`) |
| [ ] | H-009 | 중간 | 회고록 — **H-011에 포함** · [32](./32_retrospective_sql.md) | 회고록 DB | `npm run human:verify` (H-009 `[o]`) |
| [ ] | H-010 | 중간 | 교수 평가 — **H-011에 포함** | 교수 학생·프로젝트 평가 | `npm run human:verify` (H-010 `[o]`) |
| [ ] | H-011 | 높음 | **원클릭 SQL** — `npm run supabase:apply-remote-full` 후 Supabase에서 **`supabase/apply_remote_full.sql`** Run · 가이드 [38](./38_archived_kim_student_setup.md) | vision #35·#46 평가·아카이브 리포트 | `npm run verify:archived-kim` → `evalReady: true` (2026-05-21 MCP 적용·검증 통과 — 인간 `[o]` 확인) |

---

## 완료한 일

| ID | 완료 시각 | 할 일 |
|----|-----------|------|
| H-000 | 2026-05-19 (이전) | Firebase·Supabase `.env` 로컬 연결 (`VITE_*`) |

---

## 자동 검증 메모 (최신 20건)

| 시각 | ID | 결과 | 메모 |
|------|----|------|------|
| 2026-05-21 | H-011 | pass (agent) | `verify:archived-kim` evalReady·reportOk true — 인간 `[o]` 대기 |

---

## AI가 세션 시작·종료할 때 하는 확인

1. 이 파일을 연다.
2. `미완료` 표에서 체크가 `[o]`인 행을 우선 찾는다.
3. `[o]` 행은 「완료 확인 방법」 기준으로 기능 동작을 실제 검증한다 (`.env` 키 존재, 사용자 완료 발언, E2E/화면 확인 등).
4. 검증 통과 시 **완료한 일** 표로 옮기고 `완료 시각` 기록, 실패 시 체크를 `[ ]`로 되돌리고 사유를 남긴다.
5. 새로 막힌 일이 생기면 **미완료**에 행 추가 (ID `H-00x` 증가).
6. `25_ai_work_log.md` 맨 위에 오늘 AI 작업 기록 (시분초).

빠른 점검(선택): `npm run human:checked`  
→ `[o]`로 체크된 H-항목 ID와 검증 기준을 바로 출력

검증 실행(선택): `npm run human:verify`  
→ `[o]`로 체크된 H-항목을 자동 검증 가능한 범위에서 즉시 확인 (`fail`가 있으면 AI가 체크를 되돌리고 사유 기록)

엄격 검증(선택): `npm run human:verify:strict`  
→ `human:verify` + (해당 시) H-003 스모크 테스트까지 포함해 더 강하게 확인

JSON 결과(선택): `npm run human:verify:json`  
→ 자동화/공유용 구조화 결과(JSON) 출력

CI용(선택): `npm run human:verify:ci`  
→ strict + manual 항목도 실패로 간주해 엄격 게이트로 사용

반자동 동기화(선택): `npm run human:sync`  
→ `[o]` 항목을 preview로 검사하고, 자동 검증 pass 항목/실패 복귀 항목을 요약

반자동 동기화 적용(선택): `npm run human:sync:apply`  
→ pass 항목은 완료표로 이동, fail 항목은 체크를 `[ ]`로 되돌림
→ 결과는 아래 「자동 검증 메모」에 최신 20건 누적 기록

**AI는 미완료 항목이 있어도** 블로커가 아닌 다른 TODO·코드·문서 작업을 **계속** 할 수 있습니다.

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| `25_ai_work_log.md` | AI가 한 일 (시간순, 최신 위) |
| `01_project_status.md` | 프로젝트 전체 상태 |
| `doc/for_agent/25_human_collaboration.md` | 인간 전용 작업 12가지 유형 |


