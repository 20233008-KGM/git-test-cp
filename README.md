# CampusConnect

대학 팀 프로젝트의 **협업 과정**과 **성장 이력**을 남기는 올인원 웹 플랫폼입니다.

> **개발 상태 (2026-06-09):** Beta · 진행률 ~88%  
> **프로덕션:** https://git-test-cp.vercel.app

## 핵심 기능

CampusConnect는 세 가지 축으로 구성됩니다.

| 축 | 설명 | 주요 화면 |
|----|------|-----------|
| **수강생 네트워크** | 같은 수업 학생·교수 프로필 탐색, 기술 태그, 1:1 DM | `/app/courses/:id/students` |
| **팀플 워크스페이스** | 팀 진행·산출물·트러블슈팅·Q&A·채팅·동료평가·회고 | `/app/courses/:id/teams/:teamId` |
| **마이페이지** | 종료 팀플 집계, A4 리포트, Gemini AI 자동 채움 | `/app/mypage` |

### 기타 주요 기능

- 수업 생성·보관·수업 코드 (`CC-XXXX-XXXX`) · 강의 카탈로그 검색·자율 입장
- 공지 게시판 · 강의자료 · 수업 스테이지 · 강의계획서 검색
- 교수 팀 평가·제출 현황 · 종료 수업 아카이브 조회
- 파일·링크·폴더 산출물 (최대 500MB) · Supabase Realtime 채팅

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 18 · TypeScript · Vite 6 · Tailwind CSS 4 · React Router 7 |
| UI | Radix UI · Lucide · MUI (일부) |
| Auth | Firebase Authentication |
| Backend | Supabase (PostgreSQL · PostgREST · Storage · Realtime) |
| AI | Supabase Edge Functions + Google Gemini (`generate-report`, `recommend-troubleshooting`, `extract-syllabus`) |
| Test | Playwright E2E · GitHub Actions CI |
| Deploy | Vercel (SPA) |

## 시작하기

### 요구 사항

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+

### 설치 및 실행

```bash
pnpm install
pnpm dev
```

브라우저: http://localhost:5173

### 환경 변수

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 설정합니다. (값은 Firebase·Supabase 콘솔에서 확인)

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# E2E (선택 — 로컬 Playwright)
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

상세: [`doc/for_human/34_github_ci_secrets.md`](doc/for_human/34_github_ci_secrets.md)

## 프로젝트 구조

```
git-test/
├── src/app/
│   ├── api/              # supabase-api.ts, ai-report.ts
│   ├── components/       # Navigation, UI, 모달
│   ├── contexts/         # AuthContext
│   ├── layouts/          # MainLayout, appShell
│   ├── pages/            # 35+ 페이지 컴포넌트
│   ├── routes.tsx        # 라우팅
│   └── types/            # TypeScript 타입
├── supabase/
│   ├── migrations/       # DB 스키마·RLS
│   ├── functions/        # Edge Functions (AI)
│   └── seed/             # 테스트·아카이브 시드
├── tests/e2e/            # Playwright 테스트
├── scripts/              # 검증·시드·import 유틸
└── doc/
    ├── for_human/        # 사람용 문서 (00~38)
    └── for_agent/        # AI·개발자용 문서
```

## 주요 라우트

| 경로 | 설명 |
|------|------|
| `/` | 랜딩·로그인 |
| `/signin` | 회원가입 |
| `/app/courses` | 수업 목록 (현재/종료) |
| `/app/courses/:id` | 수업 상세 |
| `/app/courses/:id/students` | 수강자 네트워크 |
| `/app/courses/:id/teams` | 팀 목록 |
| `/app/courses/:id/teams/:teamId` | 팀 워크스페이스 |
| `/app/courses/:id/announcements` | 공지 게시판 |
| `/app/courses/:id/messages` | 1:1 DM |
| `/app/mypage` | 마이페이지 (리포트) |
| `/app/mypage/profile` | 내 정보 수정 |
| `/app/mypage/archived-courses` | 과거 수업 |
| `/app/syllabi` | 강의계획서 검색 |
| `/app/profile/professor` | 교수 프로필 |

## 자주 쓰는 스크립트

```bash
pnpm dev                    # 개발 서버
pnpm build                  # 프로덕션 빌드
pnpm test:e2e               # Playwright 전체
pnpm test:e2e:smoke         # 핵심 회귀 (자격증명 자동 분기)
pnpm prelaunch:check        # 런칭 전 점검
pnpm verify:archived-kim    # 종료 수업 시드 검증
pnpm import:catalog         # 강의 카탈로그 import
```

## 문서

| 목적 | 문서 |
|------|------|
| 처음 읽기 | [`doc/for_human/00_start_here.md`](doc/for_human/00_start_here.md) |
| **프로젝트 현황** | [`doc/for_human/01_project_status.md`](doc/for_human/01_project_status.md) |
| 서비스 소개 | [`doc/for_human/04_project_intro.md`](doc/for_human/04_project_intro.md) |
| AI 기능 설명 | [`doc/for_human/11_ai_system_explained.md`](doc/for_human/11_ai_system_explained.md) |
| 인간 할 일 | [`doc/for_human/28_human_action_items.md`](doc/for_human/28_human_action_items.md) |
| 런칭 체크 | [`doc/for_human/36_launch_one_pager.md`](doc/for_human/36_launch_one_pager.md) |
| 개발자 상세 | [`doc/for_agent/02_current_state.md`](doc/for_agent/02_current_state.md) |

AI 세션 시작 시: `doc/starter.txt` 읽기

## 현재 상태 요약

**완료:** Firebase 인증 · Supabase CRUD 대부분 · Gemini AI 리포트 · 프로덕션 배포 · E2E 48 코어 플로우

**남은 일:** RLS 강화 승인 (H-001) · GitHub CI 시크릿 (H-004) · 이용약관 확인 (H-006)

## 라이선스

교육 목적으로 제작된 프로젝트입니다.
