# Supabase — 피드백·동료평가 테이블 만들기 (5분)

> **한 번만 하면 됩니다.** 완료 후 팀 상세에서 피드백·동료평가가 새로고침 후에도 남습니다.  
> **관련:** `28_human_action_items.md` H-007 · H-008

## 1. Supabase 대시보드 열기

프로젝트 → 왼쪽 **SQL Editor** → **New query**

## 2. SQL 파일 내용 붙여넣기

로컬 프로젝트에서 아래 파일을 연 뒤 **전체 복사** → SQL Editor에 붙여넣기:

**권장 (v2, 전체):** `supabase/migrations/20260520102000_team_detail_writes_bundle_v2.sql`  
(피드백·동료평가·회고록·교수 평가 한 번에)

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
