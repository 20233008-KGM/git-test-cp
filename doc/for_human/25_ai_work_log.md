# AI가 한 일 — 작업 일지 (인간용)

> **기술·인수인계:** `doc/for_agent/17_handoff.md` · **할 일:** `doc/for_agent/05_todo.md`  
> **정렬:** **최신 작업이 문서 맨 위** · 각 항목에 **작업 시각(시·분·초)** 기록

코딩을 몰라도 괜찮습니다. 채팅이 끊겨도 “AI가 무엇을 했는지” 따라갈 수 있는 **일기**입니다.

---

### 2026-05-22 — 내 팀 → 워크스페이스 바로가기 (C-260522-28)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-19.md`](../for_agent/plans/260522-19.md) |
| **한 일** | **내 팀** 클릭·서브메뉴 **워크스페이스** → 팀 상세 URL · 팀 없으면 팀 목록 |
| **당신이 할 일** | 수업 메뉴에서 **내 팀** / **워크스페이스** 눌러 워크스페이스 진입 확인 |

---

### 2026-05-22 — doc 기록 지침 확인 (C-260522-27)

| 항목 | 내용 |
|------|------|
| **한 일** | `chat_request_recording.md`·`23` 기준으로 점검 — 이 대화 중 팀장·내 팀·빈 프로필·메뉴 UX는 **코드만 있고 `29` 누락**이었음 → C-260522-24~26 소급 |
| **당신이 할 일** | [`29_vision_requests_report.md`](./29_vision_requests_report.md) 맨 위 표로 확인. 구현 후 표에 없으면 「기록 빠짐」 알려 주세요 |

---

### 2026-05-22 — 내 팀 메뉴 UX (C-260522-26)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-16.md`](../for_agent/plans/260522-16.md) |
| **한 일** | 서브메뉴 absolute 제거 · 세로 in-flow · 300ms 펼침·화살표 회전 |
| **당신이 할 일** | 수업 메뉴 **내 팀** 호버·클릭 시 아래 메뉴가 밀리며 펼쳐지는지 확인 |

---

### 2026-05-22 — 수강자 빈 프로필 UX (C-260522-25)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-16.md`](../for_agent/plans/260522-16.md) |
| **한 일** | `studentNetworkDisplay` · 카드·모달 플레이스홀더 · 학습 프로필 없을 때 매너온도 안내 |
| **당신이 할 일** | 김규민 등 미입력 계정으로 수강자들·카드 클릭 확인 |

---

### 2026-05-22 — 팀장·팀 관리 (C-260522-24)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-15.md`](../for_agent/plans/260522-15.md) |
| **한 일** | 워크스페이스 팀장 뱃지 · `transferLeader` · `CourseTeamManagePage` · **내 팀** 하위 메뉴 |
| **당신이 할 일** | 내 팀 → 팀 관리에서 팀장 지정·탈퇴 확인 |

---

### 2026-05-22 — 프로젝트 폴더 소스 ZIP 업로드 (C-260522-23)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-14.md`](../for_agent/plans/260522-14.md) |
| **한 일** | `jszip` · `projectSourceZip.ts` (node_modules·.git 제외) · `TeamDeliverableSubmitModal` 「프로젝트 폴더 → ZIP」 |
| **당신이 할 일** | 팀 상세 → 산출물 등록 → 프로젝트 루트 폴더 선택 → ZIP 확인 후 등록 |

---

### 2026-05-22 — 대화창 요청 기록 지침 강화 (C-260522-22)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-13.md`](../for_agent/plans/260522-13.md) |
| **한 일** | [`chat_request_recording.md`](../for_agent/chat_request_recording.md) 신설 — ID(N+1)·같은 턴 4종 doc·응답 전 자가 점검 · `23`·`26`·`starter`·`29`·`plans/README` 연동 |
| **당신이 할 일** | AI가 구현 후 **`29` 맨 위 `C-YYMMDD-N`** 없으면 「기록 빠짐」이라고 알려 주세요 |

---

### 2026-05-22 — 대화 요청이 `29`·`25`에 안 남은 이유 + 소급 (C-260522-21)

| 항목 | 내용 |
|------|------|
| **원인** | 코드 구현 후 `23` §대화창 종료 체크리스트(`29`·`25`·`plans`)를 같은 세션에 실행하지 않음 |
| **한 일** | `29`에 C-260522-17~20·21 추가 · `plans/260522-17`~`20` · C-260522-11 김규민 정정 |
| **당신이 할 일** | 앞으로 채팅에서 시킨 일은 [`29_vision_requests_report.md`](./29_vision_requests_report.md) **맨 위 표**에서 확인 |

---

### 2026-05-22 — 김규민 수강자 네트워크 (C-260522-11)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-11.md`](../for_agent/plans/260522-11.md) |
| **한 일** | 본인 카드 `students[0]`·`default` 폼 폴백 제거 · `useAuth` self · 프로필 모달 extras 폴백 |
| **당신이 할 일** | 김규민으로 수강자들·내 정보 수정 재확인 |

---

### 2026-05-22 — 팀 산출물·기록등록 UI (C-260522-18·19)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-18.md`](../for_agent/plans/260522-18.md) |
| **한 일** | 산출물 통합 모달·수정 · 배너 제거 · 트러블슈팅 기록등록 모달 |
| **당신이 할 일** | 팀 상세에서 산출물·기록등록 확인 |

---

### 2026-05-22 — 파일 업로드·류지원 수업 (C-260522-17·20)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-17.md`](../for_agent/plans/260522-17.md) · [`260522-20.md`](../for_agent/plans/260522-20.md) |
| **한 일** | Storage 키 ASCII · 웹프로그래밍 `CC-WPGM-2601` 수업 생성 |
| **당신이 할 일** | 한글 파일명 업로드 · 류지원 수업 목록 확인 |

---

### 2026-05-22 16:30:00 — doc 기록 누락 소급 + E2E·김학생2·DB 초안 UI (C-260522-12~16)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-12.md`](../for_agent/plans/260522-12.md) |
| **한 일** | `29` C-260522-12~16 · E2E 로그인 testid·`user-journeys` · 김학생2 SQL · AI 「DB 초안」 문구 제거 |
| **당신이 할 일** | [`29_vision_requests_report.md`](./29_vision_requests_report.md) 맨 위 표 확인 · 김학생2 로그인 |

---

### 2026-05-22 — 대화창 요청 기록 칸 → `29` (C-260522-6)

| 항목 | 내용 |
|------|------|
| **한 일** | `26`에서 §대화창 제거 · `29_vision_requests_report` §대화창에서 요청한 내용 정본 · `23`·`26_document_standards`·`starter.txt` 참조 수정 |
| **당신이 할 일** | 채팅에서 시킨 일은 **`29_vision_requests_report.md`** 맨 위 표에서 확인 |

---

### 2026-05-22 — 마이페이지 리포트 A4·디자인 (C-260522-5)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-7.md`](../for_agent/plans/260522-7.md) — 새로고침 제거 · A4 용지 고정 · 인쇄 버튼 밖 · 가독성 |
| **한 일** | `StudentReportA4Sheet` · `AiReportPrintView` 리디자인 · `MyPage` 툴바/용지 분리 · E2E #6 |
| **당신이 할 일** | `npm run dev` → 마이페이지에서 A4 용지·인쇄 버튼 위치 확인 |

---

