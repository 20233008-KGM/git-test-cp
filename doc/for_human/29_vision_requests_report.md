# vision.md 추가요청 — 처리 현황 보고 (인간용)

> **원본:** `vision.md` 상단 「추가요청사항」 + Cursor 대화창 직접 요청  
> **기술 추적:** `doc/for_agent/27_vision_feature_matrix.md` · `doc/for_human/26_vision_features_status.md`  
> **갱신:** 2026-05-22  
> **대화창 요청 정본:** 아래 §**대화창에서 요청한 내용** (맨 위 = 최신)  
> **에이전트 필수:** [`chat_request_recording.md`](../for_agent/chat_request_recording.md) — 구현 **같은 턴**에 이 표·`25`·`plans` 갱신

AI는 `vision.md`를 수정하지 않습니다. 이 문서는 **처리 여부·방법**을 인간이 한눈에 보기 위한 보고서입니다.

---

## 대화창에서 요청한 내용

`vision.md`가 아니라 **이 Cursor 대화창에서 직접** 말씀하신 작업입니다.

**AI 기록 규칙 (요약):** `plans/YYMMDD-N.md` → 구현 → **채팅 답 전** 이 표 **맨 위**에 `C-YYMMDD-N` · `25` 맨 위 · plan `done`.  
표에서 오늘 `C-YYMMDD-*`의 **가장 큰 N** 다음 번호를 씁니다. 자세한 절차는 `chat_request_recording.md`.

