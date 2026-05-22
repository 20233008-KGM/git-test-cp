# 여기서 시작하세요

> **관련:** `01_project_status.md` · `28_human_action_items.md` · `doc/for_agent/02_current_state.md`

코딩을 잘 모르셔도 괜찮습니다. 이 폴더는 **CampusConnect** 프로젝트를 처음부터 끝까지 이해할 수 있도록 만든 교육용 문서입니다.

## doc/ 폴더 구조

```
doc/
├── starter.txt       ← AI 전용 (사람은 안 읽어도 됨)
├── for_human/        ← 지금 여기 (00~28)
└── for_agent/        ← AI·개발자용 (00~28, plans/)
```

AI에게 시킬 때: **「doc/starter.txt 읽고 이어서 해줘」**

## 이 문서들이 하는 일 (5가지)

| 역할 | 쉬운 말 |
|------|---------|
| 장기 기억 | 채팅이 끊겨도 프로젝트 맥락 유지 |
| 인수인계 | 새 AI·새 팀원이 바로 이해 |
| 프로젝트 브레인 | “지금 뭐가 맞는 상태인지” 기준 |
| AI 협업 | 여러 AI가 동시에 일할 때 구분 |
| 당신을 위한 학교 | 코딩 몰라도 전체 이해 |

## 사람이 읽는 경로

| 목적 | 읽을 문서 |
|------|-----------|
| **런칭 전 할 일 순서** | **`00_pre_launch_order`** |
| 처음 | 본 문서 → `04_project_intro` |
| vision·채팅 요청 처리 | `29_vision_requests_report` (vision # + **대화창에서 요청한 내용**) |
| vision 기능 요약 | `26_vision_features_status` |
| 진행률 | `01_project_status` |
| AI가 뭘 했나 | `25_ai_work_log` |
| Supabase SQL 5분 | `29_supabase_bundle_sql` |
| AI 리포트 켜기 | `30_edge_ai_report` |
| 리포트 집계 확인 | **`37_verify_ai_report`** |
| RLS 승인 (H-001) | **`31_rls_beta_decision`** · JWT **`33_firebase_supabase_jwt_setup`** |
| **런칭 한 페이지** | **`36_launch_one_pager`** |
| **막힌 일 체크리스트** | **`28_human_action_items`** |
| 용어 모름 | `23_beginner_glossary` |
| doc 읽는 법 | `24_how_to_read_docs` |

## 이 프로젝트는 무엇인가요?

대학 팀 프로젝트를 **과제 한 번 하고 끝**이 아니라, **사람과의 연결**, **협업 과정 기록**, **나만의 성장 이력**으로 남기는 플랫폼입니다. 자세한 철학은 `vision.md`.

## 문서 읽는 추천 순서

1. **04_project_intro.md**
2. **29_vision_requests_report.md** (vision # 처리 + **대화창에서 요청한 내용**)
3. **26_vision_features_status.md**
4. **01_project_status.md**
5. **05_how_this_system_works.md**
6. **24_how_to_read_docs.md**
7. 필요한 주제만 (프론트, DB, AI, 배포 등)

## AI가 최근에 한 일

→ **25_ai_work_log.md** (최신이 맨 위, 계획 한 줄 요약 포함)

## AI 세션 계획

→ **`doc/for_agent/plans/current_session_plan.md`** — 최신 `260520-3.md` 등 링크

**현재 요약 (2026-05-20):** DB 읽기·쓰기·마이페이지 리포트·E2E 대부분 동작. **RLS·OpenAI·공개 배포**는 `28` 인간 항목.

## 당신이 도와주면 좋은 일

→ **`28_human_action_items.md`** (API 키, RLS 승인, E2E 시크릿, 배포 GO 등)

## 로컬 실행

```bash
pnpm install
pnpm dev
```

브라우저: http://localhost:5173

## 더 깊이

- 기술: `doc/for_agent/`
- 용어: **23_beginner_glossary.md**