### 2026-05-22 — 대화창 요청 작업 지침 (C-260522-4)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-6.md`](../for_agent/plans/260522-6.md) — 대화창 직접 요청도 plans·`26`·`25`·`02`/`05` 동기화 |
| **한 일** | 대화창 요청 지침 추가 (당시 `26`에 기록) · 이후 **C-260522-6**으로 `29` §대화창에서 요청한 내용으로 이전 |
| **당신이 할 일** | **`29_vision_requests_report.md`** §대화창에서 요청한 내용 표 확인 |

---

### 2026-05-22 — H-003 완료 반영 (로컬 E2E 자격증명)

| 항목 | 내용 |
|------|------|
| **한 일** | 사용자 「H-003 완료」 확인 · `.env` `E2E_TEST_*` 존재 검증 · `28_human_action_items.md` 완료 표 이동 |
| **당신이 할 일** | `npm run test:e2e` 또는 `test:e2e:smoke`로 로컬 회귀 확인. 다음: **H-004** GitHub Secrets ([34](./34_github_ci_secrets.md)) |

---

### 2026-05-22 — E2E A4·vision #55 (인간 없이)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-5.md`](../for_agent/plans/260522-5.md) — doc·코드 정합성 + vision #55 빈 수업 UI |
| **한 일** | E2E #6 `mypage-a4-print-button` · ai-report·Edge README 메시지 · `CoursesPage` 빈 목록 시 상단 수업코드 배너 숨김 · E2E #48 · `vision_snapshot` · doc 갱신 |
| **당신이 할 일** | 학생 계정(수업 0개)으로 Courses 이중 UI 없는지 확인. H-001·H-003~006은 여전히 인간 |

---

### 2026-05-22 — 프로젝트 상태 스캔 + doc 최신화

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-4.md`](../for_agent/plans/260522-4.md) — 코드·DB·E2E·human items와 `doc/` 정본을 2026-05-22 기준으로 맞춤 |
| **한 일** | 전체 스캔 후 `02`·`01`·`17`·`27`·`14`·`05`·`28`·`26`·`00`·`35`·`36`·`07`·`13` 갱신. E2E 48건·H-002 미완료 제거·AI 자동 채움·Gemini 정본·구식 OPENAI/A4 라벨 정리 |
| **당신이 할 일** | H-001(RLS) · H-003·H-004(E2E env) · H-005(배포). H-002 완료 시 마이페이지 AI 문단 확인 |

---

## 2026-05-22 — 마이페이지 리포트 자동 AI 채움 + Gemini + doc 정리

| 항목 | 내용 |
|------|------|
| **한 일** | `buildMyPageReportView` — PAGE 1~3 박스에 Edge/Gemini 문단 병합. `MyPage` 진입 시 자동 `generateReport`, 「AI 리포트 생성 (베타)」·「DB 미리보기」버튼 제거. Edge Gemini·`verify_jwt=false`·401 헤더. doc (`10`·`11`·`02`·`30`·`37`·`28` H-002 등)·`23` 문서 꼼꼼 관리 지침. |
| **당신이 할 일** | `npm run dev` → 마이페이지 새로고침. Vercel 재배포 후 프로덕션 확인. |

---

## 2026-05-22 14:13:32 — human_action_items 완료 처리 (H-007~H-011)

| 항목 | 내용 |
|------|------|
| **한 일** | `verify:archived-kim`·`human:verify`로 H-007~H-011 검증 후 `28_human_action_items.md` 완료 표 이동 |
| **당신이 할 일** | 미완료: H-001·H-003(E2E env)·H-004·H-005·H-006 (H-002·H-007~011 완료) |

---

## 2026-05-22 13:29:50 — vision #54 더미 스크린샷 제거 (T-181)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-3.md`](doc/for_agent/plans/260522-3.md) |
| **한 일** | `TeamDetailPage` FIGMA·중간·기말발표 플레이스홀더 삭제 · E2E #3·#47 · doc·snapshot |
| **당신이 할 일** | 팀 워크스페이스에서 더미 카드 없는지 확인 |

---

## 2026-05-22 13:27:04 — 팀 상세 id 매핑·verify·handoff (T-178~T-180)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-2.md`](doc/for_agent/plans/260522-2.md) |
| **한 일** | `getTeamDetailPeerReviewStudentsFromDb` user_id 매핑 · `verify:archived-kim` `teammateDisplayResolvable` · `17_handoff` #1~#53·E2E 46 |
| **당신이 할 일** | 없음 (인간: H-011·H-002·H-005) |

---

## 2026-05-22 13:23:11 — vision #53 본인 팀 트러블슈팅 작성 (T-177)

| 항목 | 내용 |
|------|------|
| **계획** | [`260522-1.md`](doc/for_agent/plans/260522-1.md) |
| **한 일** | `getTeamDetailTeammatesFromDb`가 `ai_team_members.user_id`로 id 매핑 · `api.teams.isStudentMember` · TeamDetail 이중 확인 · E2E #46 · doc·snapshot |
| **당신이 할 일** | **진행 중(active) 수업**·내 팀 워크스페이스에서 TS 작성 폼 확인 (종료 수업은 조회만) |

---

## 2026-05-21 12:59:00 — 조원 프로필 모달·E2E 문서 (T-175·T-176)

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-26.md`](doc/for_agent/plans/260521-26.md) |
| **한 일** | `StudentQuickProfileModal` · CourseDetail 나의팀멤버 · TeamDetail 팀원 클릭 · E2E #45 · `14_testing` |
| **당신이 할 일** | vision #1~#51 완료 — 인간: H-011 SQL 등 |

---

## 2026-05-21 12:57:03 — vision #51 보강: 탈퇴 소형·참여 숨김 (T-174)

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-25.md`](doc/for_agent/plans/260521-25.md) |
| **한 일** | 탈퇴 하단 11px muted 링크 · `hasMyTeamInCourse` 시 join 숨김 · E2E #44 |
| **당신이 할 일** | 팀 소속 학생으로 팀 목록·워크스페이스 하단 확인 |

---

## 2026-05-21 12:55:22 — vision #51 팀 탈퇴 워크스페이스 전용 (T-173)

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-24.md`](doc/for_agent/plans/260521-24.md) |
| **오늘 목표** | 팀 탈퇴 버튼을 팀 카드가 아닌 워크스페이스 안에만 두기 |
| **한 일** | `TeamsPage` 탈퇴 제거·안내 문구 · `TeamDetailPage` 탈퇴 버튼 · E2E #44 |
| **당신이 할 일** | 내 팀 입장 → 상단 「팀 탈퇴」 확인 |

---

## 2026-05-21 12:53:25 — TeamDetail·MyPage 모달 fixed 오버레이 (T-172)

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-23.md`](doc/for_agent/plans/260521-23.md) |
| **오늘 목표** | `my-6` 인라인 모달을 #50과 동일하게 뷰포트 `fixed`로 통일 |
| **한 일** | 채팅·교수 프로젝트/학생 평가·피드백 커스텀·마이페이지 프로젝트 상세 · E2E #12 |
| **당신이 할 일** | 종료 수업·교수 계정에서 「프로젝트 평가」 클릭 시 중앙 모달 확인 |

---

