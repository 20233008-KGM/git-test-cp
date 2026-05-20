# AI가 한 일 — 작업 일지 (인간용)

> **기술·인수인계:** `doc/for_agent/17_handoff.md` · **할 일:** `doc/for_agent/05_todo.md`  
> **정렬:** **최신 작업이 문서 맨 위** · 각 항목에 **작업 시각(시·분·초)** 기록

코딩을 몰라도 괜찮습니다. 채팅이 끊겨도 “AI가 무엇을 했는지” 따라갈 수 있는 **일기**입니다.

---

## 이 문서를 언제 보나요?

| 상황 | 여기서 볼 것 |
|------|----------------|
| “방금 AI 뭐 했지?” | **맨 위** 첫 번째 항목 |
| 전체 흐름 | **타임라인 표** (최신 → 과거) |
| 내가 해야 할 일 | 각 항목 **당신이 할 일** |

---

## AI 기록 규칙 (에이전트 필수)

작업 세션이 끝날 때마다 **반드시** 이 파일에 항목을 추가한다.

| 규칙 | 내용 |
|------|------|
| 위치 | **문서 맨 위**(「최근 작업 로그」 첫 항목)에 **삽입** — 맨 아래 추가 금지 |
| 시각 | `YYYY-MM-DD HH:mm:ss` (로컬, 시·분·초까지) |
| 형식 | 아래 **기록용 템플릿** |
| **계획** | 세션에 `plans/YYMMDD-N.md`가 있으면 **경로 + 한 줄 요약** (`## 오늘 목표 (한 줄)`과 동일·유사). 단발 요청만 있으면 `(채팅 요청) …` |
| 체크리스트 | `23_agent_operating_rules.md` 종료 체크리스트 |

---

## 최근 작업 로그 (최신 → 과거)

### 2026-05-20 10:48:46 — A4 성장 회고 DB 초안

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-27.md`](doc/for_agent/plans/260520-27.md) |
| **한 일** | `growth_reflection`을 회고·평가 스니펫으로 채움, README·01·37 갱신. |
| **당신이 할 일** | [37](./37_verify_ai_report.md) #4 성장 회고 문단 확인 |

---

### 2026-05-20 10:46:02 — 피드백·동료평가 스니펫

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-26.md`](doc/for_agent/plans/260520-26.md) |
| **한 일** | 팀 피드백·동료평가 본문을 A4·Edge LLM 컨텍스트에 반영. |
| **당신이 할 일** | 번들 v2 후 [37](./37_verify_ai_report.md) 팀 섹션 4줄 확인 |

---

### 2026-05-20 10:43:58 — 회고록 스니펫 → AI 리포트

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-25.md`](doc/for_agent/plans/260520-25.md) |
| **한 일** | `gatherContext`·Edge에 회고 `sections` 요약, A4 팀 섹션 「회고 요약」. |
| **당신이 할 일** | 회고록 저장 후 [37](./37_verify_ai_report.md) A4 섹션 확인 |

---

### 2026-05-20 10:41:37 — 런칭 문서·37 리포트 검증 가이드

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-24.md`](doc/for_agent/plans/260520-24.md) |
| **한 일** | `37_verify_ai_report.md`, Vercel 체크리스트 v2, 상태 doc·런칭 한 페이지 링크. |
| **당신이 할 일** | 번들 v2 → [35](./35_smoke_test_after_bundle.md) → [37](./37_verify_ai_report.md) |

---

### 2026-05-20 10:38:20 — AI 리포트 교수 평가 집계

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-23.md`](doc/for_agent/plans/260520-23.md) |
| **한 일** | `gatherAiReportContext`·Edge에 교수 학생·프로젝트 평가 반영, 마이페이지 집계 줄 갱신. |
| **당신이 할 일** | 번들 v2 → 교수 평가 입력 후 마이페이지 **교수평가 N/M팀** 확인 |

---

### 2026-05-20 10:36:46 — E2E·스모크 집계 요약

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-22.md`](doc/for_agent/plans/260520-22.md) |
| **한 일** | E2E #6 `report-activity-summary`, 스모크·AI 문서 동기화. |
| **당신이 할 일** | 번들 v2 후 [35](./35_smoke_test_after_bundle.md) #0 |

---

### 2026-05-20 10:34:34 — Edge 리포트 집계 동기화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-21.md`](doc/for_agent/plans/260520-21.md) — Edge·MyPage·vision |
| **한 일** | `generate-report` gatherContext에 피드백·회고·동료평가, 마이페이지 집계 한 줄 표시. |
| **당신이 할 일** | H-002 시 Edge deploy — [30](./30_edge_ai_report.md) |

