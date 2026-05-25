# 00 — 프로젝트 개요 (에이전트용)

> **관련:** `vision.md` · `02_current_state.md` · `05_todo.md` · `doc/starter.txt` · `27_vision_feature_matrix.md` · `28_human_action_items.md`

## 한 줄 정의

**CampusConnect** — 대학 팀 프로젝트의 협업 과정과 성장을 장기 아카이브하는 웹 플랫폼.

## 문제 → 해결

| 문제 (vision.md) | 플랫폼 응답 |
|------------------|-------------|
| 관계 형성 어려움 | 수강생 네트워크, 기술 태그, 팀 채팅(DB+Realtime) |
| 피드백 비효율 | 팀 워크스페이스, 트러블슈팅, Q&A |
| 팀플 휘발성 | 과목·팀 히스토리, **종료 수업** 아카이브 |
| 개인 이력 부재 | 마이페이지 DB 리포트 + AI 문단(예정) |

## 핵심 기능 3축

1. **수강생 네트워크** — 프로필, 스킬 태그, 탐색
2. **팀플 워크스페이스** — 산출물, 트러블슈팅, Q&A, 피드백·동료평가, 종료 수업
3. **마이페이지** — 활동 집계, 3페이지 리포트, A4 인쇄, AI(Edge)

## 현재 단계

- **Alpha** (Beta 진입) — UI + Supabase 읽기·쓰기 대부분; RLS·Edge deploy·프로덕션 미완
- **전체 진행률:** ~55% (2026-05-20)

### 인간 실행 가이드 (for_human)

| 문서 | 용도 |
|------|------|
| `00_pre_launch_order.md` | 런칭 전 순서 |
| `29_supabase_bundle_sql.md` | DB 테이블 5분 |
| `30_edge_ai_report.md` | AI Edge 10분 |
| `28_human_action_items.md` | H-001~008 체크리스트 |
| `33_supabase_mcp_db_operations.md` | DB·Storage — MCP 자동 적용 (인간 SQL 불필요) |

## 기술 스택 요약

React 18 · Vite 6 · TypeScript · Tailwind 4 · React Router 7 · Firebase Auth · Supabase

## doc/ 구조 (doit.md)

```
doc/
├── starter.txt      ← 신규 AI 1차 온보딩 (정본)
├── for_agent/       ← 00~28, plans/
└── for_human/       ← 00~28
```

루트 `starter.txt` 는 사용하지 않음.

## 문서의 5가지 역할 (doit.md)

| 역할 | 설명 | 주요 문서 |
|------|------|-----------|
| 장기 기억 | 대화 단절 후 맥락 복구 | `02`, `06` |
| 인수인계 | 새 에이전트 투입 | `starter.txt`, `17` |
| 프로젝트 브레인 | 의도·결정·상태 | `00`, `02`, `05` |
| AI 협업 IF | 병렬 작업 경계 | `24`, `05` |
| 인간 교육 | 비개발자 이해 | `for_human/` |

## doit.md 핵심 목표 → 반영 문서

| doit 요구 | 반영 문서 |
|-----------|-----------|
| AI 빠른 이해 | `doc/starter.txt`, 본 문서 |
| 새 대화 인수인계 | `starter.txt`, `17_handoff` |
| 비개발자 장기 이해 | `for_human/` |
| 현재 상태 / 할 일 분리 | `02`, `05` |
| 전체 개발 흐름 | `03`, `23` §생명주기 |
| 단계·진행률 | `02`, `for_human/01` |
| AI 작업 이력 | `for_human/25_ai_work_log` |
| 세션 업무 계획 | `plans/YYMMDD-N.md`, `plans/current_session_plan.md` |
| 우선순위 TODO | `05` |
| 배포~운영 | `04`, `03`, `13` |
| 인간 협업 | `25`, `28` |
| 멀티 에이전트 | `24` |
| 문서 표준 | `26` |
| vision 기능 추적 | `27`, `for_human/26` |

## 에이전트 읽기 경로 (역할별)

| 상황 | 1순위 | 2순위 |
|------|-------|-------|
| 신규 투입 | `doc/starter.txt` | `02`, `05`, `28` |
| 프론트 | `08` | `27`, `12`, `18` |
| 디자인 | `18` | `12`, `for_human/31` |
| DB | `09` | `05`, `22` |
| AI 리포트 | `10`, `11` | `src/app/api/ai-report.ts` |
| 배포 | `13` | `04`, `28` H-005 |
| 테스트 | `14` | `tests/e2e/` |

## 인간 협업 — 요약

인간 전용 → `28_human_action_items.md` 기록 후 AI는 다른 일 계속. 상세: `25_human_collaboration.md`

## 작업 후 필수 동기화

`23` 체크리스트 — 최소: `02` · `05` · `17` · (결정 시) `06` · (기능 시) `27` · `for_human/01`, `26`
