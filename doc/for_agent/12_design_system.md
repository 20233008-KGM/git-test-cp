# 12 — 디자인 시스템

> **관련:** `08_frontend.md` · **`18_product_design.md`** · `default_shadcn_theme.css` · `src/styles/`  
> **인간 제출:** `for_human/31_design_improvement_proposal.md`

## 기반

- **Material Design 3** — `material3.css`, `M3Button`, 시맨틱 토큰 (`18_product_design.md`)
- **Shadcn UI** + **Radix** primitives (`src/app/components/ui/`)
- **Tailwind CSS 4**
- **Figma** — 초기 화면 import (`src/imports/`, 점진 제거)

## 색상 (토큰 — `campus-connect-tokens.css`)

| CSS 변수 | 값 | 용도 |
|----------|-----|------|
| `--cc-primary` | `#155dfc` | CTA, active nav |
| `--cc-page` | `#f1f5f9` | MainLayout 본문 배경 |
| `--cc-surface` | `#ffffff` | 카드·네비 |
| `--cc-text` / `--cc-text-secondary` | slate 계열 | 제목·본문 |
| `--cc-footer` | `#111827` | 상단 네비·푸터 배경 |
| `--cc-on-footer` | `#f8fafc` | 네비 텍스트 |

상단 네비: 다크(`--cc-footer`) + Noto Sans KR (`--cc-nav-font`, `--cc-nav-title-size` 21px).

## 타이포·간격

- Tailwind 유틸리티 우선
- 카드: `rounded-xl`, `shadow-2xl` (모달)
- 진행률 바: `h-2` / `h-3`

## 컴포넌트

- `Button`, `Card`, `Dialog`, `Avatar`, `Badge`, `Progress` 등 — ui 폴더
- 페이지별 커스텀: Teams 카드 그라데이션 헤더 등

## 앱 셸 (가로 정렬)

| 클래스 | 용도 |
|--------|------|
| `.cc-app-shell` | `max-width: 80rem` + `px-4` / `sm:px-6` / `lg:px-8` |
| `.cc-app-shell--wide` | 팀 목록 URL — `min(100%, 1920px)` |
| `.cc-app-shell--optical` | 사이드 네비 레이아웃 — lg+에서 shell ~10px 우츙 (광학적 중앙) |
| `.cc-main-viewport` | `main` 최소 높이 = 뷰포트−네비 (첫 화면 푸터는 스크롤 후) |
| `.cc-page-main` | shell 안 본문 열 (이중 max-width 없음) |
| `hasSideNavLayout()` / `getAppShellClassName()` | `appShell.ts` — 수업·마이페이지 등에서 `--optical` 자동 |

## 공통 컴포넌트

- `UserAvatar` — `imageUrl` 있으면 사진, 없으면 이니셜 (`src/app/components/UserAvatar.tsx`)
- `PageHeader`, `SectionCard` — `src/app/components/layout/`
- `PageLoading`, `LoadingSpinner` — 이중 링 스피너 · `layout`/`fullscreen`/`inline` (`PageLoading.tsx`)
- `SideNavItem` — 좌측 메뉴 아이콘+라벨 (`SideNavItem.tsx`)
- `CourseListCard` — 수업 목록 카드 (`courses/CourseListCard.tsx`)

## 반응형

| breakpoint | 용도 |
|------------|------|
| `md` (768px) | 상단 네비 햄버거 ↔ 가로 메뉴 |
| `lg` (1024px) | 수업 사이드 220px + 메인 가로 |
| `xl` (1280px) | 팀 5열 · 학생 4열 |

감사·미해결: `for_human/32_responsive_layout_audit.md` (평가 모달 `px-16` 등 — shell·푸터 정렬은 2026-05-22 완료).

## 디자인 결정 필요 (인간)

- 최종 브랜드 컬러·로고
- 다크모드 여부 (`next-themes` 의존성 존재)
- A4 리포트 인쇄 스타일

## 사이드 네비 (좌측)

| 클래스 | 용도 |
|--------|------|
| `.cc-side-nav__heading` | 「수업 메뉴」 섹션 제목 (대문자·구분선) |
| `.m3-nav-item` | flex: `__icon` 박스 + `__label` |
| `.m3-nav-item--active` | primary-container + **왼쪽 3px 강조선** |
| `.m3-nav-item--sub` | 내 팀 하위 메뉴 (작은 라벨·불릿) |
| `.m3-nav-item--split` | 「내 팀」+ ▼ 토글 한 줄 (display:flex 고정) |
| `.m3-nav-item--attention` | `--cc-warning-*` (팀 미배정 등) |

컴포넌트: `AppSideNav` + `SideNavItem` (`MainLayout`, `MyPageShell` — 「리포트」「내 정보」→ `/app/mypage/profile`).  
`ProfileFieldLabel` · `cc-input`/`cc-textarea` 패딩 (#56).  
**금지:** Tailwind `amber-*`, `indigo-*` 등 임의 팔레트.

## 수업 목록 카드

| 클래스 | 용도 |
|--------|------|
| `.cc-course-card` | 상단 컬러 바 · 헤더/메타 구분선 |
| `.cc-course-card__title-row` | **수업명 + 코드 한 줄** (제목 말줄임) |
| `.cc-course-card__code` | 클릭 가능 pill — Copy 아이콘 · 클립보드 복사 · `cc-course-code` 타이포 |
| `.cc-course-code` | 수업코드 공통 — sans 400 · `letter-spacing: 0.1em` · `cc-course-code--badge` (상세) |
| `.cc-input--readonly` | 마이페이지 등 읽기 전용 필드 (회색 surface, 포커스 링 없음) |
| `.cc-textarea` | 자기소개 등 다줄 입력 (`cc-input`와 동일 포커스) |
| `.cc-course-card__meta` | 라벨(대문자+아이콘) / 값 2열 grid |

## 규칙

- 새 UI는 Shadcn 패턴 + `--cc-*` 토큰
- 인라인 hex 지양 → `var(--cc-primary)` 등
- 60-30-10: 중립 표면 · 브랜드 블루(활성·CTA) · 시맨틱(success/warning/error)만 보조색