## 2026-05-21 12:51:32 — vision #50 수강생 프로필 fixed 모달

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-22.md`](doc/for_agent/plans/260521-22.md) |
| **오늘 목표** | #8과 별개로, 프로필이 페이지 하단 인라인이 아닌 뷰포트 중앙 모달로 표시 |
| **한 일** | `StudentProfileModal`·`MyInfoEditModal`·`RandomTeamModal` → `fixed inset-0 z-50` · E2E #43 |
| **당신이 할 일** | 수강자들에서 카드 클릭 후 화면 중앙 모달 확인 |

---

## 2026-05-21 12:48:54 — vision #49 다른 팀 트러블슈팅 작성 차단

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-21.md`](doc/for_agent/plans/260521-21.md) |
| **오늘 목표** | 다른 팀 워크스페이스에서 학생이 트러블슈팅·산출물을 쓰지 못하게 UI·API 정합 |
| **한 일** | `assertStudentOwnTeamWrite` · `TeamDetailPage` `isMyTeamMember` 게이트 · E2E #42 · `vision:snapshot` |
| **당신이 할 일** | 없음 (기능 확인만 원하면 다른 팀 카드 입장 후 작성 폼 없음 확인) |

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
| 동료 보고 요청 | 사용자가 **「동료에게 전달할 간략한 설명 작성해줘」**라고 요청하면, 설명글을 작성하고 아래 「동료 보고 체크포인트」의 `여기까지 동료에게 보고함` 위치를 최신 기준으로 갱신 |

---

## 2026-05-21 06:15:30 — prelaunch:check 런칭 자동 점검

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-20.md` |
| **한 일** | `npm run prelaunch:check` (build·archived·preflight); deploy 체크리스트·28·00 갱신; H-002 Edge URL 프로브 |
| **검증** | `prelaunch:check` → `ok: true` |
| **당신이 할 일** | H-011 `[o]` → `npm run human:verify` · H-002 Edge [30](./30_edge_ai_report.md) |

---

## 2026-05-21 05:58:22 — 문서·CI·E2E #41·human H-007~011

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-19.md` |
| **한 일** | `14_testing`·`17`·`26` 갱신; `human:verify` H-007~011; E2E #41; CI build에 `verify:archived-kim` |
| **검증** | `npm run build` OK |
| **당신이 할 일** | `28`에서 H-007~011 `[o]` 후 `npm run human:verify` |

---

## 2026-05-21 05:44:05 — 검증 파이프라인·원클릭 SQL 정리

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-18.md` |
| **한 일** | `apply_remote_full`에 인덱스 §3; `verify:archived-kim:json`; verify-bundle `archivedKim`; `human:verify` H-011; README·02 |
| **검증** | `verify:bundle:json` overallOk · build OK |
| **당신이 할 일** | H-011 완료 시 `28`에서 `[o]` 후 `npm run human:verify` |

---

## 2026-05-21 05:22:40 — 피드백 시드·DB 인덱스·동료평가 E2E

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-17.md` |
| **한 일** | SWE·OOP 피드백 MCP 시드; `hot_path_membership_indexes` 마이그레이션; E2E #39(학생)·#40(교수); verify `feedbackCount` |
| **검증** | `feedbackCount: 2` · build OK |
| **당신이 할 일** | 교수 계정으로 종료 수업 → 동료평가 전체 조회 확인 (E2E_PROFESSOR_* 설정 시 #40 자동) |

---

## 2026-05-21 05:08:12 — 회고록 시드·교수 평가 E2E

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-16.md` |
| **한 일** | SWE·OOP 회고록 MCP 시드; bundle·apply_remote_full; `CourseProfessorEvalsPage` testid; E2E #38; verify `retrospectiveCount` |
| **검증** | `retrospectiveCount: 2` · build OK |
| **당신이 할 일** | 종료 수업 → 교수 평가에서 학생·프로젝트 문단 표시 확인 |

---

## 2026-05-21 04:38:55 — OOP 평가 시드·verify 팀별

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-15.md` |
| **한 일** | `team-oop-lost` peer·교수 평가 시드(MCP+SQL); bundle·apply_remote_full 재생성; `verify:archived-kim` `evalByArchivedTeam`; smoke #37 |
| **검증** | peer 2·prof 2·project 2 · SWE·OOP `ready: true` |
| **당신이 할 일** | 과거 수업 페이지에서 OOP 카드 → 내 조원평가·교수 평가 클릭 확인 |

---

## 2026-05-21 04:18:42 — MCP 평가 DB·vision #48 과거 수업 페이지

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-14.md` |
| **한 일** | MCP `team_detail_writes_bundle_v2` + 평가 시드 SQL; `MyPageArchivedCoursesPage`·라우트; MyPage 사이드 목록 제거·「과거 수업」버튼; E2E #37; `verify:archived-kim` evalReady |
| **검증** | `npm run verify:archived-kim` OK · `npm run build` OK |
| **당신이 할 일** | H-011 `[o]` 확인 후 마이페이지 PAGE 02 팀 카드·과거 수업 페이지 UI 확인 |

---

## 2026-05-21 03:52:10 — H-011·E2E 아카이브·MyPage 평가 안내

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-13.md` |
| **한 일** | H-011 인간 항목, `openFirstArchivedCourse`, MyPage EvalSchemaNotice, 런칭 doc |
| **당신이 할 일** | **H-011:** `apply_remote_full.sql` Supabase 실행 → `npm run verify:archived-kim` |

---

## 2026-05-21 03:38:15 — apply_remote_full.sql 일괄 적용 파일

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-12.md` |
| **한 일** | `supabase/apply_remote_full.sql` 생성, `npm run supabase:apply-remote-full`, 레거시 테이블 안내 |
| **당신이 할 일** | Supabase SQL Editor에 `apply_remote_full.sql` 1회 실행 → `npm run verify:archived-kim` |

---

## 2026-05-21 03:22:50 — vision #46 평가 테이블 안내·verify 강화

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-11.md` |
| **한 일** | PGRST205 감지, EvalSchemaNotice, verify 상세 출력, E2E #36 |
| **당신이 할 일** | Supabase에서 **bundle v2 SQL** 실행 → `npm run verify:archived-kim` → `evalReady: true` 확인 |

---

## 2026-05-21 03:05:40 — 리포트 로드 오류 UI·시드 점검 스크립트

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-10.md` |
| **한 일** | MyPage 집계 실패 시 오류 배너·재시도, `npm run verify:archived-kim`, 14·38·29 갱신 |
| **당신이 할 일** | SQL Editor에서 bundle 실행 → `npm run verify:archived-kim` → 김학생으로 마이페이지 확인 |

---

## 2026-05-21 02:50:12 — vision #47 마이페이지 진입 수정

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-9.md` |
| **한 일** | `reportHasArchivedTeams`를 state 선언 뒤로 이동(TDZ ReferenceError 제거), E2E #35·`mypage-page` testid |
| **당신이 할 일** | 브라우저에서 `/app/mypage` 새로고침 후 정상 진입 확인 |

---

## 2026-05-21 02:38:40 — vision #20 팀 카드 5열·가로 확대

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-8.md` — 사용자가 vision #20 문구 수정 반영 |
| **한 일** | 팀 목록 xl 5열 그리드, MainLayout 팀 목록 경로 max 1920px, vision_snapshot·29·27 동기화 |
| **당신이 할 일** | 데스크탑에서 팀 카드 페이지 열어 카드 비율 확인 (dev 서버 새로고침) |

---

## 2026-05-21 02:22:15 — 통합 시드 복구·MyPage 빈 상태

| 항목 | 내용 |
|------|------|
| **계획** | `doc/for_agent/plans/260521-7.md` — bundle UTF-8·seed 스크립트·빈 상태 UI |
| **한 일** | `archived_kim_student_bundle.sql` 한글 깨짐 수정, `scripts/build-archived-bundle.mjs` + `npm run seed:archived-bundle`, MyPage 역량/트러블슈팅 빈 안내, 260521-6 마감 |
| **당신이 할 일** | Supabase SQL Editor에서 bundle 실행 → 김학생 로그인 → 리포트·평가 확인 (`38_archived_kim_student_setup.md`) |

---

## 동료 보고 체크포인트

- 2026-05-20 13:04:45 — **여기까지 동료에게 보고함:** `2026-05-20 12:31:17 — T-024 링크 제목 fallback E2E 추가`

---

## 최근 작업 로그 (최신 → 과거)

### 2026-05-21 01:55:07 — 리포트 데모 제거·시드 가이드·프로필 갱신

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-5.md`](../for_agent/plans/260521-5.md) |
| **한 일** | MyPage 하드코딩 데모 프로젝트 제거, 종료 팀플 없을 때 안내 박스, `refreshProfile`, `38_archived_kim_student_setup.md`, E2E #34. |
| **당신에게** | `38_archived_kim_student_setup.md` 순서대로 SQL 실행 후 김학생으로 리포트 확인 |

