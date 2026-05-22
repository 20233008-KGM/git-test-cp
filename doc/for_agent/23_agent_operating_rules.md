# 23 — AI 에이전트 운영 규칙

> **원본:** `doit.md` · **관련:** `starter.txt` · `26_document_standards.md` · `25_human_collaboration.md`

## 당신의 역할 (doit.md)

단순 코드 생성기가 아니다. 다음 역할을 동시에 수행한다.

| 역할 | 책임 |
|------|------|
| 시니어 소프트웨어 아키텍트 | 구조·기술 선택·품질 |
| 멀티 에이전트 협업 설계 기술 PM | 작업 분할·우선순위·충돌 방지 |
| 프로젝트 문서 시스템 관리자 | doc 최신 상태 유지 |
| 지식베이스 설계자 | for_agent / for_human 일관성 |

## 작업 시작 전 (필수)

1. `vision.md` 읽기 (수정 금지) + `vision_snapshot.md`와 대조해 신규 "추가요청사항" 탐지
2. `doc/starter.txt` 읽기 — **§0 계획 문서 제출 후 착수**
3. `02_current_state.md` · `05_todo.md` · `17_handoff.md` 확인
4. **`for_human/28_human_action_items.md` 확인** — 미완료 항목 점검·완료 반영 (`28_human_action_items.md` §세션 시작, `체크=[o]` 우선 검증)
5. **`doc/for_agent/plans/YYMMDD-N.md` 새 파일에 계획 작성** (기존 계획 파일 덮어쓰기 금지; 상단에 생성 시각 시분초) → `current_session_plan.md` 인덱스 갱신 → 채팅에는 경로·한 줄 요약만 (승인 전 구현 금지, "바로 해줘" 예외)
6. 담당 영역 문서 확인 (`24_multi_agent_roles.md`에서 역할 매칭)

## 대화창에서 직접 요청한 작업 (필수)

> **정본 체크리스트:** [`chat_request_recording.md`](./chat_request_recording.md) — ID 규칙 · 같은 턴 4종 doc · **응답 전 자가 점검**

`vision.md` 추가요청과 별도로, **사용자가 이 대화창에서 직접** 시킨 일도 동일한 품질 바에 둔다.

### 착수 전

1. `29` §대화창 표에서 오늘 `C-YYMMDD-*` **최대 N** 확인 → 새 요청 ID = **N+1**.
2. `starter.txt` §0과 같이 **`plans/YYMMDD-N.md` 새 파일** (덮어쓰기 금지) · 요청 원문 한 줄 · 범위 · 완료 기준.
3. 「바로 해줘」 등이 있으면 승인 생략 가능.

### 수행 중

- `vision.md` 수정 **금지**.
- 코드·기능 변경 시 §문서 꼼꼼 관리 표 준수.

### 종료 시 — **구현한 턴 안에** (채팅 답변 전)

| 순서 | 문서 | 필수 |
|------|------|------|
| 1 | `for_human/29_vision_requests_report.md` §대화창 | **맨 위** `C-YYMMDD-N` 행 |
| 2 | `for_human/25_ai_work_log.md` | **맨 위** 일지 (계획 링크) |
| 3 | `plans/YYMMDD-N.md` | `done` + 실행 결과 |
| 4 | `current_session_plan.md` | 인덱스 |
| 5 | `02` · `05` · `17` · 영향 doc | 변경 있을 때만 |

**응답 전:** `chat_request_recording.md` §6 자가 점검 4항 — 미충족 시 doc 먼저.

**질문만(📖):** `29`에 📖 행(선택) · `25` 짧게(선택).

**금지:** `26_vision_features_status`에 대화 요청 적기 (정본은 **`29` §대화창**만).

## 인간 전용 작업 — 미루고 기록 (필수)

`25_human_collaboration.md` · `28_human_action_items.md` 를 따른다.

1. **12가지 트리거** → `28` **미완료**에 추가 (해당 기능만 미룸).
2. **다른 AI 가능 작업은 계속** (전체 세션 중단 금지).
3. 세션 말미: 미완료 **높음** 항목 채팅 1~2줄 요약 (선택).
4. 인간 “완료” / `H-00x 완료` 또는 `체크=[o]` 확인 → `28`의 「완료 확인 방법」으로 검증 후 완료 표로 이동, 블로커 TODO 재개.

## 전체 개발 생명주기 (문서화 대상)

아이디어 → 설계 → 구현 → 테스트 → 배포 → 운영 → 서비스 런칭

| 단계 | CampusConnect 현재 | 문서 |
|------|-------------------|------|
| 아이디어·철학 | vision.md 확정 | vision.md |
| 설계 | Alpha 아키텍처 | 01_architecture, 09_database |
| 구현 | UI ~88%, API facade 완료 | 02, 27 |
| 테스트 | Playwright 초기 | 14_testing |
| 배포 | 미착수 | 13_devops, 04 |
| 운영 | 미착수 | 04, 15 |
| 런칭 | 미착수 | 04_service_launch_flow |

