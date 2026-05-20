# 프로젝트 현재 상태

> **관련:** `doc/for_agent/02_current_state.md` · `26_vision_features_status.md` · `28_human_action_items.md`  
> **날짜:** 2026년 5월 20일  
> **단계:** Alpha → Beta 진입 (~70%)

## 한눈에 보기

| 항목 | 상태 | 쉬운 설명 |
|------|------|-----------|
| 화면 | 약 78% | 마이페이지 리포트·A4·팀 카드 DB |
| DB 읽기 | 약 60% | 수업·팀·Q&A·프로필 |
| 글쓰기·수정 | 약 55% | Q&A·채팅·피드백·동료평가·회고·교수 평가·파일 |
| 로그인·보안 | 약 58% | Firebase, JWT 준비(기본 off), /app 보호 |
| AI 리포트 | 약 65% | DB·A4·마이페이지 집계; Edge 배포 후 OPENAI 없어도 초안 200 |
| 인터넷 공개 | 0% | Vercel 체크리스트만 (H-005) |

**전체 진행률: 약 70%** (vision 추가요청 1~12 완료)

## 이미 되는 것

- 로그인 후 **현재/종료 수업**, Q&A·트러블슈팅·산출물·**팀 채팅(Realtime)**
- 팀 **피드백·동료평가·회고록** (번들 v2 SQL 후)
- 교수 **평가·팀 제출 현황** 조회 (번들 v2 SQL 후)
- 마이페이지 **리포트 3페이지·A4·역량 진단(DB 추정)** — 집계: 피드백·회고·동료·교수평가
- Edge **배포 후** 「AI 리포트 생성」→ OPENAI 없으면 **DB 초안**, 키 있으면 LLM
- E2E **31플로우** + `test:e2e:smoke` (핵심 회귀 빠른 점검 커맨드 포함)

## 아직 안 되는 것

- AI **LLM 문단** (OPENAI Secret → H-002)
- DB **RLS 강화** 적용 (→ H-001, 승인 후 [rls_staging_verification.md](../for_agent/rls_staging_verification.md))
- **공개 배포** (→ H-005)

## 당신이 해줄 일 (순서)

1. [29](./29_supabase_bundle_sql.md) 번들 v2 SQL  
2. [35](./35_smoke_test_after_bundle.md) 5분 확인  
3. [37](./37_verify_ai_report.md) 리포트 집계 3분  
4. [34](./34_github_ci_secrets.md) CI 시크릿  
5. [30](./30_edge_ai_report.md) Edge deploy (+ OPENAI 선택)  
6. [31](./31_rls_beta_decision.md) RLS 결정  

전체: **`28_human_action_items.md`** · **`00_pre_launch_order.md`**

## 개발 상세

`doc/for_agent/05_todo.md`