---

### 2026-05-21 01:47:32 — 아카이브 평가 조회·학생 프로필 수정

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-4.md`](../for_agent/plans/260521-4.md) — vision #30·#34·#44·#35·#46 |
| **한 일** | 종료 수업 「내 조원평가」「교수 평가」 전용 페이지·사이드 네비. MyPage 학생 정보 수정 폼. 리포트 종료 팀 0건 빈 상태. E2E #32·#33. `npm run build` 통과. |
| **당신에게** | `archived_courses_kim_student.sql`·`archived_evals_kim_student.sql` 적용 후 김학생으로 리포트·평가 조회 확인 |

---

### 2026-05-21 01:41:40 — MyPage 리포트·가입 태그·모달·교수 동료평가 조회

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-3.md`](../for_agent/plans/260521-3.md) — vision #33~#42·#38·#39·#45 |
| **한 일** | 리포트: 수신 동료평가 집계, 페이지별 이전/다음 라벨. MyPage: 과거 수업 사이드, 프로필 이미지, 교수 대시보드. 회원가입 기술 태그. TeamDetail 조원평가·회고 모달. `CoursePeerReviewsOverviewPage` + 교수 네비. `npm run build` 통과. |
| **당신에게** | 김학생 계정으로 아카이브 팀플 리포트·시드 SQL 검증 (#35·#46). H-001~H-010은 인간 키. |

---

### 2026-05-21 01:32:03 — vision #14~#44 TeamDetail·평가 게이트·보고서

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-2.md`](../for_agent/plans/260521-2.md) — TeamDetail UX, 종료 후 평가, 수업 삭제, vision 인간 보고서 |
| **한 일** | `29_vision_requests_report.md` 추가. TeamDetail: 조원평가·AI추천·팀원·피드백 집계·교수 TS 금지. 평가는 **archived 후만**. `courses.delete`, `professors.saveProfile`, 팀 진행단계, 활동 2건, 아카이브 네비·평가 시드 SQL. `npm run build` 통과. |
| **당신에게** | 수업 종료 → 조원평가·회고 테스트. 선택: `archived_evals_kim_student.sql` 실행 |

---

### 2026-05-21 01:25:48 — 팀 생성·참여·랜덤 배정·공지게시판

| 항목 | 내용 |
|------|------|
| **계획** | [`260521-1.md`](../for_agent/plans/260521-1.md) — vision #19·#21·#27~#31·#20·#22 인간 키 없이 구현 |
| **한 일** | `api.teams`: create/join/leave/getAssignedStudentIds. TeamsPage: 생성 모달, 참여·탈퇴, 2열 카드, 공지 3건. RandomTeamPage·StudentsNetwork: 교수만 랜덤, 미배정 학생만. `CourseAnnouncementsPage` + 사이드 네비. `npm run build` 통과. |
| **당신이 할 일** | 로컬에서 팀 생성·참여·공지 등록 한 번 확인 (Supabase 연결 필요) |

---

### 2026-05-20 18:17:45 — 타 학생 프로필 단건 조회 멤버십 범위 확장

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-84.md`](../for_agent/plans/260520-84.md) — primary 수업이 아니어도 접근 가능한 수업 네트워크면 `/app/students/:id` 프로필 조회 허용 |
| **한 일** | `getStudentByIdFromDb`: `ai_course_memberships`(student)×접근 가능 `course_id` 확인 후 사용자 로드. `OtherStudentProfilePage` 로딩/에러 `finally`. `npm run build` 확인. |
| **당신이 할 일** | — |

---

### 2026-05-20 18:15:00 — 랜덤 팀 페이지 수업 스코프 라우트 + Projects 카드 링크

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-83.md`](../for_agent/plans/260520-83.md) — 레거시 랜덤 팀을 `courses/:courseId/teams/random`로 통합하고 프로젝트 카드 링크 404 교정 |
| **한 일** | `courses/:courseId/teams/random`를 `:teamId`보다 위에 두어 예약 경로 처리, `/app/teams/random`은 `CourseScopedRedirect` `random-teams`로 primary 수업 URL로 안내. `RandomTeamPage`는 라우트 `courseId`(또는 폴백 primary)로 `api.students.getAll(courseId)`. `ProjectsPage` 카드를 `/app/courses/{courseId}/teams/{teamId}`로 연결. `npm run build` 통과. |
| **당신이 할 일** | — |

---

### 2026-05-20 18:10:30 — vision #13 수강자 네트워크 빈 수업 데모 폴백 제거

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-82.md`](../for_agent/plans/260520-82.md) — vision 추가요청 #13: 해당 수업 학생만 표시, 빈 수업은 데모 목록 금지 |
| **한 일** | `StudentsNetworkPage`에서 `courseId`(수업 스코프)가 있을 때 API가 빈 배열을 반환해도 `fallbackStudents`/데모 extras로 바꾸지 않도록 명시·주석 보강. `vision_snapshot` #13·#14 동기화, `27`·`02`·`05`·`17`·`for_human/01`·`26`에 T-081 반영. |
| **당신이 할 일** | 새로 만든 빈 수업에서 수강자 메뉴를 열었을 때 가짜 카드가 없는지 한 번 확인하면 됨 |

---

### 2026-05-20 16:10:02 — 통합 검증 리포트 실행 파이프라인 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-81.md`](doc/for_agent/plans/260520-81.md) |
| **한 일** | `run-verify-bundle-pipeline.mjs`와 `verify:bundle:pipeline`를 추가해 `preflight:selftest` 통과 후 `save:archive:env`를 순차 실행하도록 자동화. 단일 명령으로 회귀+저장까지 완료 가능하게 정리. |
| **당신이 할 일** | 한 번에 점검/저장하려면 `npm run verify:bundle:pipeline` 실행 |

---

### 2026-05-20 16:04:40 — 통합 검증 리포트 preflight strict self-test 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-80.md`](doc/for_agent/plans/260520-80.md) |
| **한 일** | strict preflight의 정상/실패 경로를 자동 검증하는 `preflight-strict-selftest.mjs`와 `verify:bundle:preflight:selftest`를 추가. 실행 결과 pass 케이스(exit 0), fail 케이스(exit 1) 모두 기대값으로 확인. |
| **당신이 할 일** | strict preflight 회귀 점검은 `npm run verify:bundle:preflight:selftest` 실행 |

---

### 2026-05-20 16:02:27 — 통합 검증 리포트 preflight strict 모드 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-79.md`](doc/for_agent/plans/260520-79.md) |
| **한 일** | `collect-verification-report.mjs`에 `--preflight --strict`를 추가해 경고가 있을 때 즉시 실패(exit 1)하도록 강화. `verify:bundle:preflight:strict` 커맨드 추가 및 동작 확인 완료. |
| **당신이 할 일** | stricter 점검이 필요하면 `npm run verify:bundle:preflight:strict` 실행 |