| ID | 요청일 | 요청 요약 | 상태 | 계획·처리 |
|----|--------|-----------|------|-----------|
| C-260522-28 | 2026-05-22 | **내 팀**·서브메뉴 **워크스페이스** 클릭 시 팀 워크스페이스 바로 진입 | ✅ | [`260522-19.md`](../for_agent/plans/260522-19.md) · `MainLayout` |
| C-260522-27 | 2026-05-22 | doc 기록 잘 하고 있는지 — 작업지침 확인 | 📖 | [`chat_request_recording.md`](../for_agent/chat_request_recording.md) · 본 답변 · C-260522-24~26 소급 |
| C-260522-26 | 2026-05-22 | **내 팀** 서브메뉴 다른 버튼 덮지 않게 · 부드럽게 펼침 | ✅ | [`260522-16.md`](../for_agent/plans/260522-16.md) · `MainLayout` in-flow + animation |
| C-260522-25 | 2026-05-22 | 프로필 미입력 시 수강자 카드·모달·내 정보 빈 값 UX | ✅ | [`260522-16.md`](../for_agent/plans/260522-16.md) · `studentNetworkDisplay.ts` |
| C-260522-24 | 2026-05-22 | 팀장 표시 · 팀장 넘기기 · 수업 메뉴 **내 팀** · 팀 관리 페이지 | ✅ | [`260522-15.md`](../for_agent/plans/260522-15.md) · `CourseTeamManagePage` |
| C-260522-23 | 2026-05-22 | 프로젝트 폴더 선택 → node_modules 제외 ZIP 자동 업로드 | ✅ | [`260522-14.md`](../for_agent/plans/260522-14.md) · `projectSourceZip.ts` |
| C-260522-22 | 2026-05-22 | 대화창 요청이 `29`·`25`에 잘 남도록 업무지침 개선 | ✅ | [`260522-13.md`](../for_agent/plans/260522-13.md) · [`chat_request_recording.md`](../for_agent/chat_request_recording.md) |
| C-260522-21 | 2026-05-22 | 왜 `29`·`25`에 대화 요청이 안 남는지 — 원인·소급 기록 | ✅ | 본 응답 · C-260522-17~20 소급 · [`260522-11.md`](../for_agent/plans/260522-11.md) |
| C-260522-20 | 2026-05-22 | 류지원 교수 「웹프로그래밍」 2026-1 (`CC-WPGM-2601`) | ✅ | [`260522-20.md`](../for_agent/plans/260522-20.md) · Supabase MCP |
| C-260522-19 | 2026-05-22 | 팀 워크스페이스 배너·안내 제거 · 트러블슈팅 「기록등록」 모달 | ✅ | [`260522-18.md`](../for_agent/plans/260522-18.md) |
| C-260522-18 | 2026-05-22 | 팀 산출물 링크·파일 「산출물 등록」 통합 · 등록 항목 수정 | ✅ | [`260522-18.md`](../for_agent/plans/260522-18.md) · `TeamDeliverableSubmitModal` |
| C-260522-17 | 2026-05-22 | 파일 업로드 실패 조사 · Storage 키 ASCII(한글 Invalid key) | ✅ | [`260522-17.md`](../for_agent/plans/260522-17.md) · `buildDeliverableStorageFileName` |
| C-260522-16 | 2026-05-22 | 왜 `29`·`25`에 대화 요청이 안 남는지 — 소급·절차 설명 (중복 질문) | ✅ | C-260522-21과 동일 주제 |
| C-260522-15 | 2026-05-22 | 트러블슈팅 AI 「DB 초안: 산출물이 없고 진행률이 낮습니다」 제거 | ✅ | `recommend-troubleshooting` · `TeamDetailPage` · `ai-troubleshooting.ts` |
| C-260522-14 | 2026-05-22 | 김학생2를 김학생과 동일 DB로(팀·평가 이전, 권한 충돌 방지) | ✅ | `clone_kim_student_to_kim_student2.sql` · `dev_stu2@gmail.com` 수동 로그인 |
| C-260522-13 | 2026-05-22 | 실사용 E2E·사용자 플로우 정리·자동 테스트 | 🔶 | [`260522-12.md`](../for_agent/plans/260522-12.md) · 로그인 testid · `user-journeys.spec.ts` · 전체 E2E 일부 fail |
| C-260522-12 | 2026-05-22 | starter·vision 읽고 프로젝트·작업 지침 확인 | 📖 | `doc/starter.txt` · `vision.md` · §0 plans 규칙 |
| C-260522-11 | 2026-05-22 | 김규민 — 수강자들 본인 카드·내 정보 수정에 김학생 데이터 노출 | ✅ | [`260522-11.md`](../for_agent/plans/260522-11.md) · `StudentsNetworkPage` · `supabase-api.ts` |
| C-260522-10 | 2026-05-22 | Storage `ai_team_deliverables` 업로드 50MB → 500MB | ✅ | [`260522-10.md`](../for_agent/plans/260522-10.md) · 마이그레이션 |
| C-260522-9 | 2026-05-22 | recommend-troubleshooting 배포·500·오류 메시지 수정 | ✅ | [`260522-9.md`](../for_agent/plans/260522-9.md) |
| C-260522-8 | 2026-05-22 | 트러블슈팅 AI 추천 Gemini Edge 실구현 | ✅ | [`260522-8.md`](../for_agent/plans/260522-8.md) |
| C-260522-7 | 2026-05-22 | 트러블슈팅 「AI 추천」이 진짜 AI인지 질문 | 📖 | mock→Edge 안내 (이후 C-260522-8 구현) |
| C-260522-6 | 2026-05-22 | 대화창 요청 기록 칸을 `29`로 이전 (`26`에서 분리) | ✅ | 본 문서·`23`·`26`·`starter.txt` |
| C-260522-5 | 2026-05-22 | 마이페이지 리포트 A4 고정·버튼 정리·가독성 개선 | ✅ | [`260522-7.md`](../for_agent/plans/260522-7.md) · `StudentReportA4Sheet` |
| C-260522-4 | 2026-05-22 | 대화창 요청도 계획·기록·doc 지침 추가 | ✅ | [`260522-6.md`](../for_agent/plans/260522-6.md) |
| C-260522-3 | 2026-05-22 | H-003 완료 반영 (로컬 E2E `.env`) | ✅ | `28` 완료 표 |
| C-260522-2 | 2026-05-22 | E2E A4 testid · vision #55 빈 수업 UI | ✅ | [`260522-5.md`](../for_agent/plans/260522-5.md) |
| C-260522-1 | 2026-05-22 | 프로젝트 상태 스캔 + `doc/` 최신화 | ✅ | [`260522-4.md`](../for_agent/plans/260522-4.md) |

**상태:** ✅ 완료 · 🔶 진행 중 · ❌ 미착수 · ⏸ 인간 대기 (H-xxx)

새 요청이 오면 **맨 위 행**에 ID `C-YYMMDD-N` (그날 순번)으로 추가합니다.

### 대화창 요청 요약

| 구간 | 완료 |
|------|------|
| C-260522-1~28 (구현·안내) | 26 |

---

## 요약 (vision.md 추가요청 #1~#55)

