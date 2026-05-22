# vision.md 추가요청 — 처리 현황 보고 (인간용)

> **원본:** `vision.md` 상단 「추가요청사항」 + Cursor 대화창 직접 요청  
> **기술 추적:** `doc/for_agent/27_vision_feature_matrix.md` · `doc/for_human/26_vision_features_status.md`  
> **갱신:** 2026-05-22 23:30:00  
> **대화창 요청 정본:** §**대화창에서 요청한 내용** (`C-YYMMDD-N`만)  
> **vision 추가요청 정본:** §**상세 (1~#59)** (`#N`만)  
> **에이전트 필수:** [`chat_request_recording.md`](../for_agent/chat_request_recording.md) §0 분류 결정

AI는 `vision.md`를 수정하지 않습니다. 이 문서는 **처리 여부·방법**을 인간이 한눈에 보기 위한 보고서입니다.

---

## 기록 분류 (필수)

| 출처 | ID 형식 | 적는 곳 | C-ID 부여 |
|------|---------|---------|-----------|
| **Cursor 채팅**에서 직접 지시 | `C-YYMMDD-N` | 아래 §대화창 표 | ✅ |
| **`vision.md` 추가요청** #1~#59 | `#N` | 아래 §상세 표 | ❌ |
| **`starter.txt`·`02`·감사 doc** 점검만 | (없음) | `25_ai_work_log` + `plans` | ❌ |

**혼동 사례 (2026-05-22):** `260522-46` 세션에서 vision #30·#25·`32` 점검 분을 `C-260522-52~53`으로 §대화창에 적음 → **잘못됨.** §상세 #30·#25로 이전함. 채팅 직접 지시(로그인 카드·교수 팀멤버)만 `C-260522-50~51` 유지.

---

## 대화창에서 요청한 내용

**이 섹션에는 채팅에서 직접 말한 일만 넣습니다.** vision.md 추가요청·starter 점검만으로 한 일은 §상세 `#N` 또는 `25` 일지에만 기록합니다.

**AI 기록 규칙:** [`chat_request_recording.md`](../for_agent/chat_request_recording.md) §0 → 구현 같은 턴 §대화창 맨 위 `C-…` · `25` · `plans`.

| ID | 요청일 | 요청 요약 | 상태 | 계획·처리 |
|----|--------|-----------|------|-----------|
| C-260522-55 | 2026-05-22 | doc 최신화 (vision #56~59·`/mypage/profile`·기록 분류·진행률 동기화) | ✅ | [`260522-48.md`](../for_agent/plans/260522-48.md) · `01`·`02`·`05`·`08`·`17`·`26`·`27`·`25` |
| C-260522-54 | 2026-05-22 | `29` 기록 분류 — C는 채팅만, vision #은 §상세만 (C-52~53 오분류 수정) | ✅ | [`chat_request_recording.md`](../for_agent/chat_request_recording.md) §0 · `29`·`23`·`26`·`starter` |
| C-260522-51 | 2026-05-22 | 교수 수업 진입 시 「나의 팀 멤버」·「팀 관리」 사이드 숨김 | ✅ | [`260522-46.md`](../for_agent/plans/260522-46.md) · `MainLayout.tsx` · §상세 #7 보완 |
| C-260522-50 | 2026-05-22 | 로그인·회원가입 화면 수강인원·Q&A 장식 카드 제거 | ✅ | [`260522-46.md`](../for_agent/plans/260522-46.md) · `LandingPage.tsx` · `SignInPage.tsx` |
| C-260522-49 | 2026-05-22 | doc 최신화 (마이페이지 내 정보·수업코드 타이포·수강자들 버튼 반영) | ✅ | [`260522-45.md`](../for_agent/plans/260522-45.md) · `02`·`12`·`08`·`18`·`01`·`25` |
| C-260522-48 | 2026-05-22 | 수강자들 페이지 「내 프로필 보기」버튼 제거 | ✅ | [`260522-45.md`](../for_agent/plans/260522-45.md) · `StudentsNetworkPage.tsx` |
| C-260522-47 | 2026-05-22 | 수업코드 폰트 — 얇고 깔끔한 sans (`cc-course-code`) | ✅ | [`260522-45.md`](../for_agent/plans/260522-45.md) · `cc-colors.css` · `CourseListCard` |
| C-260522-46 | 2026-05-22 | 내 정보 탭 편집 필드 구분·하단 「학생 계정 전용」안내 숨김 | ✅ | [`260522-45.md`](../for_agent/plans/260522-45.md) · `MyPage.tsx` · `cc-input--readonly` |
| C-260522-45 | 2026-05-22 | 마이페이지 「내 정보 조회/수정」→「내 정보」통합 · `?tab=profile` · 저장 | ✅ | [`260522-45.md`](../for_agent/plans/260522-45.md) · `MyPage.tsx` · E2E #34 |
| C-260522-44 | 2026-05-22 | doc 최신화 (광학 정렬·마이페이지·수업코드 복사·배포 반영) | ✅ | [`260522-40.md`](../for_agent/plans/260522-40.md) · `02`·`12`·`08`·`25` |
| C-260522-43 | 2026-05-22 | git commit 「260522-2 디자인 수정」·push·`vercel --prod` | ✅ | commit `994e9480` · https://git-test-cp.vercel.app |
| C-260522-42 | 2026-05-22 | 수업 카드 수업코드 div — 왼쪽 복사 아이콘 · 전체 클릭 시 클립보드 복사 | ✅ | [`260522-40.md`](../for_agent/plans/260522-40.md) · `CourseListCard` · `cc-course-card__code` |
| C-260522-41 | 2026-05-22 | 마이페이지 프로필 사진 테두리(흰 아이콘 구분) · 사진 변경 버튼 축소 | ✅ | [`260522-40.md`](../for_agent/plans/260522-40.md) · `MyPage.tsx` |
| C-260522-40 | 2026-05-22 | 좌측 네비+메인 블록 살짝 우츙(광학적 중앙) · 헤더·푸터 동기 | ✅ | [`260522-40.md`](../for_agent/plans/260522-40.md) · `cc-app-shell--optical` · `hasSideNavLayout` |
| C-260522-39 | 2026-05-22 | doc 최신화 (레이아웃·로딩·수업카드·좌측네비 반영) | ✅ | [`260522-36.md`](../for_agent/plans/260522-36.md) · `02`·`12`·`18`·`01`·`25`·`32` |
| C-260522-38 | 2026-05-22 | 좌측 네비 가독성 (아이콘·계층) · 내 팀 화살표 줄바꿈 수정 | ✅ | [`260522-36.md`](../for_agent/plans/260522-36.md) · `SideNavItem` · `m3-nav-item--split` |
| C-260522-37 | 2026-05-22 | 수업 카드 가독성 · 제목과 수업 코드 한 줄 | ✅ | [`260522-36.md`](../for_agent/plans/260522-36.md) · `CourseListCard` · `cc-course-card__title-row` |
| C-260522-36 | 2026-05-22 | 레이아웃 점검·푸터 첫 화면 숨김·로딩 스피너 UI | ✅ | [`260522-36.md`](../for_agent/plans/260522-36.md) · `cc-main-viewport` · `PageLoading` |
| C-260522-35 | 2026-05-22 | 좌측 네비·컬러 시스템 통일 (amber 등 제거) | ✅ | [`260522-35.md`](../for_agent/plans/260522-35.md) · `m3-nav-item` · `cc-alert-*` |
| C-260522-34 | 2026-05-22 | doc 최신화 (네비·셸·프로필·반응형 감사 반영) | ✅ | [`260522-22.md`](../for_agent/plans/260522-22.md) · `02`·`08`·`12`·`18`·`25`·`32` |
| C-260522-33 | 2026-05-22 | 전체 사이트 반응형 레이아웃 상태 점검 | 📖 | [`32_responsive_layout_audit.md`](./32_responsive_layout_audit.md) · P1 수정은 미착수 |
| C-260522-32 | 2026-05-22 | 프로필 이미지 변경 시 헤더·팀·네트워크 등 연동 | ✅ | [`260522-22.md`](../for_agent/plans/260522-22.md) · `UserAvatar` · `imageUrl` · `refreshProfile` |
| C-260522-31 | 2026-05-22 | 상단 네비 로고 글자 크기 · 네비 가로폭=사이드+메인 | ✅ | [`260522-22.md`](../for_agent/plans/260522-22.md) · `cc-app-shell` · `appShell.ts` |
| C-260522-30 | 2026-05-22 | 상단 헤더 네비게이션 폰트 가독성 개선 | ✅ | [`260522-22.md`](../for_agent/plans/260522-22.md) · Noto Sans KR · `m3-top-app-bar__*` |
| C-260522-29 | 2026-05-22 | 상용 UI 벤치마크·디자인 개선안 제출·디자인 담당 추가·UI 1차 개선 | ✅ | [`260522-21.md`](../for_agent/plans/260522-21.md) · `18` · `31` · 토큰·네비·팀 WS |
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
| C-260522-1~54 (§대화창만) | 48 |

---

## 요약 (vision.md 추가요청 #1~#59)

| 구간 | 완료 | 진행/부분 | 미착수 |
|------|------|-----------|--------|
| #1~#13 | 13 | 0 | 0 |
| #14~#22 | 9 | 0 | 0 |
| #23~#32 | 9 | 0 | 0 |
| #33~#46 | 14 | 0 | 0 |
| #47~#48 | 2 | 0 | 0 |
| #49~#55 | 7 | 0 | 0 |
| #56~#59 | 4 | 0 | 0 |

---

## 상세 (vision.md 추가요청 #1~#59)

> **채팅 ID 없음.** 완료·변경 시 이 표의 **처리 방법**을 갱신한다. 채팅에서 같은 주제를 지시했으면 §대화창 `C-…`에도 1행 두고, 여기에는 `#N`과 처리 방법만 적는다.

| # | 요청 요약 | 상태 | 처리 방법 |
|---|-----------|------|-----------|
| 1 | 대용량 업로드·링크 게시물 | ✅ | `TeamDetailPage` 500MB·URL 게시물 (T-024) |
| 2 | 교수에게 학생 리포트 숨김 | ✅ | `MyPage` role 가드 (T-025) |
| 3 | 수업 코드 자동 생성 | ✅ | `CoursesPage` CC-XXXX-XXXX (T-026) |
| 4 | 일정 캘린더 | ✅ | `type="date"` (T-027) |
| 5 | 트러블슈팅 새로고침 유실 | ✅ | DB 로드 안정화 (T-050) |
| 6 | 조원평가·회고록 전용 페이지 | ✅ | 전용 route (T-051) |
| 7 | 나의팀멤버·조원평가 네비 | ✅ | `MainLayout` 사이드 네비 (T-052) · **교수·관리자**는 「나의 팀 멤버」「팀 관리」 미노출 · 워크스페이스만 (`showMembersLink`/`showTeamManage`=`isStudent`, 2026-05-22 [`260522-46`](../../for_agent/plans/260522-46.md)) |
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
| 25 | 교수 평가 모달 | ✅ | `fixed` 모달 + 종료 후만 (T-093) · 모바일 패딩 `px-4 sm:px-8 lg:px-16` · 제목 `text-xl sm:text-2xl` (2026-05-22 [`260522-46`](../../for_agent/plans/260522-46.md), [`32`](./32_responsive_layout_audit.md) §1) |
| 26 | 피드백 버튼 옆 인원 수 | ✅ | `getFeedbackCounts` (T-091) |
| 27 | 랜덤 시 기존 팀원 제외 | ✅ | T-086 |
| 28 | 팀 생성 후 카드 로드 | ✅ | reload·navigate (T-084) |
| 29 | 워크스페이스 팀원 UI | ✅ | 팀원 패널 + DB 멤버 (T-091) |
| 30 | 교수·학생 정보 수정 | ✅ | 교수 `saveProfile` · 학생 `saveStudentProfile` · **`/app/mypage/profile`** 전용 편집 (`MyPageProfilePage`) · **`ai_users.school`**·학번 저장 (2026-05-22 [`260522-46`](../../for_agent/plans/260522-46.md), MCP `ai_users_school`) |
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
| 56 | 내 정보 페이지 입력·라벨 여백 | ✅ | `cc-input` 패딩 · `ProfileFieldLabel` · `MyPageProfilePage` ([`260522-47`](../for_agent/plans/260522-47.md)) |
| 57 | 이메일 안내 문구 제거 | ✅ | 안내 문단 삭제 · 이메일 `hint="변경 불가"` |
| 58 | 수강자들·마이페이지 내 정보 수정 일치 | ✅ | 「내 정보 수정」→ `/app/mypage/profile` · `MyInfoEditModal` 제거 |
| 59 | 로그인 페이지 푸터 숨김 | ✅ | `LandingPage` Footer 제거 |

---

## AI 유지 규칙 (에이전트)

1. `vision.md` 변경 시 `27`·본 문서 §상세(1~#59)·`26`을 같은 세션에 갱신한다.
2. **채팅 직접 요청** → §대화창 `C-YYMMDD-N` + `25` + `plans` (`chat_request_recording.md` §0).
3. **vision #N만** 근거한 구현 → §상세 `#N` 처리 방법 갱신, **§대화창에 C-ID 추가 금지**.
4. **starter·`02` 점검만** 근거한 AI 선행 → `25` + `plans`, C-ID 없음.
5. 완료 시 §상세 **처리 방법** 한 줄을 반드시 적는다.
6. 인간 전용 키·SQL·배포는 `28_human_action_items.md`에만 기록한다.
