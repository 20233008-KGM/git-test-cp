# 27 — vision.md 기능 추적 매트릭스

> **원본:** `vision.md` · **관련:** `02_current_state.md` · `for_human/26_vision_features_status.md`  
> **갱신:** 2026-05-20 vision 기반 점검

## 문제의식 → 플랫폼 (요약)

| vision 문제 | 대응 기능 | 문서 |
|---------------|-----------|------|
| 관계 형성 어려움 | 수강생 네트워크 | §1 |
| 피드백 비효율 | 워크스페이스·트러블슈팅·Q&A | §2 |
| 팀플 휘발성 | 히스토리·아카이브 | §2, §3 |
| 성장 이력 부재 | 마이페이지·AI 리포트 | §3 |

**데이터 열:** `Supabase` = `supabase-api.ts` · `—` = 미연동

---

## 0. vision 상단 추가요청사항 (신규)

| 요청 | 현재 | 추적 ID | 구현 방향 |
|------|------|---------|-----------|
| 워크스페이스 업로드 용량 제한 완화 + 링크 게시물 지원 | ✅ | T-024 | TeamDetail 파일 업로드 500MB + URL 게시물 등록/열기 |
| 교수(김교수)에게 학생용 팀플 리포트 노출 차단 | ✅ | T-025 | `MyPage` role 가드 + 교수 안내 블록 + E2E #14 |
| 수업 생성 코드 자동 생성(해시형) | ✅ | T-026 | `CC-XXXX-XXXX` 자동 생성 + 재생성 버튼 |
| 일정 입력 캘린더 선택 | ✅ | T-027 | `CoursesPage` 일정 입력 `type=\"date\"` 전환 |
| 트러블슈팅 로그 새로고침 시 유실 | ✅ | T-050 | TeamDetail 초기 로드 실패 내성 강화 + 새로고침 유지 E2E |
| 조원평가·회고록 별도 페이지 전환 작성 | ✅ | T-051 | TeamDetail 모달 → 전용 route/page 분리 + 전용 작성 페이지 |
| 수업 상세 사이드바에 나의팀멤버 추가 + 조원평가 이동 | ✅ | T-052 | `CourseDetailPage` 좌측 네비 + 나의팀멤버 조회 + 조원평가 이동 |
| 수강생 카드 클릭 시 상세 프로필 모달 조회 | ✅ | T-053 | StudentsNetwork 카드 클릭 상세 모달 조회 + E2E #28 |
| 팀리스트에서 내가 속한 팀 직관적 표시 | ✅ | T-054 | `TeamsPage` 내 팀 뱃지/강조 스타일 (멤버십 기반) |
| 마이페이지 리포트 팀플 정보가 실제 참여 종료 팀플 기반인지 검증 | ✅ | T-055 | `gatherAiReportContext` 종료 수업(`archived`) 팀플만 집계 + 더미 폴백 제거 |
| CourseDetail 내부 네비 제거 + 메인 레이아웃 네비로 이관 | ✅ | T-056 | `MainLayout` 좌측 네비 확장 + `CourseDetailPage` 내부 네비 제거 |
| human_action_items 완료 체크칸 + AI 체크 기반 검증 규칙 | ✅ | T-058 | `for_human/28_human_action_items.md` 체크 열 + `23/28` 규칙에 `[o]` 검증 절차 추가 |
| 수강자 목록은 항상 해당 수업 멤버만(빈 수업에 데모 목록 금지) | ✅ | T-081 | `StudentsNetworkPage`에서 `courseId`가 있으면 DB 빈 배열을 데모 카드로 바꾸지 않음 |
| 팀 생성하기 버튼 동작 | ✅ | T-084 | `api.teams.create` + TeamsPage 모달 |
| 팀 참여·탈퇴 (수업당 1팀) | ✅ | T-085 | `join` / `leave` + 카드 UI |
| 랜덤 팀 생성 시 기존 팀원 제외 | ✅ | T-086 | `getAssignedStudentIds` + 배정 검증 |
| 팀 생성 후 카드 목록 갱신 | ✅ | T-086 | 저장 후 teams 라우트 이동·reload |
| 학생 랜덤 팀 생성 금지 | ✅ | T-087 | 교수·관리자만 모달·페이지 |
| 팀 카드 데스크탑 5열·가로 확대 | ✅ | T-120 | xl:grid-cols-5, 팀 목록 max 1920px |
| 교수 공지 작성·팀 페이지 최신 3건 | ✅ | T-089 | `CourseAnnouncementsPage` + `getAll(..., 3)` |
| 다른 팀 워크스페이스 트러블슈팅 작성 금지 | ✅ | T-170 | `assertStudentOwnTeamWrite` + `TeamDetailPage` `isMyTeamMember` 게이트 + E2E #42 |
| 수강생 프로필 클릭 시 화면 중앙 모달 (#50, #8·#18과 별도) | ✅ | T-171 | `StudentProfileModal` `fixed inset-0 z-50` (인라인 하단 배치 제거) + E2E #43 |
| 팀 상세·마이페이지 모달 뷰포트 고정 (#18·#25·#38) | ✅ | T-172 | `TeamDetailPage`·`MyPage` `my-6` 인라인 → `fixed inset-0` |
| 팀 탈퇴 버튼은 워크스페이스 내부만 (#51) | ✅ | T-173·T-174 | 하단 소형 탈퇴·팀 있으면 참여 버튼 숨김 |

---

## 완성도 점검 (vision 기준)

| 관점 | 점수(체감) | 메모 |
|------|------------|------|
| 기존 vision 3축 | ~75% | 핵심 흐름은 동작, RLS/배포는 인간 블로커 |
| 신규 추가요청 13건 | 100% | 1~13 완료(14 비어 있음) |
| 전체 vision 기준 | ~70% | 인간 블로커(RLS·배포·키) 제외 기능 요청 완료 |

---

## 1. 수강생 네트워크

| vision 기능 | 페이지/코드 | UI | 데이터 | 비고 |
|-------------|-------------|-----|--------|------|
| 전체 수강생 프로필 조회 | `StudentsNetworkPage` | ✅ | Supabase | |
| 기술 스택 태그 | 프로필·네트워크 | ✅ | Supabase | `saveProfile` |
| 상세 프로필 | `OtherStudentProfilePage` | ✅ | Supabase | |
| 1:1 채팅 | TeamDetail 모달 | ✅ | Supabase CRUD + Realtime | 팀 스코프; RLS T-011 |
| 내 정보 수정·저장 | 네트워크 모달 | ✅ | Supabase | |

**달성도:** UI ~80% · 읽기 ~55% · 쓰기 ~45%

---

## 2. 팀플 워크스페이스

| vision 기능 | 페이지/코드 | UI | 데이터 | 비고 |
|-------------|-------------|-----|--------|------|
| 중간 작업 결과 업로드 | TeamDetail | ✅ | Storage | `ai_team_deliverables` |
| 같은 수업 열람 | course scope | ✅ | Supabase | RLS 검증 필요 |
| 작업 히스토리 | Teams | ✅ | Supabase | `ai_team_activities` |
| 트러블슈팅 CRUD | TeamDetail | ✅ | CRUD | |
| Q&A CRUD | QnA pages | ✅ | CRUD | `answers` jsonb |
| 종료 수업 | `CoursesPage` filter | ✅ | archived | 읽기 전용 배너 |
| 팀 피드백 제출 | TeamDetail | ✅ | Supabase | `ai_team_detail_feedbacks` (H-007) |
| 동료평가 제출 | TeamPeerReviewPage | ✅ | Supabase | `ai_team_detail_peer_reviews` (H-008) |
| 회고록 작성 | TeamRetrospectivePage | ✅ | Supabase | `ai_team_detail_retrospectives` (H-009) |
| 교수 작업물·평가 | TeamDetail (교수) | ✅ | Supabase | 산출물·제출 현황·평가 DB (H-010) |

**달성도:** UI ~70% · 읽기 ~55% · 쓰기 ~50%

---

## 3. 마이페이지

| vision 기능 | 페이지/코드 | UI | 데이터 | AI |
|-------------|-------------|-----|--------|-----|
| 종료·진행 프로젝트 표시 | `MyPage` | ✅ | Supabase | 팀 집계·시드 |
| 리포트 3페이지 | `MyPage` | ✅ | `gatherContext` | DB |
| A4 인쇄 | `AiReportPrintView` | ✅ | draft | LLM ❌ |
| AI 문단 생성 | MyPage 버튼 | 🔶 | Edge draft 200 / LLM | deploy·H-002 |
| 교수 평가 → 리포트 | `gatherContext` | ✅ | 번들 v2 | 스니펫·건수 |
| 집계 새로고침 | MyPage 버튼 | ✅ | `resolveReportContext` | 캐시·강제 refresh |
| 마이페이지 진입 (vision #47) | `MyPage` | ✅ | TDZ 버그 수정 (T-123) | E2E #35 |
| 과거 수업 전용 페이지 (vision #48) | `MyPageArchivedCoursesPage` | ✅ | 사이드 버튼만 · `/mypage/archived-courses` | E2E #37 |

**달성도:** UI ~80% · 읽기 ~65% · AI ~65% (DB·Edge 초안, LLM deploy 대기)

---

## 철학 4가지 — 구현 체크

| 철학 | 구현 방향 | 현재 |
|------|-----------|------|
| 과정 > 결과 | 트러블슈팅 | CRUD ✅ |
| 협업 기억 | DB 영구 저장 | ✅, RLS 강화 중 |
| 사람 중심 | 네트워크 | ✅ |
| 성장 데이터 | 리포트 | DB ✅, LLM 🔶 |

---

## 갱신 규칙

기능 완료 시: 표 갱신 → `02` · `05` · `for_human/26_vision_features_status.md`