| 구간 | 완료 | 진행/부분 | 미착수 |
|------|------|-----------|--------|
| #1~#13 | 13 | 0 | 0 |
| #14~#22 | 9 | 0 | 0 |
| #23~#32 | 9 | 0 | 0 |
| #33~#46 | 14 | 0 | 0 |
| #47~#48 | 2 | 0 | 0 |
| #49 | 1 | 0 | 0 |
| #50 | 1 | 0 | 0 |
| #51 | 1 | 0 | 0 |
| #52 | 1 | 0 | 0 |
| #53 | 1 | 0 | 0 |
| #54 | 1 | 0 | 0 |
| #55 | 1 | 0 | 0 |

---

## 상세 (1~54)

| # | 요청 요약 | 상태 | 처리 방법 |
|---|-----------|------|-----------|
| 1 | 대용량 업로드·링크 게시물 | ✅ | `TeamDetailPage` 500MB·URL 게시물 (T-024) |
| 2 | 교수에게 학생 리포트 숨김 | ✅ | `MyPage` role 가드 (T-025) |
| 3 | 수업 코드 자동 생성 | ✅ | `CoursesPage` CC-XXXX-XXXX (T-026) |
| 4 | 일정 캘린더 | ✅ | `type="date"` (T-027) |
| 5 | 트러블슈팅 새로고침 유실 | ✅ | DB 로드 안정화 (T-050) |
| 6 | 조원평가·회고록 전용 페이지 | ✅ | 전용 route (T-051) |
| 7 | 나의팀멤버·조원평가 네비 | ✅ | `MainLayout` 사이드 네비 (T-052) |
| 8 | 수강생 카드 상세 모달 | ✅ | `StudentsNetworkPage` (T-053) |
| 9 | 내 팀 강조 UI | ✅ | `TeamsPage` 배지 (T-054) |
| 10 | 리포트 실데이터 | ✅ | archived 팀플만 집계 (T-055) |
| 11 | 중복 네비 제거 | ✅ | `CourseDetailPage` 내부 네비 제거 (T-056) |
| 12 | human_action 체크칸 | ✅ | `28_human_action_items` (T-058) |
| 13 | 수강자 해당 수업만 | ✅ | 데모 폴백 제거 (T-081) |
| 14 | 이 보고 문서 + agent 유지 | ✅ | 본 문서 + `23`·`26` 규칙 (T-090) |
| 15 | 조원평가 버튼 회고록 왼쪽 | ✅ | `TeamDetailPage` 버튼 순서 (T-091) |
| 16 | 트러블슈팅 작성 폼 하단 | ✅ | 스크롤 밖 하단 배치 (T-091) |
| 17 | AI 추천 트러블슈팅 최상단 | ✅ | 추천 카드 고정 (T-091) |
| 18 | 학생 프로필 모달 | ✅ | 수강자 네트워크·팀/마이페이지 모달 `fixed` (T-053·T-171·T-172) |
| 19 | 팀 생성 동작 | ✅ | `api.teams.create` (T-084) |
| 20 | 팀 카드 5열·메인 가로 확대 | ✅ | xl 5열 그리드, 팀 목록 max 1920px (T-120) |
| 21 | 팀 참여·탈퇴 | ✅ | join/leave (T-085) |
| 22 | 공지게시판·최신 3건 | ✅ | `CourseAnnouncementsPage` (T-089) |
| 23 | 진행 단계 표시·수정 | ✅ | `updateCompletedStages` (T-092) |
| 24 | 팀 카드 최신 활동 2건 | ✅ | API slice 2 (T-092) |
| 25 | 교수 평가 모달 | ✅ | 기존 모달 + 종료 후만 열림 (T-093) |
| 26 | 피드백 버튼 옆 인원 수 | ✅ | `getFeedbackCounts` (T-091) |
| 27 | 랜덤 시 기존 팀원 제외 | ✅ | T-086 |
| 28 | 팀 생성 후 카드 로드 | ✅ | reload·navigate (T-084) |
| 29 | 워크스페이스 팀원 UI | ✅ | 팀원 패널 + DB 멤버 (T-091) |
| 30 | 교수·학생 정보 수정 | ✅ | 교수 `saveProfile`, 학생 MyPage `saveStudentProfile` (T-104) |
| 31 | 학생 랜덤 금지·수동 팀 생성 | ✅ | T-087·T-084 |
| 32 | 교수 트러블슈팅 작성 금지 | ✅ | API·UI 학생만 (T-091) |
| 33 | 조원평가·회고록 모달 | ✅ | `TeamDetailPage` 모달 + 전용 route 유지 (T-101) |
| 34 | 마이페이지 과거 수업·평가 네비 | ✅ | MyPage 과거 수업 → 내 조원평가·교수 평가 링크 (T-103) |
| 35 | 아카이브 팀플 리포트 조회 | ✅ | MCP 시드·`verify:archived-kim` reportOk (T-143) |
| 36 | 아카이브 평가 더미 SQL | ✅ | SWE·OOP 팀 평가 시드 (T-146) |
| 37 | 교수 수업 삭제 | ✅ | `api.courses.delete` (T-094) |
| 38 | 리포트에 동료평가·팀플 모달 | ✅ | `peerReviewsReceived` 집계 + 프로젝트 상세 모달 (T-096) |
| 39 | 리포트 페이지 버튼 라벨 | ✅ | 페이지별 이전/다음 라벨·화살표 (T-097) |
| 40 | 마이페이지 프로필 이미지 | ✅ | `ai_users.image` data URL 업로드 (T-099) |
| 41 | 회원가입 기술 태그 | ✅ | `SignInPage` 프리셋·직접입력 → `skills` (T-099) |
| 42 | 교수 마이페이지 정보 | ✅ | 교수 대시보드 블록 (T-100) |
| 43 | 종료 후에만 평가 | ✅ | archived일 때만 평가 API·UI (T-093) |
| 44 | 아카이브 네비 평가 조회 | ✅ | `/evals/my-peer-reviews`, `/evals/professor` (T-103) |
| 45 | 교수가 동료평가 열람 | ✅ | `CoursePeerReviewsOverviewPage` + 팀 상세 링크 (T-102) |
| 46 | 평가 저장·조회 검증 | ✅ | MCP bundle v2·평가 시드, `evalReady: true` (T-142·143) |
| 47 | 마이페이지 진입 불가 | ✅ | `reportHasArchivedTeams` TDZ 수정, E2E #35 (T-123) |
| 48 | 마이페이지 사이드 과거 수업 직접 노출 금지 | ✅ | 사이드「과거 수업」버튼 → `MyPageArchivedCoursesPage` (T-144) |
| 49 | 다른 팀에서 트러블슈팅 작성 폼 노출 | ✅ | `assertStudentOwnTeamWrite` + `TeamDetailPage` 내 팀만 작성·E2E #42 (T-170) |
| 50 | 학생 프로필이 페이지 하단 인라인 (#8·#18과 별도) | ✅ | `StudentProfileModal` `fixed inset-0` 오버레이·E2E #43 (T-171) |
| 51 | 팀 탈퇴 워크스페이스 내부·소형 / 참여버튼 숨김 | ✅ | 하단 muted 탈퇴·팀 소속 시 `team-join` 미노출 (T-173·T-174) |
| 52 | 팀 탈퇴 버튼 적당히 보이게 | ✅ | #51과 동일 — 워크스페이스 하단 `team-workspace-leave` (T-174) |
| 53 | 본인 팀인데 트러블슈팅 작성 비활성 | ✅ | `ai_team_detail_teammates` id→`user_id` 매핑 + `api.teams.isStudentMember` + E2E #46 (T-177) |
| 54 | 워크스페이스 FIGMA·중간·기말발표 더미 칸 제거 | ✅ | `TeamDetailPage` 플레이스홀더 3칸 삭제 + E2E #47 (T-181) |
| 55 | 빈 수업 목록 시 수업코드 등록 UI 이중 표시 | ✅ | 수업 0개일 때 상단 배너 숨김·empty 내부 폼만 + E2E #48 (T-183) |

---

## AI 유지 규칙 (에이전트)

1. `vision.md` 변경 시 `27`·본 문서 §상세(1~55)·`26`을 같은 세션에 갱신한다.
2. **대화창 직접 요청**은 `vision.md`가 아니라 **본 문서 §대화창에서 요청한 내용** + `25_ai_work_log` + `plans/YYMMDD-N.md`에 기록 (`23`·`26_document_standards` §대화창 직접 요청).
3. 완료 시 **처리 방법** 한 줄을 반드시 적는다.
4. 인간 전용 키·SQL·배포는 `28_human_action_items.md`에만 기록한다.
