# 프로젝트 현재 상태

> **관련:** `doc/for_agent/02_current_state.md` · `26_vision_features_status.md` · `28_human_action_items.md`  
> **날짜:** 2026년 6월 9일  
> **단계:** Beta (~88%)

## 한눈에 보기

| 항목 | 상태 | 쉬운 설명 |
|------|------|-----------|
| 화면 | 약 97% | M3·수업 스코프 네비·강의자료·공지·1:1 DM·강의계획서 검색 |
| DB 읽기 | 약 72% | 수업·팀·Q&A·프로필·카탈로그·강의계획서 |
| 글쓰기·수정 | 약 68% | Q&A·채팅·피드백·동료평가·회고·교수 평가·산출물·공지·DM |
| 로그인·보안 | 약 58% | Firebase, JWT 준비(기본 off), /app 보호 |
| AI 리포트 | 약 82% | DB 집계 + Gemini Edge; 마이페이지·팀 트러블슈팅·폴더 산출물 |
| 인터넷 공개 | 배포됨 | https://git-test-cp.vercel.app (H-005 완료) |

**전체 진행률: 약 88%** (vision #1~#163 · E2E 48 코어 플로우)

**최근 (2026-06-09):** 교수 프로필 `student_growth_approach`(추구하는 학생 성장 방식) · 강의 카탈로그·강의계획서 검색 · 수업 스테이지·공지·1:1 DM · 폴더 산출물 AI

## 이미 되는 것

- 로그인 후 **현재/종료 수업**, Q&A·트러블슈팅·산출물(파일·링크·폴더)·**팀 채팅(Realtime)**
- 팀 **피드백·동료평가·회고록** · 교수 **평가·제출 현황** 조회
- 마이페이지 **리포트 3페이지·A4·역량 진단** — 진입 시 Gemini 자동 채움 (H-002)
- **내 정보** `/app/mypage/profile` · 교수 프로필 `/app/profile/professor` (강의 스타일·성장 방식)
- **수강자들** 교수 카드 그리드 · 프로필 모달에 교수 성장 방식 표시
- **공지 게시판** · **1:1 DM** · **강의계획서 검색** (`/app/syllabi`)
- **강의 카탈로그** 검색·자율 입장 (수업 페이지)
- E2E **48** 코어 플로우 + `test:e2e:smoke` · peer-network · user-journeys

## 아직 안 되는 것

- DB **RLS 강화** 적용 (→ H-001, 승인 후 [rls_staging_verification.md](../for_agent/rls_staging_verification.md))
- CI E2E 시크릿 (→ H-004)
- 이용약관·개인정보 확인 (→ H-006)

## 당신이 해줄 일 (순서)

1. [31](./31_rls_beta_decision.md) RLS 결정 (H-001)  
2. [34](./34_github_ci_secrets.md) CI 시크릿 (H-004)  
3. [35](./35_smoke_test_after_bundle.md) 5분 확인  
4. [37](./37_verify_ai_report.md) 리포트 집계 3분  

**완료됨:** H-002 Gemini Edge · H-005 배포 · H-011 번들 v2 · H-012 강의자료·DM SQL

전체: **`28_human_action_items.md`** · **`00_pre_launch_order.md`**

## 개발 상세

`doc/for_agent/02_current_state.md` · `doc/for_agent/05_todo.md`