---

### 2026-05-20 16:00:17 — 통합 검증 리포트 preflight 점검 커맨드 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-78.md`](doc/for_agent/plans/260520-78.md) |
| **한 일** | `collect-verification-report.mjs`에 `--preflight`를 추가해 실제 검증/파일저장 없이 정책·경로·경고를 JSON으로 사전 점검 가능하게 개선. `verify:bundle:preflight` 커맨드와 테스트 문서 반영 완료. |
| **당신이 할 일** | 실행 전 설정 점검이 필요하면 `npm run verify:bundle:preflight` 실행 |

---

### 2026-05-20 15:41:08 — 통합 검증 리포트 보관 정책 .env 외부화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-77.md`](doc/for_agent/plans/260520-77.md) |
| **한 일** | `collect-verification-report.mjs`가 `VERIFY_BUNDLE_KEEP_LATEST`, `VERIFY_BUNDLE_KEEP_DAYS`를 `.env`에서 읽어 보관 정책을 적용하도록 확장. `retentionPolicy.source`(arg/env) 표시와 `verify:bundle:save:archive:env` 커맨드 추가. |
| **당신이 할 일** | `.env`에 정책값을 넣고 `npm run verify:bundle:save:archive:env` 실행하면 정책이 자동 반영됨 |

---

### 2026-05-20 14:59:45 — 통합 검증 리포트 아카이브 일수 기준 정책 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-77.md`](doc/for_agent/plans/260520-77.md) |
| **한 일** | `collect-verification-report.mjs`에 `--keep-days`를 추가해 아카이브를 개수(최신 5개) + 일수(최근 14일) 기준으로 함께 정리 가능하게 확장. `verify:bundle:save:archive:policy` 커맨드와 `retentionPolicy` 출력까지 반영. |
| **당신이 할 일** | 정책 기반 저장/정리를 쓰려면 `npm run verify:bundle:save:archive:policy` 실행 |

---

### 2026-05-20 14:56:56 — 통합 검증 리포트 아카이브 최신 N개 유지 옵션 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-76.md`](doc/for_agent/plans/260520-76.md) |
| **한 일** | `collect-verification-report.mjs`에 `--keep-latest`를 추가하고 `verify:bundle:save:archive:trim` 커맨드로 아카이브를 최신 5개만 유지하도록 확장. 리포트에 `prunedFiles`도 함께 출력. |
| **당신이 할 일** | 아카이브 정리까지 포함하려면 `npm run verify:bundle:save:archive:trim` 실행 |

---

### 2026-05-20 14:47:31 — 통합 검증 리포트 latest+archive 동시 저장 확장

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-75.md`](doc/for_agent/plans/260520-75.md) |
| **한 일** | `verify:bundle:save:archive`를 추가해 최신 리포트(`verification_report_latest.json`) 갱신과 timestamp 아카이브 파일 생성을 동시에 수행. 출력 JSON과 저장 파일 JSON의 `savedFiles` 일관성도 함께 보정. |
| **당신이 할 일** | 리포트 기록까지 남기려면 `npm run verify:bundle:save:archive` 실행 |

---

### 2026-05-20 14:41:34 — 통합 검증 리포트 latest 파일 저장 커맨드 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-74.md`](doc/for_agent/plans/260520-74.md) |
| **한 일** | `verify:bundle:save` 커맨드를 추가해 통합 검증 JSON 리포트를 `doc/for_agent/verification_report_latest.json`에 자동 저장하도록 구성. 실행 및 파일 생성/내용 확인 완료. |
| **당신이 할 일** | 최신 리포트를 파일로 남기려면 `npm run verify:bundle:save` 실행 |

---

### 2026-05-20 14:38:52 — 통합 검증 리포트에 human:sync preview 결합

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-73.md`](doc/for_agent/plans/260520-73.md) |
| **한 일** | `verify:bundle:json` 리포트에 `human:sync --json` preview를 추가해 `moved/reverted/manual/memoAdded` 상태를 함께 출력. `overallOk` 판정에 `revertedCount`까지 반영해 건강도 판정 정확도 향상. |
| **당신이 할 일** | 통합 상태 점검은 계속 `npm run verify:bundle:json` 한 번으로 확인 가능 |

---

### 2026-05-20 14:33:14 — 통합 검증 JSON 리포트 커맨드 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-72.md`](doc/for_agent/plans/260520-72.md) |
| **한 일** | `verify:bundle:json` 커맨드를 추가해 `human:verify:json` 결과와 E2E 스모크 dry-run JSON을 한 번에 수집/요약하도록 구현. 실행 결과 `overallOk=true`, 파싱 오류 없음 확인. |
| **당신이 할 일** | 검증 상태를 한 번에 확인하려면 `npm run verify:bundle:json` 실행 |

---

### 2026-05-20 14:28:24 — E2E 스모크 dry-run/JSON 실행 계획 출력 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-71.md`](doc/for_agent/plans/260520-71.md) |
| **한 일** | `run-e2e-smoke.mjs`에 `--dry-run`/`--json` 옵션을 추가해 실제 테스트 실행 전 분기 모드와 실행 스크립트를 구조화(JSON)로 확인 가능하게 개선. `14_testing.md`도 auto/force/full + dry-run 사용법으로 갱신. |
| **당신이 할 일** | 실행 계획 점검이 필요하면 `npm run test:e2e:smoke -- --dry-run --json` 사용 |

---

### 2026-05-20 14:26:04 — E2E 스모크 수동 강제 모드 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-70.md`](doc/for_agent/plans/260520-70.md) |
| **한 일** | `run-e2e-smoke.mjs`에 `--full`/`--public` 옵션을 추가하고 `test:e2e:smoke:auto`, `test:e2e:smoke:force-public`, `test:e2e:smoke:force-full` 스크립트를 연결. 자동 분기와 수동 강제 실행 경로를 모두 검증 완료. |
| **당신이 할 일** | 평소에는 `npm run test:e2e:smoke`, 모드 강제 확인이 필요하면 `...:force-public` 또는 `...:force-full` 사용 |

---

### 2026-05-20 14:22:17 — E2E 스모크 full 분기 기준 보정

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-69.md`](doc/for_agent/plans/260520-69.md) |
| **한 일** | `run-e2e-smoke.mjs`에서 full 실행 기준을 `E2E_TEST_EMAIL`+`E2E_TEST_PASSWORD`(학생 자격증명)로 보정. 교수 계정만 있는 경우 public-only로 실행되도록 안내 문구를 추가해 불필요한 full 실행/skip을 줄임. |
| **당신이 할 일** | 학생 테스트 계정 준비 전에는 `npm run test:e2e:smoke`로 인증 가드만 점검, 준비 후에는 자동으로 full 경로 실행됨 |

---

### 2026-05-20 14:18:04 — E2E 스모크 자격증명 자동 분기 실행

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-68.md`](doc/for_agent/plans/260520-68.md) |
| **한 일** | `scripts/run-e2e-smoke.mjs`를 추가해 `.env` 자격증명 유무에 따라 스모크를 자동 분기(`test:e2e:smoke:public`/`test:e2e:smoke:full`)하도록 개선. 자격증명이 없을 때는 인증 가드만 실행해 skip 없이 통과하도록 정리. |
| **당신이 할 일** | 일반 점검은 `npm run test:e2e:smoke`, 자격증명 준비 후 전체 스모크는 `npm run test:e2e:smoke:full` 실행 |

---