---

### 2026-05-20 10:32:22 — AI 리포트 집계 확장

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-20.md`](doc/for_agent/plans/260520-20.md) — gatherContext 피드백·회고·동료평가 |
| **한 일** | `ai-report.ts` 집계·초안 문구, `01_project_status`, [36 런칭 한 페이지](./36_launch_one_pager.md). |
| **당신이 할 일** | [36번](./36_launch_one_pager.md) 순서대로 H-007부터 |

---

### 2026-05-20 10:29:51 — handoff·스모크 테스트·교수 동료평가 조회

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-19.md`](doc/for_agent/plans/260520-19.md) — 17·RLS·35 스모크 |
| **한 일** | `17_handoff` 전면 갱신, `35_smoke_test`, RLS 패킷, 교수 동료평가 목록. |
| **당신이 할 일** | 번들 v2 후 [35번](./35_smoke_test_after_bundle.md) 5분 확인 |

---

### 2026-05-20 10:27:42 — Firebase JWT 스캐폴드 + CI 가이드

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-18.md`](doc/for_agent/plans/260520-18.md) — JWT 동기화(기본 off) + H-004 |
| **한 일** | `supabase-firebase-auth.ts`, AuthContext 연동, `e2e.yml` 교수 시크릿, [34](./34_github_ci_secrets.md). |
| **당신이 할 일** | [34번](./34_github_ci_secrets.md) Secrets 등록 → 「H-004 완료」 |

---

### 2026-05-20 10:24:57 — 교수 제출 조회 + JWT 가이드

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-17.md`](doc/for_agent/plans/260520-17.md) — 교수 팀 제출물 + H-001 JWT |
| **한 일** | 팀 제출 현황 패널, `33_firebase_supabase_jwt_setup`, E2E #12·`.env.example`. |
| **당신이 할 일** | RLS 승인 시 [33번](./33_firebase_supabase_jwt_setup.md) · 번들 v2 미실행 시 [29번](./29_supabase_bundle_sql.md) |

---

### 2026-05-20 10:18:18 — SQL 번들 v2 + 교수 평가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-16.md`](doc/for_agent/plans/260520-16.md) — 번들 v2 + 교수 평가 DB |
| **한 일** | `team_detail_writes_bundle_v2.sql`, 교수 학생·프로젝트 평가 API/UI, AI 진행 요약 실데이터. |
| **당신이 할 일** | [29번](./29_supabase_bundle_sql.md) **번들 v2** 한 번 실행 → 「번들 v2 실행함」 |

---

### 2026-05-20 10:07:19 — 팀 회고록 DB 저장

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-15.md`](doc/for_agent/plans/260520-15.md) — 회고록 DB·UI·E2E #11 |
| **한 일** | `ai_team_detail_retrospectives`, API·TeamDetail 모달, H-009 가이드, E2E #11. |
| **당신이 할 일** | [32번](./32_retrospective_sql.md) SQL 실행 후 「H-009 완료」 |

---

### 2026-05-20 10:05:56 — H-001 RLS 인간 가이드

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-14.md`](doc/for_agent/plans/260520-14.md) — RLS 결정 가이드 + starter·보안 |
| **한 일** | `31_rls_beta_decision.md`, starter §7 갱신, 22·19·28·README 링크. |
| **당신이 할 일** | [31번](./31_rls_beta_decision.md) 읽고 「RLS 적용 승인」 또는 「RLS 보류」 |

---

### 2026-05-20 10:04:27 — vision·개요 doc 동기화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-13.md`](doc/for_agent/plans/260520-13.md) — 26·00·00_start_here 오늘 기능 반영 |
| **한 일** | 채팅·피드백·동료평가·Edge 코드 상태를 인간/에이전트 개요 문서에 통일. 진행률 ~55%. |
| **당신이 할 일** | 없음 (문서만) |

---

### 2026-05-20 10:03:00 — H-002 가이드 + Realtime + 런칭 순서

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-12.md`](doc/for_agent/plans/260520-12.md) — Edge 인간 가이드·Realtime SQL |
| **한 일** | `30_edge_ai_report.md`, `00_pre_launch_order.md`, `realtime_chat.sql`. 01·02·28·17 갱신. |
| **당신이 할 일** | [00_pre_launch_order.md](./00_pre_launch_order.md) 표 순서대로 진행 |

---

### 2026-05-20 10:01:20 — E2E #10 동료평가 + SQL 가이드

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-11.md`](doc/for_agent/plans/260520-11.md) — 동료평가 E2E + 인간 SQL 5분 가이드 |
| **한 일** | E2E #10, `peer-review-submit-*` testid. `for_human/29_supabase_bundle_sql.md`, 28 상단 링크. |
| **당신이 할 일** | [29번 문서](./29_supabase_bundle_sql.md) 따라 번들 SQL 실행 → 「H-007 완료」 알림 |

