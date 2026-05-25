# 반응형 레이아웃 점검 보고 (2026-05-22)

> **기술:** `doc/for_agent/plans/260522-22.md` · C-260522-33  
> **범위:** 코드 기준 감사 (실기기 테스트는 별도 권장)

---

## 한 줄 요약

모바일 **햄버거 메뉴·사이드 스택·그리드 단계**는 대체로 잘 되어 있습니다. **2026-05-22 저녁**에 shell·푸터·일부 페이지 이중 `max-w-*`를 정리했습니다. **교수 평가 모달 `px-16`**은 C-260522-53에서 완화했습니다. 전역 `overflow-x: hidden` 등은 아직 잔여입니다.

---

## 잘 된 부분

| 항목 | 설명 |
|------|------|
| viewport | `index.html` `width=device-width` |
| 상단 네비 | 768px(`md`) 이하 햄버거 · `cc-app-shell`로 본문과 가로 정렬 |
| 수업 레이아웃 | 1024px(`lg`) 이상 사이드 220px + 메인 가로 |
| 그리드 | 팀 목록 1→2→3→5열 · 학생 카드 1→4열 |
| 모달 대부분 | `fixed inset-0 p-4` + `max-h-[90vh]` |
| 마이페이지 탭 | 모바일 `overflow-x-auto` 가로 스크롤 |

---

## 우선 수정 권장

### 1. 교수 프로젝트 평가 모달 (팀 워크스페이스) — **완료 (C-260522-53)**

- **위치:** `TeamDetailPage.tsx`
- **적용:** 본문 `px-4 sm:px-8 lg:px-16` · 제목 `text-xl sm:text-2xl` · 섹션 제목 `text-lg sm:text-xl`

### 2. 페이지 컨테이너 이중 적용 — **부분 완료 (C-260522-36)**

- **완료:** `cc-page-main` · `CoursesPage`/`TeamsPage`/`StudentsNetworkPage` 등 shell 내부 이중 패딩 축소 · `Footer`→`cc-app-shell`
- **잔여:** `MyPage`·`QnAPage`·`OtherStudentProfilePage` 등 일부 `max-w-*` 래퍼
- **권장:** shell 안 페이지는 `cc-page-main`만 사용

### 3. 전역 `overflow-x: hidden` — **완화 (260525-9)**

- **위치:** `src/styles/theme.css` — `html`, `body`
- **적용:** `overflow-x: clip` (가로 넘침 클립, `hidden` 대신)
- **잔여:** 페이지별 `min-w-0` 필요 시 개별 적용

### 4. 수업 사이드 메뉴 `whitespace-nowrap` — **완료 (260525-9)**

- **위치:** `MainLayout.tsx` 「내 팀」버튼
- **적용:** `min-w-0` + 라벨 `truncate`

---

## 참고 (낮은 우선순위)

- ~~푸터 `max-w-6xl` vs 헤더 shell~~ — **완료:** `Footer`도 `cc-app-shell` (C-260522-36)
- 햄버거 버튼 높이 40px — 터치 44px 권장 미달
- Figma 유래 `text-[Npx]` 고정 타이포 다수 — 시스템 글자 크기와 연동 약함

---

## 브레이크포인트 (프로젝트 기준)

| px | Tailwind | 용도 |
|----|----------|------|
| 768 | `md` | 상단 네비 데스크톱/모바일 |
| 1024 | `lg` | 사이드+메인 가로, 마이페이지 사이드 |
| 1280 | `xl` | 팀 5열, 학생 4열 |

---

## 인간 확인 체크리스트

- [ ] iPhone SE(또는 375px) — 수업 상세, 팀 워크스페이스, 마이페이지
- [ ] iPad — 사이드+메인 가로 배치
- [ ] 교수 평가 모달 열어 본문 여백 확인
- [ ] 프로필 이미지 변경 후 헤더·수강자 네트워크 동일 사진 표시

수정 작업을 원하시면 Agent 모드에서 「반응형 P1 적용」이라고 요청해 주세요.