### 2026-05-20 14:14:41 — vision 추가요청 회귀 스모크 범위 확장

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-67.md`](doc/for_agent/plans/260520-67.md) |
| **한 일** | `test:e2e:smoke` 대상에 E2E #25/#26/#27/#28(수업상세 네비·조원평가/회고록 전용 페이지 이동·수강생 상세 모달)을 추가해 vision 추가요청 회귀를 기본 스모크에서 함께 검증하도록 보강. 실행 결과는 자격증명 의존 11개 skip, 인증 가드 1개 pass 확인. |
| **당신이 할 일** | `.env`에 E2E 계정이 준비되면 `npm run test:e2e:smoke`를 주기적으로 실행해 확장된 회귀 범위를 확인 |

---

### 2026-05-20 13:53:36 — human_action_items 자동 검증 메모 로그 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-66.md`](doc/for_agent/plans/260520-66.md) |
| **한 일** | `28_human_action_items.md`에 「자동 검증 메모(최신 20건)」 섹션을 추가하고, `human:sync:apply`가 pass/fail/manual 결과를 메모 표에 누적 기록하도록 확장. |
| **당신이 할 일** | 체크 후 `npm run human:sync:apply` 실행하면 검증 이력이 메모 표에 자동 남음 |

---

### 2026-05-20 13:48:17 — human_action_items 반자동 동기화 루프 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-65.md`](doc/for_agent/plans/260520-65.md) |
| **한 일** | `sync-human-actions.mjs` 추가. `human:sync`(preview), `human:sync:json`, `human:sync:apply`로 `[o]` 항목을 자동 검증해 pass는 완료표 이동, fail은 `[ ]` 복귀하는 반자동 루프 제공. |
| **당신이 할 일** | 체크 후 적용하려면 `npm run human:sync:apply` 실행 |

---

### 2026-05-20 13:45:39 — human_action_items JSON/CI 검증 모드 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-64.md`](doc/for_agent/plans/260520-64.md) |
| **한 일** | `human:verify`에 `--json`, `--fail-on-manual` 옵션을 추가하고 `npm run human:verify:json`, `npm run human:verify:ci` 커맨드를 연결. 자동화/CI에서 바로 활용 가능한 구조화 결과 및 게이트 모드 제공. |
| **당신이 할 일** | 자동화 결과 공유가 필요하면 `npm run human:verify:json`, CI 게이트는 `npm run human:verify:ci` 사용 |

---

### 2026-05-20 13:43:37 — human_action_items 엄격 검증 모드 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-63.md`](doc/for_agent/plans/260520-63.md) |
| **한 일** | `verify-human-actions`를 기본/엄격 모드로 확장하고 `npm run human:verify:strict`를 추가. 엄격 모드에서는 (해당 시) H-003 검증에 스모크 테스트를 연동하도록 구성. |
| **당신이 할 일** | 필요 시 `npm run human:verify:strict`로 더 강한 검증 실행 |

---

### 2026-05-20 13:41:17 — human_action_items 체크 자동 검증 커맨드 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-62.md`](doc/for_agent/plans/260520-62.md) |
| **한 일** | `scripts/verify-human-actions.mjs`를 추가해 `[o]` 체크된 H-항목을 자동 검증 가능한 범위(H-003 등)에서 `pass/fail/manual`로 판정하도록 구현. `npm run human:verify` 커맨드와 사용법 문서를 반영. |
| **당신이 할 일** | 체크한 항목이 있으면 `npm run human:verify` 실행 후 결과 확인 |

---

### 2026-05-20 13:38:41 — human_action_items 체크 추출 보조 스크립트 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-61.md`](doc/for_agent/plans/260520-61.md) |
| **한 일** | `scripts/check-human-actions.mjs`를 추가해 `28_human_action_items.md`에서 `[o]` 체크된 H-항목만 추출하도록 구현. `npm run human:checked` 커맨드 연결 및 human/agent 문서에 사용법 반영. |
| **당신이 할 일** | 체크한 항목이 있으면 `npm run human:checked`로 즉시 확인 가능 |

---

### 2026-05-20 13:36:45 — vision 요청 12 반영 (human_action_items 체크칸 + AI 검증 규칙)

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-60.md`](doc/for_agent/plans/260520-60.md) |
| **한 일** | `for_human/28_human_action_items.md` 미완료 표에 `체크` 열(`[ ]/[o]`)을 추가하고, `for_agent/28_human_action_items.md`·`23_agent_operating_rules.md`에 체크가 `[o]`인 항목을 AI가 다음 세션에서 실제 검증 후 완료 처리하는 규칙을 명시. vision 추적 문서(T-058) 동기화. |
| **당신이 할 일** | `28_human_action_items.md`에서 완료한 항목 체크를 `[o]`로 바꾸면 됨 (AI가 다음 세션에 검증 수행) |

---

### 2026-05-20 13:33:38 — E2E 스모크 회귀 자동화 + MyPage 실데이터 회귀 시나리오 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-59.md`](doc/for_agent/plans/260520-59.md) |
| **한 일** | `package.json`에 `test:e2e:smoke` 추가, 핵심 회귀(#1/#3/#6/#24/#29/#30/#31 + 인증가드)만 빠르게 실행 가능하도록 구성. `core-flows.spec.ts`에 #31(MyPage PAGE02 실데이터 카드 기준) 추가. smoke 실행 결과 자격증명 기반 시나리오 skip, 인증가드 pass 확인. |
| **당신이 할 일** | 로컬 `.env` 자격증명 준비 후 `npm run test:e2e:smoke`로 핵심 회귀 정기 실행 |

---

### 2026-05-20 13:30:36 — vision 요청 10(MyPage 리포트 실데이터 기준) 보정

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-58.md`](doc/for_agent/plans/260520-58.md) |
| **한 일** | `gatherAiReportContext`를 종료 수업(`archived`)에 참여한 팀플만 집계하도록 수정. `getProjectsForUser`의 더미 테이블 폴백 제거. 종료 팀플이 없으면 MyPage에 빈 상태 안내를 표시하도록 보정. |
| **당신이 할 일** | 마이페이지 리포트에서 실제 참여·종료 팀플만 보이는지 확인 |

---

### 2026-05-20 13:28:36 — vision 신규요청 9·11 반영 (팀 강조 UI + 네비 중복 해소)

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-57.md`](doc/for_agent/plans/260520-57.md) |
| **한 일** | `TeamsPage`에서 멤버십 기반으로 내 팀을 강조(`내가 속한 팀` 배지)하고, `CourseDetailPage` 내부 네비를 제거한 뒤 `MainLayout` 좌측 네비로 강의개요/나의팀멤버/조원평가를 이관해 네비 중복을 해소. 신규 E2E #29/#30 추가. |
| **당신이 할 일** | 팀 목록에서 내 팀 강조 배지와 수업 상세에서 네비 중복이 사라졌는지 확인 |

---

### 2026-05-20 13:24:03 — TeamDetail 미사용 모달 코드 정리

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-56.md`](doc/for_agent/plans/260520-56.md) |
| **한 일** | 조원평가/회고록 전용 페이지 전환 이후 `TeamDetailPage`에 남아 있던 미사용 모달 상태·핸들러·렌더링 코드를 제거해 유지보수성과 안정성을 개선. |
| **당신이 할 일** | 팀 상세에서 회고록 버튼으로 전용 페이지 이동이 기존과 동일하게 동작하는지 확인 |

---

### 2026-05-20 13:21:24 — T-053 수강생 카드 상세 프로필 모달 조회 안정화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-55.md`](doc/for_agent/plans/260520-55.md) |
| **한 일** | `StudentsNetworkPage` 학생 카드 클릭 시 상세 프로필 모달 조회 흐름을 testid 기준으로 안정화하고, E2E #28(카드 클릭→모달 노출→닫기)을 추가해 회귀를 보강. |
| **당신이 할 일** | 수강자들 페이지에서 학생 카드 클릭 시 상세 프로필 모달이 뜨는지 확인 |

