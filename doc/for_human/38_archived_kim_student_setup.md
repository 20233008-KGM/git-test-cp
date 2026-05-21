# 아카이브 김학생 시드 — 리포트·평가 검증 (5분)

> vision **#35** · **#36** · **#46**  
> 로그인: Firebase **김학생** 계정 (`ai_users.id` = `673b60f9-3c6c-4ed4-847a-e24536c472a5` 와 연결된 계정)

---

## 1. Supabase SQL 실행 순서

> **에이전트(MCP):** 2026-05-21 세션에서 `team_detail_writes_bundle_v2` 마이그레이션 + `archived_evals_kim_student` 시드가 원격에 적용됨. 재실행은 `ON CONFLICT`로 안전.

### 한 번에 (권장)

1. 로컬에서 생성: `npm run supabase:apply-remote-full`
2. Supabase SQL Editor에 **`supabase/apply_remote_full.sql`** 전체 붙여넣기 → Run  
   (bundle v2 + 김학생 아카이브·평가 시드 포함)

### 나눠서 실행

1. **번들 v2** (평가·회고 테이블 — **필수**, 먼저): `supabase/migrations/20260520102000_team_detail_writes_bundle_v2.sql`  
   → 미적용 시 앱에 「평가 DB 테이블이 아직 준비되지 않았습니다」 배너가 뜹니다.
2. **시드:** `supabase/seed/archived_kim_student_bundle.sql`  
   (재생성: `npm run seed:archived-bundle` — 평가·회고록 포함)

Supabase Dashboard → SQL Editor → 파일 내용 붙여넣기 → Run.

---

## 2. 웹에서 확인

| 확인 | 경로 |
|------|------|
| 리포트 팀플 카드 | 마이페이지 → PAGE 02 → 종료 팀플 카드 표시 |
| 과거 수업 | 마이페이지 왼쪽 「과거 수업」 → 전용 페이지에서 목록 로드 |
| 내 조원평가 | 종료 수업 → 사이드 「내 조원평가」 |
| 교수 평가 | 종료 수업 → 사이드 「교수 평가」 |
| 집계 새로고침 | 마이페이지 「집계 새로고침」 |

리포트에 팀이 없으면 PAGE 02에 시드 안내 박스가 보입니다.

---

## 3. E2E (선택)

`.env`에 `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (김학생 Firebase 계정) 설정 후:

```bash
npm run test:e2e:smoke
```

---

## 4. 인간 체크리스트

`28_human_action_items.md` **H-011** — `verify:archived-kim`에서 `evalReady: true`면 완료 처리.

## 5. 자동 점검 (선택)

`.env`에 Supabase URL·anon key가 있으면:

```bash
npm run verify:archived-kim
```

`archivedTeamsForReport` > 0 이면 마이페이지 리포트에 팀플이 나올 수 있는 상태입니다.

`evalByArchivedTeam` 에서 **SWE·OOP** 팀 모두 `ready: true` 이면 두 종료 수업에서 평가 조회가 가능합니다.

`feedbackCount` ≥ 2 이면 팀 워크스페이스 피드백 제출 데모 데이터가 준비된 상태입니다.

**자동 검증:** `npm run verify:archived-kim:json` · H-011에 `[o]` 표시 후 `npm run human:verify`

## 6. 완료 표시

검증 후 `28_human_action_items.md`에서 관련 항목에 `[o]` 또는 AI에게 「H-007 완료」 등 알림.