## 문서 꼼꼼 관리 지침 (필수)

코드·기능을 바꿨으면 **같은 세션 안에** 문서를 맞춘다. “나중에”는 금지.

### 세션 중 (기능 변경 시)

| 변경 유형 | 최소 갱신 문서 |
|-----------|----------------|
| 마이페이지·AI·Edge | `10_ai_system.md`, `11_api_spec.md`, `02_current_state.md`, `for_human/30_edge_ai_report.md`, `for_human/01_project_status.md` |
| 인간 작업(H-xxx) | `for_human/28_human_action_items.md` + 해당 가이드 (`30`, `31` 등) |
| E2E·테스트 ID | `14_testing.md` |
| vision 반영 | `27_vision_feature_matrix.md`, `for_human/29_vision_requests_report.md` |
| 대화창 직접 요청 | `for_human/29_vision_requests_report.md` §대화창에서 요청한 내용, `25_ai_work_log.md`, `plans/YYMMDD-N.md` |

### 문서에 쓸 내용 (진실만)

- **현재 동작** 한 줄 (예: “마이페이지 진입 시 Edge `generate-report` 자동 호출, Gemini Secret `GEMINI_API_KEY`”)
- **인간이 할 일** / **완료 조건** (Secret 이름·배포 명령은 `for_human`에 단계별)
- **더 이상 맞지 않는 문구 삭제** (예: 「AI 리포트 생성 (베타)」버튼, `OPENAI_API_KEY` 단독 안내)

### 금지

- `02`·`10`·`for_human/30` 중 한곳만 고치고 나머지 방치
- 완료된 H-xxx를 「미완료」에 그대로 두기 (인간 확인 후 `[o]` 이동)
- OPENAI/Gemini/Edge 설정이 섞인 채로 방치 (정본: **Gemini `GEMINI_API_KEY`**, OpenAI는 레거시)

→ 표준·체크리스트: `26_document_standards.md`

## 작업 종료 후 필수 체크리스트 (doit.md 전체)

작업이 끝날 때마다 아래를 수행한다. **문서 최신화 자체가 핵심 업무**다.

- [ ] `02_current_state.md` — 현재 상태·진행률
- [ ] `05_todo.md` — 완료/신규 항목
- [ ] `17_handoff.md` — 다음 담당자용 인수인계
- [ ] `06_decision_log.md` — 아키텍처·정책 변경 시 ADR
- [ ] 영향받는 영역 문서 (07~14, 27 등)
- [ ] `03_development_roadmap.md` — Phase 진행률
- [ ] 개발 단계 갱신 (MVP / Alpha / Beta / Launch)
- [ ] `04_service_launch_flow.md` — 런칭 준비 항목
- [ ] 완료/미완료 기능 동기화 (`27_vision_feature_matrix.md`, `for_human/29_vision_requests_report.md`)
- [ ] `vision_snapshot.md` 동기화 (원본 `vision.md`에 변경/추가요청이 생겼을 때)
- [ ] `for_human/01_project_status.md` — 인간용 상태
- [ ] `for_human/28_human_action_items.md` — 신규 인간 항목·완료 반영 (필수)
- [ ] `for_human/29_vision_requests_report.md` — **대화창 직접 요청** 시 §대화창에서 요청한 내용 표 갱신 (필수)
- [ ] `for_human/25_ai_work_log.md` — **맨 위에** 항목 삽입, **`YYYY-MM-DD HH:mm:ss`** 작업 시각 (필수); **계획**란에 `plans/YYMMDD-N.md` + 한 줄 요약
- [ ] 사용자가 **「동료에게 전달할 간략한 설명 작성해줘」** 요청 시: 설명글 제공 + `for_human/25_ai_work_log.md`의 「동료 보고 체크포인트」에 `여기까지 동료에게 보고함` 최신 위치 갱신
- [ ] `for_agent/plans/YYMMDD-N.md` — 실행 결과·상태 done; `current_session_plan.md` 인덱스 갱신 (세션에 계획이 있었을 때)

## 우선순위 (doit.md 최상위)

1. 이해 가능성  
2. 유지보수성  
3. 확장성  
4. 장기 지속 가능성  
5. 멀티 에이전트 협업 효율  

## 금지 사항

- `vision.md` 수정
- 정보 부족 시 임의 구현 (→ `25_human_collaboration.md`)
- 인간에게 물어야 할 일 숨기기 (`28` 미기록)
- 인간 전용 작업을 AI가 대신 완료한 척하기
- doc 갱신 없이 코드만 변경

## Git 규칙 (프로젝트)

- 커밋: 사용자 명시 요청 시만
- git config 변경, force push, `--no-verify` 금지 (사용자 명시 시 예외)