---

### 2026-05-20 09:59:43 — E2E #9 피드백 + 백엔드 doc

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-10.md`](doc/for_agent/plans/260520-10.md) — 피드백 E2E + 07_backend |
| **한 일** | E2E #9, `data-testid=team-feedback-submit`. `07_backend.md`·`14_testing.md` 갱신. |
| **당신이 할 일** | E2E green: `.env` 자격증명 + 번들 SQL(H-007) 후 `npm run test:e2e` |

---

### 2026-05-20 09:54:31 — DB 번들 SQL + API·ADR

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-9.md`](doc/for_agent/plans/260520-9.md) — H-007·H-008 통합 SQL, 11_api_spec, ADR-012 |
| **한 일** | `team_detail_writes_bundle.sql`, `migrations/README.md`. API 명세·RLS 권장 경로(Third-Party Firebase) 문서화. |
| **당신이 할 일** | Supabase에서 **번들 SQL 1회** 실행 (`28` H-007 참고). |

---

### 2026-05-20 09:48:50 — 동료평가 DB + TeamDetail 복구

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-8.md`](doc/for_agent/plans/260520-8.md) — 동료평가 저장 + 본인 이름 실데이터 |
| **한 일** | `ai_team_detail_peer_reviews` 마이그레이션·API. TeamDetail에 채팅·피드백·동료평가 연동 재적용. H-008 추가. |
| **당신이 할 일** | **H-008** SQL 실행. (H-007 피드백 SQL도 미실행 시 함께) |

---

### 2026-05-20 09:47:20 — T-042 배포 체크리스트 + CI build

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-7.md`](doc/for_agent/plans/260520-7.md) — Vercel 배포 문서 + PR 빌드 CI |
| **한 일** | `deploy_vercel_checklist.md`, `.github/workflows/build.yml`, 13·04·28 H-005 링크. |
| **당신이 할 일** | **H-005**: 체크리스트 따라 Vercel 배포 GO 후 URL 공유. |

---

### 2026-05-20 09:45:19 — 팀 피드백 DB + RLS 보강

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-6.md`](doc/for_agent/plans/260520-6.md) — 피드백 저장 + T-011 패키지 |
| **한 일** | `ai_team_detail_feedbacks` 마이그레이션·API·TeamDetail 연동. RLS 패킷·draft SQL에 chat/feedback 반영. |
| **당신이 할 일** | **H-007**: `supabase/migrations/20260520094500_ai_team_detail_feedbacks.sql` Supabase에서 실행 |

---

### 2026-05-20 09:42:46 — Edge generate-report + E2E 채팅

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-5.md`](doc/for_agent/plans/260520-5.md) — AI 리포트 Edge Function + E2E #8 |
| **한 일** | `supabase/functions/generate-report` (OPENAI 없으면 501, 있으면 gpt-4o-mini). E2E 채팅 전송. H-002 배포 가이드. |
| **당신이 할 일** | **H-002**: OpenAI 키 → Supabase Secret → `supabase functions deploy generate-report` |

---

### 2026-05-20 09:37:56 — 팀 채팅 DB 저장 + Realtime

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-4.md`](doc/for_agent/plans/260520-4.md) — 팀 상세 채팅을 Supabase에 저장하고 Realtime으로 반영 |
| **한 일** | `api.teamDetail.sendChatMessage` 추가. TeamDetailPage 전송·INSERT 구독. 종료 수업은 전송 차단 유지. `npm run build` OK. |
| **당신이 할 일** | 팀 상세 → 채팅방에서 메시지 전송·새로고침 후 유지 확인. RLS 강화는 **H-001**. |

---

### 2026-05-20 01:10:15 — doc 전반 최신화·교차 참조

| 항목 | 내용 |
|------|------|
| **계획** | (채팅 요청) `doc/` 전체를 현재 코드·DB 상태에 맞게 갱신, 문서 간 참조 보완 |
| **한 일** | `02`·`05`·`27`·`26`(human/agent)·로드맵·AI·E2E·폴더 구조·인수인계 등 20+ 파일 수정. 진행률 ~52%, CRUD·리포트·종료 수업 반영. `28`·`plans` 링크 통일. |
| **당신이 할 일** | 없음 |

---

### 2026-05-20 00:35:42 — 김학생 종료 수업 더미 데이터

| 항목 | 내용 |
|------|------|
| **계획** | (채팅 요청) 김학생 계정에 종료(archived) 수업 2건·팀·Q&A·워크스페이스까지 실수업 수준 시드 |
| **한 일** | Supabase에 종료(archived) 수업 2개·팀·Q&A·트러블슈팅 등 전체 시드 삽입 |
| **수업** | 소프트웨어공학(2025-2), 객체지향프로그래밍(2025-1) |
| **확인** | 김학생 로그인 → 수업 목록 **「종료된 수업」** 탭 |

시드 SQL: `supabase/seed/archived_courses_kim_student.sql`

---

### 2026-05-20 00:22:18 — 리포트 2·3페이지 DB 연동

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-3.md`](doc/for_agent/plans/260520-3.md) — 트러블슈팅 상세 집계 + 마이페이지 리포트 2·3페이지 실데이터 |
| **한 일** | `gatherContext`에 트러블슈팅 사례 집계. 마이페이지 2페이지=팀 스냅샷, 3페이지=실제 로그(없으면 데모). E2E #7 페이지 전환. |
| **당신이 할 일** | 팀 워크스페이스에 트러블슈팅을 남기면 3페이지에 실데이터가 표시됩니다. AI 문단은 **H-002** 후. |

