# 08 — 프론트엔드

> **관련:** `19_folder_structure.md` · `12_design_system.md` · `src/app/routes.tsx` · `11_api_spec.md`

## 스택

React 18.3 · TypeScript · Vite 6 · React Router 7 · Tailwind 4 · Radix/Shadcn

## 진입점

- `src/main.tsx` → `App.tsx` → `RouterProvider(router)`
- `/app` → `ProtectedRoute` → `MainLayout` → `<Outlet />`

## 페이지 맵

| 경로 | 컴포넌트 | 데이터 |
|------|-----------|--------|
| `/` | LandingPage | 로그인 · **푸터 없음** (#59) |
| `/signin` | SignInPage | Firebase |
| `/app/courses` | CoursesPage | Supabase, active/archived |
| `/app/courses/:id` | CourseDetailPage | Supabase |
| `/app/courses/:courseId/students` | StudentsNetworkPage | Supabase |
| `/app/courses/:courseId/teams` | TeamsPage | Supabase |
| `/app/courses/:courseId/teams/:teamId` | TeamDetailPage | Supabase CRUD |
| `/app/mypage` | MyPage | 리포트 3페이지 · A4 · `?tab=profile` → `/mypage/profile` 리다이렉트 |
| `/app/mypage/profile` | MyPageProfilePage | `MyPageShell` · 학생 프로필 편집·`saveStudentProfile` |
| `/app/qna` | QnAPage | Supabase |
| `/app/qna/:questionId` | QnADetailPage | 답변 CRUD |
| `/app/teams`, `/app/students` | `CourseScopedRedirect` | |

## 주요 컴포넌트

- `Navigation.tsx` — `cc-app-shell` · 모바일 `md:hidden` 메뉴 · `data-testid="logout-button"`
- `Footer.tsx` — `cc-app-shell` (헤더와 동일 가로폭)
- `UserAvatar.tsx` — `imageUrl` / 이니셜 (네비·팀·프로필 모달)
- `layouts/MainLayout.tsx` — `CourseSideNavigation` · `MyTeamSideNavGroup` (교수 「나의 팀 멤버」 숨김)
- `components/mypage/MyPageShell.tsx` · `MyPageSideNav.tsx` · `ProfileFieldLabel.tsx`
- `layouts/appShell.ts` — `getAppShellClassName` · `hasSideNavLayout` · `cc-app-shell--optical`
- `layout/PageHeader.tsx`, `SectionCard.tsx`, `AppSideNav.tsx`, `SideNavItem.tsx`, `PageLoading.tsx`
- `courses/CourseListCard.tsx` — 수업 목록 카드
- `AiReportPrintView.tsx` — A4 인쇄
- `ProtectedRoute.tsx` — 인증 로딩 시 `PageLoading` fullscreen

## 프로필 이미지

- DB: `ai_users.image` (data URL)
- 타입: `BaseProfile.imageUrl`
- 저장: `api.myPage.updateAvatar` → `AuthContext.refreshProfile()`
- 표시: `UserAvatar`, `mapAiUserToNetworkStudent`, 팀 멤버 `imageUrl`

## 상태 관리

- **전역:** `AuthContext`
- **로컬:** `useState` / `useEffect`
- **데이터:** `api` → Supabase

## 완료됨

- [o] ProtectedRoute, course-scoped URL
- [o] 종료 수업 UI·읽기 전용 배너
- [o] MyPage DB 리포트·인쇄
- [o] `/app/mypage/profile` · `MyPageShell` · `ai_users.school` (vision #30·#56~58)
- [o] MyPage 리포트 ↔ 내 정보 분리 · `?tab=profile` 리다이렉트 (C-45~46)
- [o] `cc-input`·`cc-textarea` 패딩 · `ProfileFieldLabel` 여백 (#56)
- [o] `LandingPage` 푸터 제거 (#59) · 로그인/회원가입 장식 카드 제거 (C-50)
- [o] `StudentsNetworkPage` 「내 정보 수정」→ `/mypage/profile` (#58)
- [o] `cc-app-shell` · `cc-course-code` · 수강자들 UX (C-47~48)

## 다음

- [ ] React Query 검토
- [ ] 채팅 Realtime UI