---

### 2026-05-20 13:18:06 — T-052 수업 상세 좌측 네비 개편

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-54.md`](doc/for_agent/plans/260520-54.md) |
| **한 일** | 수업 상세에 좌측 사이드 네비를 도입하고 `나의팀멤버` 탭으로 현재 사용자 팀원을 조회할 수 있게 구현. 조원평가 버튼을 수업 상세 사이드바로 이동하고, 관련 E2E(#10/#25/#27)를 갱신. |
| **당신이 할 일** | 수업 상세에서 `나의팀멤버` 클릭 시 팀원 목록이 보이고 `조원평가` 버튼으로 페이지 이동되는지 확인 |

---

### 2026-05-20 13:14:05 — T-051 조원평가·회고록 전용 페이지 전환

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-53.md`](doc/for_agent/plans/260520-53.md) |
| **한 일** | 팀 상세의 조원평가/회고록 버튼을 전용 페이지(`peer-review`, `retrospective`) 이동으로 전환하고, 각 페이지에서 기존 제출 API를 그대로 연동해 작성/저장을 수행하도록 구현. E2E #25/#26(페이지 이동) 추가. |
| **당신이 할 일** | 팀 상세에서 조원평가·회고록 버튼 클릭 시 전용 페이지로 이동하는지 확인 |

---

### 2026-05-20 13:06:18 — vision 요청 5~8 반영 + 트러블슈팅 새로고침 안정화 착수

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-52.md`](doc/for_agent/plans/260520-52.md) |
| **한 일** | `vision.md` 신규 요청 5~8을 상태 문서에 반영하고(T-050~053 등록), 팀 상세 초기 로드를 실패 내성 방식(`Promise.allSettled`)으로 전환해 트러블슈팅 로그가 일부 API 실패 시에도 유지되게 보강. E2E #24(새로고침 유지) 추가. |
| **당신이 할 일** | 로컬 E2E에서 #24(트러블슈팅 새로고침 유지) 통과 확인 |

---

### 2026-05-20 12:31:17 — T-024 링크 제목 fallback E2E 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-51.md`](doc/for_agent/plans/260520-51.md) |
| **한 일** | 링크 제목을 비워도 URL 기반 제목이 자동 생성되는지 검증하는 E2E #23을 추가해 링크 게시물 fallback 동작 회귀를 보강. |
| **당신이 할 일** | 로컬 E2E 실행 시 #23(제목 fallback)까지 통과 확인 |

---

### 2026-05-20 12:28:24 — T-024 업로드 가이드 UX 보강

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-50.md`](doc/for_agent/plans/260520-50.md) |
| **한 일** | 팀 상세에 허용 형식 안내 문구를 추가하고, 업로드 가이드가 표시되는지 검증하는 E2E #22를 추가해 업로드 UX 회귀를 강화. |
| **당신이 할 일** | 팀 상세 산출물 영역에서 허용 형식 안내 문구가 보이는지 확인 |

---

### 2026-05-20 12:26:03 — T-024 금지 확장자 차단 E2E 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-50.md`](doc/for_agent/plans/260520-50.md) |
| **한 일** | 허용되지 않는 파일(`.exe`) 업로드 시 차단 메시지가 뜨는지 검증하는 E2E #21을 추가해 산출물 업로드 정책 회귀를 강화. |
| **당신이 할 일** | 로컬 E2E 실행 시 #21(금지 확장자 차단)까지 통과 확인 |

---

### 2026-05-20 12:23:42 — T-024 소스코드 업로드 확장

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-49.md`](doc/for_agent/plans/260520-49.md) |
| **한 일** | 팀 산출물 업로드 허용 확장자를 코드/압축 파일까지 확대하고(`ts`, `tsx`, `js`, `py`, `java`, `7z`, `rar` 등), E2E #20(.ts 업로드)을 추가. |
| **당신이 할 일** | 팀 상세에서 소스코드 파일(예: `.ts`, `.py`) 업로드가 되는지 확인 |

---

### 2026-05-20 12:21:15 — T-024 URL 자동보정 E2E 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-48.md`](doc/for_agent/plans/260520-48.md) |
| **한 일** | 프로토콜 없는 링크(`example.com/...`) 입력 시 `https://`가 자동 보정되어 저장되는지 검증하는 E2E #19를 추가하고 테스트 문서를 동기화. |
| **당신이 할 일** | 로컬 E2E 실행 시 #19(링크 자동보정)까지 통과 확인 |

---

### 2026-05-20 12:18:59 — T-024 링크 입력 검증 E2E 추가

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-47.md`](doc/for_agent/plans/260520-47.md) |
| **한 일** | 링크 입력 폼 testid를 추가하고, 잘못된 URL 입력 시 에러 다이얼로그가 뜨는지 검증하는 E2E #18을 추가해 산출물 링크 검증 회귀를 보강. |
| **당신이 할 일** | 로컬 E2E 실행 시 #18(잘못된 링크)까지 통과 확인 |

---

### 2026-05-20 12:16:58 — T-024 링크 삭제 E2E 안정화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-47.md`](doc/for_agent/plans/260520-47.md) |
| **한 일** | 팀 산출물 row/삭제 버튼에 testid를 추가하고, 링크 등록 후 삭제까지 검증하는 E2E #17을 추가해 산출물 CRUD 회귀 범위를 보강. |
| **당신이 할 일** | 로컬 E2E에서 #17(링크 삭제)까지 통과하는지 확인 |

---

### 2026-05-20 12:14:37 — T-024 업로드 E2E 안정화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-46.md`](doc/for_agent/plans/260520-46.md) |
| **한 일** | 팀 상세 산출물 업로드 input/button에 testid를 추가하고 Playwright E2E #16(파일 업로드)을 추가해 링크 등록(#15)과 함께 회귀 검증 범위를 확장. |
| **당신이 할 일** | 로컬에서 `npm run test:e2e` 실행 시 #15/#16이 통과하는지 확인 |

---

### 2026-05-20 12:11:47 — T-024 대용량·링크 게시물 구현

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-45.md`](doc/for_agent/plans/260520-45.md) |
| **한 일** | `TeamDetailPage`에 URL 링크 등록 UI를 추가하고, 파일 업로드 한도를 500MB로 확대했으며, 링크형 산출물 API/삭제 처리와 E2E #15를 반영. |
| **당신이 할 일** | 팀 상세에서 링크 등록 + 50MB 초과 파일 업로드(가능한 파일) 동작을 확인 |

---

### 2026-05-20 12:07:34 — T-027 일정 캘린더 선택 구현

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-44.md`](doc/for_agent/plans/260520-44.md) |
| **한 일** | `CoursesPage` 수업 생성 일정 입력을 텍스트에서 캘린더(`type=\"date\"`)로 전환하고 빌드 검증 후 관련 상태 문서를 동기화. |
| **당신이 할 일** | 수업 생성 모달에서 일정 칸 클릭 시 달력이 뜨는지 확인 |

---