---

### 2026-05-20 00:12:45 — 리포트 요약 실데이터 + Vercel 준비

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-2.md`](doc/for_agent/plans/260520-2.md) — 리포트 1페이지 Supabase 통계 + Vercel SPA 준비 |
| **한 일** | 마이페이지 리포트 1페이지: `api.aiReport.gatherContext`로 팀·진행률·트러블슈팅·산출물 통계 표시. 분석일·범위 문구 동적화. 루트 `vercel.json` 추가(SPA). |
| **당신이 할 일** | 실제 배포는 **H-005** 승인 후 Vercel에 GitHub 연결·환경변수 설정. |

---

### 2026-05-20 00:04:28 — 마이페이지 프로젝트 DB 연동

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-1.md`](doc/for_agent/plans/260520-1.md) — 마이페이지 포트폴리오 DB·팀 집계 + 리포트 미리보기 E2E |
| **한 일** | `getProjectsForUser`, MyPage 동적 로드, E2E #6(리포트 미리보기) |
| **당신이 할 일** | 팀 배정 후 마이페이지 2페이지에서 Supabase 집계 카드 확인 |

---

### 2026-05-19 23:59:45 — 리포트 DB 집계 + A4 인쇄 미리보기

| 항목 | 내용 |
|------|------|
| **계획** | [`260519-3.md`](doc/for_agent/plans/260519-3.md) — DB 활동 집계 + A4 인쇄 UI (LLM은 H-002 대기) |
| **한 일** | `gatherContext` / `buildDraftFromContext`, `AiReportPrintView`, 마이페이지 미리보기·인쇄 버튼 |
| **당신이 할 일** | 마이페이지 미리보기 확인. AI 요약은 **H-002** 후 |

---

### 2026-05-19 23:55:05 — 인간 액션 대기 목록 (`28`) · 미루고 계속

| 항목 | 내용 |
|------|------|
| **계획** | (정책·문서 세션) 인간 전용 작업은 `28`에 기록하고 AI 작업은 계속 |
| **한 일** | `28_human_action_items.md` 신설, ADR-011·`starter.txt`·협업 규칙 반영 |
| **당신이 할 일** | `28_human_action_items.md` 열어 미완료(H-001~) 확인 |

---

### 2026-05-19 23:53:32 — 작업 일지 규칙 · (구) 인간 협업 중단

**한 일**
- `25_ai_work_log` 최신 상단·시분초 규칙 (이후 ADR-011로 중단 규칙 폐기)

**당신이 할 일**
- 없음 (정책은 `28` 기준으로 갱신됨)

---

### 2026-05-19 23:45:11 — RLS 리뷰 패키지 · AI 리포트 스텁

| 항목 | 내용 |
|------|------|
| **계획** | [`260519-2.md`](doc/for_agent/plans/260519-2.md) — RLS 인간 리뷰 패키지 + AI 리포트 Edge 스텁 |
| **한 일** | `rls_review_packet.md`, RLS Beta SQL(미적용), AI 리포트 API·Edge, 마이페이지 베타 버튼 |
| **당신이 할 일** | → `28_human_action_items.md` **H-001**, **H-002** |

---

### 2026-05-19 (시각 미기록) — Playwright E2E + GitHub Actions CI

| 항목 | 내용 |
|------|------|
| **계획** | [`260519-1.md`](doc/for_agent/plans/260519-1.md) — 핵심 플로우 5개 Playwright + GitHub Actions CI |
| **한 일** | E2E 5플로우, `.github/workflows/e2e.yml`, 로그아웃 `data-testid` |
| **당신이 할 일** | → `28_human_action_items.md` **H-003**, **H-004** |

