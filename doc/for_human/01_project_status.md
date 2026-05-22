# 프로젝트 현재 상태

> **관련:** `doc/for_agent/02_current_state.md` · `26_vision_features_status.md` · `28_human_action_items.md`  
> **날짜:** 2026년 5월 22일 (23:30 갱신)  
> **단계:** Alpha → Beta 진입 (~84%)

## 한눈에 보기

| 항목 | 상태 | 쉬운 설명 |
|------|------|-----------|
| 화면 | 약 92% | M3·마이페이지 `/mypage/profile` · 수강자들·로그인 UX |
| DB 읽기 | 약 65% | 수업·팀·Q&A·프로필 |
| 글쓰기·수정 | 약 56% | Q&A·채팅·피드백·동료평가·회고·교수 평가·학번·학교 |
| 로그인·보안 | 약 58% | Firebase, JWT 준비(기본 off), /app 보호 |
| AI 리포트 | 약 78% | DB 집계 + Gemini; 마이페이지 자동 AI 채움 |
| 인터넷 공개 | 배포됨 | https://campusconnect.vercel.app (H-005 완료) |

**전체 진행률: 약 84%** (vision #1~#59 · 대화창 C-260522-1~54)

**최근:** vision #56~59(프로필 여백·로그인 푸터·수강자들→내 정보 페이지) · `260522-45`~`47` · [`29`](./29_vision_requests_report.md) §상세 · 기록 분류(C-54)

## 이미 되는 것

- 로그인 후 **현재/종료 수업**, Q&A·트러블슈팅·산출물·**팀 채팅(Realtime)**
- 팀 **피드백·동료평가·회고록** (번들 v2 SQL 후)
- 교수 **평가·팀 제출 현황** 조회 (번들 v2 SQL 후)
- 마이페이지 **리포트 3페이지·A4·역량 진단(DB 추정)** — 집계: 피드백·회고·동료·교수평가
- 마이페이지 리포트 **자동 AI 채움** (Gemini Secret `GEMINI_API_KEY`)
- **내 정보** 전용 페이지 `/app/mypage/profile` (학번·학교·태그 저장)
- 로그인(`/`) 화면 푸터 없음 · 수강자들 「내 정보 수정」= 마이페이지와 동일
- E2E **49**건 + `test:e2e:smoke`

## 아직 안 되는 것

- DB **RLS 강화** 적용 (→ H-001, 승인 후 [rls_staging_verification.md](../for_agent/rls_staging_verification.md))

## 당신이 해줄 일 (순서)

1. [29](./29_supabase_bundle_sql.md) 번들 v2 SQL (H-011 완료 시 생략 가능)  
2. [35](./35_smoke_test_after_bundle.md) 5분 확인  
3. [37](./37_verify_ai_report.md) 리포트 집계 3분 (AI 문단은 H-002 완료 — 동작만 확인)  
4. [34](./34_github_ci_secrets.md) CI 시크릿 (H-004)  
5. [31](./31_rls_beta_decision.md) RLS 결정 (H-001)  

**완료됨:** H-002 Gemini Edge · H-005 배포 — AI 문단 문제 시만 [30](./30_edge_ai_report.md) 참고

전체: **`28_human_action_items.md`** · **`00_pre_launch_order.md`**

## 개발 상세

`doc/for_agent/05_todo.md`
