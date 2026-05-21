# vision.md 추가요청 — 처리 현황 보고 (인간용)

> **원본:** `vision.md` 상단 「추가요청사항」  
> **기술 추적:** `doc/for_agent/27_vision_feature_matrix.md` · `doc/for_human/26_vision_features_status.md`  
> **갱신:** 2026-05-21

AI는 `vision.md`를 수정하지 않습니다. 이 문서는 **처리 여부·방법**을 인간이 한눈에 보기 위한 보고서입니다.

---

## 요약

| 구간 | 완료 | 진행/부분 | 미착수 |
|------|------|-----------|--------|
| #1~#13 | 13 | 0 | 0 |
| #14~#22 | 9 | 0 | 0 |
| #23~#32 | 9 | 0 | 0 |
| #33~#46 | 14 | 0 | 0 |
| #47~#48 | 2 | 0 | 0 |

---

## 상세 (1~48)

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
| 18 | 학생 프로필 모달 | ✅ | #8과 동일 (T-053) |
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

---

## AI 유지 규칙 (에이전트)

1. `vision.md` 변경 시 `27`·본 문서·`26_vision_features_status`를 같은 세션에 갱신한다.
2. 완료 시 **처리 방법** 한 줄을 반드시 적는다.
3. 인간 전용 키·SQL·배포는 `28_human_action_items.md`에만 기록한다.