### 2026-05-20 12:05:05 — T-026 수업 코드 자동 생성 구현

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-43.md`](doc/for_agent/plans/260520-43.md) |
| **한 일** | `CoursesPage` 수업 생성 모달에서 코드 직접입력을 제거하고 `CC-XXXX-XXXX` 자동 생성/재생성 버튼을 적용, 빌드 검증 후 상태 문서 동기화. |
| **당신이 할 일** | 교수로 수업 생성 열어 코드가 자동으로 채워지고 재생성 버튼이 동작하는지 확인 |

---

### 2026-05-20 12:02:08 — T-025 교수 리포트 비노출 구현

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-42.md`](doc/for_agent/plans/260520-42.md) |
| **한 일** | `MyPage`에 role 가드를 넣어 교수 계정에서 학생 리포트/AI 버튼을 숨기고 안내 블록만 표시, E2E #14 추가, 관련 상태 문서 전체 동기화. |
| **당신이 할 일** | 교수 계정으로 `/app/mypage`에서 학생 리포트가 숨겨지는지 한 번 확인 |

---

### 2026-05-20 11:59:07 — 프로젝트 스캔 기반 doc 동기화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-41.md`](doc/for_agent/plans/260520-41.md) |
| **한 일** | 실제 코드(`MyPage`·`TeamDetailPage`·`CoursesPage`·Edge 함수·E2E)를 스캔해 `02`·`05`·`10`·`14`·`17`·`27`·`for_human/01`·`26` 문서를 최신 근거로 갱신. |
| **당신이 할 일** | 우선순위대로 `T-025`부터 구현 지시하거나, 인간 블로커(H-007/H-002/H-001) 진행 여부를 알려주기 |

---

### 2026-05-20 11:55:25 — vision 이해도·완성도 재점검

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-40.md`](doc/for_agent/plans/260520-40.md) |
| **한 일** | `vision.md` 기준으로 구현 근거를 재점검하고 전체 진행률을 ~58%로 재산정, 신규 4건(T-024~027) 우선순위를 `05`·`17`·`01`에 반영. |
| **당신이 할 일** | 우선순위 확인 후 AI에게 `T-025`부터 바로 구현 지시(교수 화면 학생 리포트 비노출) |

---

### 2026-05-20 11:52:15 — vision 추가요청 반영·사본 대조 규칙

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-39.md`](doc/for_agent/plans/260520-39.md) |
| **한 일** | `vision.md` 추가요청 4건을 `27`·`26`·`05`·`02`에 반영하고, `doc/for_agent/vision_snapshot.md` 사본 + `starter.txt`·`23_agent_operating_rules.md` 대조 절차를 추가. |
| **당신이 할 일** | 다음 세션부터 vision에 요청을 적으면 AI가 사본과 대조해 TODO로 자동 반영되는지 확인 |

---

### 2026-05-20 11:29:48 — 집계 새로고침·A4 닫기 E2E

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-38.md`](doc/for_agent/plans/260520-38.md) |
| **한 일** | MyPage 「집계 새로고침」(`resolveReportContext(true)`), `report-preview-close`, vision·배포 체크리스트·E2E #6 닫기. |
| **당신이 할 일** | 팀 활동 후 마이페이지에서 새로고침 → 카드·A4 미리보기 숫자 반영 확인 |

---

### 2026-05-20 11:28:31 — gatherContext 캐시·런칭 doc

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-37.md`](doc/for_agent/plans/260520-37.md) |
| **한 일** | `resolveReportContext`로 A4·AI 생성 시 중복 Supabase 집계 제거, 36·10 갱신. |
| **당신이 할 일** | [36_launch_one_pager.md](./36_launch_one_pager.md) 순서대로 H-007부터 |

---

### 2026-05-20 11:26:20 — DEMO 지연·A4 testid·인간 상태 doc

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-36.md`](doc/for_agent/plans/260520-36.md) |
| **한 일** | reportContext 준비 후에만 데모 카드, A4 overlay testid, 01·00·26 동기화. |
| **당신이 할 일** | `01_project_status.md` 한눈에 보기 숫자 확인 |

---

### 2026-05-20 11:23:28 — mapToMyPageProjects + RLS 스테이징 가이드

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-35.md`](doc/for_agent/plans/260520-35.md) |
| **한 일** | `mapReportContextToMyPageProjects` DRY, `rls_staging_verification.md`, E2E PAGE02 팀 카드. |
| **당신이 할 일** | H-007 후 [rls_staging_verification.md](../for_agent/rls_staging_verification.md) 순서 확인 |

---

### 2026-05-20 11:21:08 — 프로젝트 카드 DB 동기화 + E2E #13

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-34.md`](doc/for_agent/plans/260520-34.md) |
| **한 일** | reportContext→projects, getMyPageProjects 메타 보강, Edge README, E2E AI 생성 버튼. |
| **당신이 할 일** | Edge deploy 후 「AI 리포트 생성」 — 초안 또는 LLM 메시지 확인 |

---

### 2026-05-20 11:18:17 — Edge DB 초안 200 (OPENAI 없음)

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-33.md`](doc/for_agent/plans/260520-33.md) |
| **한 일** | Edge가 OPENAI 없이도 `draft-db-only` 200 반환, MyPage 메시지·`buildReportSummaryDraft`. |
| **당신이 할 일** | [30](./30_edge_ai_report.md) — `functions deploy` 후 OPENAI 없이 「AI 리포트 생성」 테스트 |

---

### 2026-05-20 11:16:01 — PAGE01 역량·활동 요약 DB화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-32.md`](doc/for_agent/plans/260520-32.md) |
| **한 일** | 핵심 역량 진단·간략 활동 요약을 DB 활동 기반 추정으로 전환, E2E #7. |
| **당신이 할 일** | PAGE01 역량 바 숫자가 체감과 맞는지 확인 (LLM 전 추정치) |

---

### 2026-05-20 11:13:26 — 마이페이지 PAGE01 카드·PAGE03 집계

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-31.md`](doc/for_agent/plans/260520-31.md) |
| **한 일** | 협업 제출 4번째 카드, PAGE03 해결 건수 intro, E2E #7 확장. |
| **당신이 할 일** | PAGE01 「협업 제출」·PAGE03 intro 숫자가 DB와 일치하는지 확인 |

---

### 2026-05-20 11:09:20 — 마이페이지 리포트 DB 집계 동기화

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-30.md`](doc/for_agent/plans/260520-30.md) |
| **한 일** | PAGE01 요약·기술 칩·PAGE02 팀 카드를 `ai-report` 집계와 통일, E2E #7. |
| **당신이 할 일** | 마이페이지 PAGE 01 요약에 피드백·교수평가 건수가 A4와 같은지 확인 |

---

### 2026-05-20 11:07:45 — A4 팀별 상세 섹션 보강

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-29.md`](doc/for_agent/plans/260520-29.md) — 팀별 트러블슈팅·산출물을 A4 「팀별 상세」에 반영 |
| **한 일** | `buildTeamSectionBody`, 팀별 `deliverableFileNames`, `report-team-sections`, E2E #6. |
| **당신이 할 일** | [37](./37_verify_ai_report.md) 팀 섹션 — 산출물·트러블슈팅 줄 확인 |

---

### 2026-05-20 11:04:22 — A4 해결 문제·기술 역량 DB 초안

| 항목 | 내용 |
|------|------|
| **계획** | [`260520-28.md`](doc/for_agent/plans/260520-28.md) — 트러블슈팅·산출물로 A4 「해결한 문제」「기술·역량」 풍부화 |
| **한 일** | `buildProblemsSolvedDraft`·`buildTechnologiesDraft`, A4 testid, E2E #6 확장, doc 10·11·14·37. |
| **당신이 할 일** | [37](./37_verify_ai_report.md) #4·#5 — A4 목록·기술 줄 확인 (번들 v2 후) |

---

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
