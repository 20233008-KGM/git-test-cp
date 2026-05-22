# 18 — 프로덕트 디자인 (에이전트 담당)

> **관련:** `12_design_system.md` · `24_multi_agent_roles.md` · `for_human/31_design_improvement_proposal.md`  
> **역할 ID:** `design` (멀티 에이전트 매트릭스)

## 담당 범위

| 영역 | 책임 |
|------|------|
| 디자인 토큰 | `src/styles/campus-connect-tokens.css`, `theme.css` 정렬 |
| 레이아웃 패턴 | `PageHeader`, `SectionCard`, `AppSideNav`, `SideNavItem`, `PageLoading`, `CourseListCard` |
| 가독성·색·타이포 | hex 남발 축소, 계층·대비·여백 8px 그리드 |
| 레퍼런스 조사 | Linear, Notion, Stripe, Atlassian 등 B2B SaaS 패턴 문서화 |
| 인간 제출물 | `for_human/31_design_improvement_proposal.md` |

## 담당하지 않는 것

- Figma 원본 수정 (인간·브랜드 결정)
- `src/imports/` 레거시 Figma 자동 생성 코드 신규 사용
- 비즈니스 로직·API·RLS

## 현대 웹 컬러 시스템 (2026-05-22~)

- **원칙:** 60% 중립 표면 · 30% 보조 텍스트/보더 · 10% 브랜드 블루(`--cc-primary`)만 CTA·활성
- **토큰:** `campus-connect-tokens.css` — slate 중립 + semantic(success/warning/error/info)
- **유틸:** `cc-colors.css` — `.cc-text-*`, `.cc-input`, `.cc-badge-*`, `.cc-alert-*`
- **Shadcn:** `theme.css`가 `--cc-*`와 동기화

## Material Design 3 (2026-05-22~)

- **레퍼런스:** [m3.material.io](https://m3.material.io/) — type scale, tonal surfaces, shape, filled/tonal/outlined buttons
- **구현:** `src/styles/material3.css` · `M3Button` · `m3-nav-item` · Roboto
- **시맨틱 토큰:** primary-container, surface-container-*, outline-variant

## 상용 UI에서 가져온 원칙 (2026-05-22)

1. **타이포 1패밀리·4~6단계** — 제목/부제/본문/캡션만 구분 ([Stripe·Linear·Vercel](https://mantlr.com/blog/stripe-linear-vercel-premium-ui))
2. **색은 의미로** — Primary = 주요 CTA·현재 위치, Neutral = 배경·테두리, Semantic = 성공/경고/오류만
3. **밀도와 여백** — 정보는 촘촘히, 패딩은 16/24px로 통일
4. **Z/F 스캔** — 좌상단에 페이지 제목·핵심 액션, 보조 정보는 아래·오른쪽
5. **카드 1역할** — 한 카드 = 한 주제 (산출물 / 트러블슈팅 / 피드백 분리)
6. **6가지 인터랙션 상태** — default, hover, focus, active, disabled, loading

## CampusConnect 적용 우선순위

| P | 화면 | 개선 |
|---|------|------|
| P0 | 글로벌 | 토큰 CSS, 상단 네비 라이트, 페이지 배경 통일 |
| P0 | 팀 워크스페이스 | PageHeader, 섹션 카드, 배경 `#f0f0f0` 제거 |
| P1 | 수업·팀 목록 | [o] 수업 카드 `CourseListCard` · 팀 목록 잔여 |
| P1 | 마이페이지 리포트 | 인쇄용 제외, 화면 타이포·여백 |
| P2 | 모달·폼 | shadcn Dialog·Input 토큰 정렬 |

## 기술 결정

- **Primary:** `#155dfc` (기존 사용자 인지 유지), 보조 `#3676ff`는 그라데이션 헤더만
- **네비:** 푸터와 동일 다크 `#111827` + `--cc-on-footer` 텍스트 (2026-05-22~)
- **본문 배경:** `slate-100` 계열 `--cc-page`
- **앱 셸:** `.cc-app-shell` — 상단 네비·푸터·수업 사이드+메인 동일 max-width·패딩
- **광학 정렬:** `.cc-app-shell--optical` — 사이드 네비 화면에서 lg+ 미세 우츙 이동
- **첫 화면:** `.cc-main-viewport` — 푸터는 스크롤 후 노출
- **로딩:** `.cc-loading-*` — `PageLoading` 이중 링 스피너 (reduced-motion 대응)

## 다음 작업

- [x] 토큰 CSS · `main.tsx` import (`campus-connect-tokens`, `material3`, `cc-colors`)
- [x] Navigation 다크+M3 · `cc-app-shell` · Noto Sans KR nav 타이포 (C-260522-30~31)
- [x] `UserAvatar` · 프로필 `imageUrl` 전역 연동 (C-260522-32)
- [x] MainLayout · TeamDetailPage PageHeader
- [x] M3 토큰·typography·버튼·칩·사이드 네비 (material3.css)
- [x] 좌측 네비·amber 배너 → `--cc-*` 유틸 통일 (C-260522-35)
- [x] `SideNavItem` 아이콘·계층 · `m3-nav-item--split` (C-260522-38)
- [x] `CourseListCard` · 제목+코드 한 줄 · 코드 pill 클릭 복사 (C-260522-37·42)
- [x] `cc-app-shell--optical` · 마이페이지 프로필 테두리 (C-260522-40~41)
- [x] 마이페이지 `/app/mypage/profile` · `MyPageShell` · 학번·학교 (C-45~46 · vision #30)
- [x] 프로필 폼 여백 · 이메일 hint만 (#56~57 · `260522-47`)
- [x] 수강자들 「내 정보 수정」→ 프로필 페이지 (#58)
- [x] 로그인(`/`) 푸터 없음 (#59)
- [x] `cc-course-code` · 수강자들 UX (C-47~48)
- [x] `PageLoading` · `cc-main-viewport` (C-36)
- [x] 교수 평가 모달 반응형 패딩 (`32` §1 · `260522-46`)
- [ ] 반응형 P1 잔여 — MyPage·QnA 이중 `max-w-*` (`32` §2)
- [ ] `TeamDetailPage`·`StudentsNetwork` 등 hex `#155dfc` 잔여 통일
- [ ] CourseDetail·StudentsNetwork PageHeader 적용
- [ ] 포커스 링 전역 `ring-[var(--cc-primary)]`
- [ ] 인간: 로고·최종 브랜드 색 확정 (`12` §디자인 결정 필요)

## 인수인계

- 프론트와 충돌 시: `08_frontend.md`, 컴포넌트는 `src/app/components/layout/`
- QA: 시각 회귀는 E2E testid 유지 (`team-workspace-title` 등)

## 의존

- 프론트엔드 — 페이지에 패턴 적용
- 인간 — 브랜드·A4 인쇄 스타일 승인