---

### 2026-05-19 (시각 미기록) — 세션 계획 파일 `YYMMDD-N.md`

**한 일**
- 계획을 날짜·순번 파일로 분리, 생성 시각(시분초) 필수, `current_session_plan.md`는 인덱스만

**당신이 할 일**
- 새 계획은 `current_session_plan.md` 인덱스에서 최신 `YYMMDD-N.md` 링크 열기

---

### 2026-05-19 (시각 미기록) — 멤버십 · Q&A · 트러블슈팅 CRUD

**한 일**
- 수업 코드 멤버십, Q&A 질문·답변 CRUD, 트러블슈팅 등록·수정·삭제, 팀 산출물 Storage
- 로그인 리다이렉트 `/`, RLS 일부 보완

**당신이 할 일**
- 수업 코드로 등록 후 Q&A·팀 상세에서 동작 확인

---

## 한눈에 타임라인 (최신 → 과거)

| 작업 시각 | 무슨 일 | 쉬운 결과 |
|-----------|---------|-----------|
| 2026-05-19 23:59:45 | 리포트 DB 집계 + A4 미리보기 | 마이페이지 인쇄 가능 |
| 2026-05-19 23:55:05 | 인간 액션 목록 `28` | 막힌 일은 28번, AI는 다른 일 계속 |
| 2026-05-19 23:53:32 | 작업 일지 시분초·상단 정렬 | `25_ai_work_log` 규칙 |
| 2026-05-19 23:45:11 | RLS 리뷰 + AI 리포트 스텁 | 보안 문서·마이페이지 베타 버튼 |
| 2026-05-19 | Playwright + CI | PR마다 자동 테스트(시크릿 필요) |
| 2026-05-19 | 계획 파일 `260519-N` | 계획 덮어쓰기 없이 이력 보존 |
| 2026-05-19 | CRUD·멤버십·Storage | DB에 글·파일 저장 가능 |
| 2026-05-19 | 문서 시스템·로그인·`supabase-api` | `doc/` 정리, `.env`, DB 읽기 |

**지금 한 줄:** UI·DB 읽기·쓰기 대부분 Alpha. **당신이 할 일** → `28_human_action_items.md`

## 관련 문서

| 읽을 것 | 내용 |
|---------|------|
| **`28_human_action_items.md`** | **당신이 아직 해줘야 하는 일 (체크리스트)** |
| `01_project_status.md` | 진행률·완료/미완 |
| `26_vision_features_status.md` | 기능별 완료 여부 |
| `doc/for_agent/17_handoff.md` | 다음 AI 기술 메모 |
| `doc/for_agent/23_agent_operating_rules.md` | 작업 종료 체크리스트 |

---

## 과거 상세 (2026-05-19 초기 세션, 시각 미기록)

<details>
<summary>펼치기 — 문서 구축 · 로그인 · mock-data rename 등</summary>

### 문서 시스템 초기 구축
- `doc/for_agent/`, `doc/for_human/`, `doc/starter.txt` 생성

### `doit.md` 점검·보완
- `23`~`27` 등 협업·표준 문서 추가

### `starter.txt` 한곳으로
- 루트 `starter.txt` 제거 → `doc/starter.txt`만 사용

### 로그인·주소·환경 설정
- `ProtectedRoute`, course-scoped URL, `.env` + `.env.example`

### 문서 vs 코드 검증
- Mock·진행률 등 옛 설명 수정

### `mock-data.ts` → `supabase-api.ts`
- import 11곳·doc 경로 일괄 수정

### 가입 · Q&A 질문 등록
- Firebase + `ai_users`, Q&A INSERT 정책

### 팀 상세 트러블슈팅
- 등록·수정·삭제·해결 완료, RLS INSERT/UPDATE/DELETE

</details>

---

## 기록용 템플릿 (AI가 복사해 맨 위에 삽입)

```markdown
### YYYY-MM-DD HH:mm:ss — 제목

| 항목 | 내용 |
|------|------|
| **계획** | [`YYMMDD-N.md`](doc/for_agent/plans/YYMMDD-N.md) — (계획 파일 「오늘 목표」 한 줄 요약) |
| **한 일** | … |
| **당신이 할 일** | … (없으면 "없음" 또는 `28` H-00x) |
```

- **계획**이 없던 단발 작업: `(채팅 요청) …` 한 줄만 적기
- 요약은 계획 본문 전체가 아니라 **한 줄** (약 40자 내외 권장)
