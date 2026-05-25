# Supabase — 피드백·동료평가 테이블 만들기 (5분)

> **2026-05-25 이후:** 일상적인 DB·Storage 작업은 **인간이 SQL Editor를 쓰지 않습니다.**  
> Cursor **Supabase MCP**만 연결해 두면 AI가 `apply_migration`으로 원격에 맞춥니다.  
> **정본:** `doc/for_agent/33_supabase_mcp_db_operations.md`

아래 SQL Editor 절차는 **과거(H-007·H-008 초기 세팅)** 참고용입니다. 이미 H-011·MCP로 적용된 환경에서는 **건너뛰어도 됩니다.**

> **한 번만 하면 됩니다.** 완료 후 팀 상세에서 피드백·동료평가가 새로고침 후에도 남습니다.  
> **관련:** `28_human_action_items.md` H-007 · H-008 (완료)

## 1. Supabase 대시보드 열기 (레거시 — MCP 우선)

프로젝트 → 왼쪽 **SQL Editor** → **New query**

## 2. SQL 파일 내용 붙여넣기

**가장 쉬운 방법 (vision #35·#46):**

1. `npm run supabase:apply-remote-full`
2. `supabase/apply_remote_full.sql` 전체 복사 → SQL Editor → Run

**테이블만 (시드 제외):** `supabase/migrations/20260520102000_team_detail_writes_bundle_v2.sql`  
**이전 (v1):** `supabase/migrations/20260520095400_team_detail_writes_bundle.sql`

## 3. Run 실행

하단 **Run** (또는 Ctrl+Enter). 에러 없이 Success면 OK.

## 4. 확인

1. 브라우저에서 CampusConnect 로그인  
2. 수업 → 팀 **입장하기**  
3. 아래로 스크롤 → 피드백 **완료** → 새로고침 → 유지되는지 확인  
4. **조원 평가** → 키워드 선택 → **등록 완료** → 새로고침 → **✓ 등록됨** 유지

## 5. 스모크 테스트 (5분)

→ **[35_smoke_test_after_bundle.md](./35_smoke_test_after_bundle.md)**

## 6. AI에게 알리기

채팅에 **「H-007 완료」** · **「번들 v2 실행함」** 또는 **「스모크 테스트 OK」**

## 문제 해결

| 증상 | 조치 |
|------|------|
| 피드백 저장 실패 알림 | 2~3단계 SQL 재실행 |
| 조원 평가 버튼이 없음 | 학생 계정·**진행 중** 수업인지 확인 (종료 수업 X) |
| E2E 실패 | `.env`에 `E2E_TEST_*` + 위 SQL 완료 후 `npm run test:e2e` |
