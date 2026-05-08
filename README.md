# CampusConnect

웹개발 수업 협업을 위한 올인원 플랫폼

## 🎯 프로젝트 개요

CampusConnect는 학생들이 팀 프로젝트를 효율적으로 진행할 수 있도록 돕는 협업 플랫폼입니다.

### 주요 기능

- 📚 **수강 과목 관리** - 수강 중인 과목 확인 및 상세 정보
- 👥 **수강자 네트워크** - 팀원 찾기 및 프로필 확인
- 🎲 **랜덤 팀 생성** - 공정한 팀 구성을 위한 자동 팀 매칭
- 🚀 **팀 프로젝트** - 진행상황 관리 및 공유
- 💬 **Q&A 게시판** - 질문하고 답변 공유
- 📊 **대시보드** - 한눈에 보는 학습 현황

## 🛠 기술 스택

- **Frontend**: React 18.3.1 + TypeScript
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite 6
- **UI Components**: Radix UI, Shadcn UI
- **Icons**: Lucide React
- **State Management**: React Hooks (향후 확장 가능)

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── App.tsx                 # 메인 앱 (RouterProvider)
│   ├── routes.tsx              # 라우팅 설정
│   │
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── Navigation.tsx      # 네비게이션 바
│   │   ├── ui/                 # UI 컴포넌트 라이브러리
│   │   └── figma/              # Figma 관련 컴포넌트
│   │
│   ├── layouts/                # 레이아웃 컴포넌트
│   │   └── MainLayout.tsx      # 메인 레이아웃
│   │
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── LandingPage.tsx
│   │   ├── CoursesPage.tsx
│   │   ├── CourseDetailPage.tsx
│   │   ├── StudentProfilePage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── QnAPage.tsx
│   │   └── ...
│   │
│   ├── types/                  # TypeScript 타입 정의
│   │   └── index.ts
│   │
│   ├── hooks/                  # 커스텀 Hooks
│   │   └── useAuth.ts
│   │
│   └── api/                    # API 및 데이터
│       └── mock-data.ts        # Mock 데이터
│
├── imports/                    # Figma 가져온 컴포넌트
└── styles/                     # 전역 스타일
```

## 🚀 시작하기

### 설치

프로젝트는 이미 설정되어 있으며, Vite 개발 서버가 실행 중입니다.

### 개발 모드

개발 서버는 자동으로 실행됩니다. 코드 변경 시 자동으로 새로고침됩니다.

## 📱 주요 페이지

### 1. 랜딩 페이지 (`/`)
- 로그인 폼
- 서비스 소개
- Footer

### 2. 수강 과목 (`/app/courses`)
- 수강 중인 과목 목록
- 과목 카드 (이름, 교수, 시간, 인원)

### 3. 과목 상세 (`/app/courses/:id`)
- 과목 정보
- 수강생 목록
- 팀 목록

### 4. 프로필 (`/app/profile`)
- 내 프로필 정보
- 기술 스택
- 자기소개

### 5. 팀 목록 (`/app/teams`) ⭐ 신규
- 1조~5조 팀 카드 그리드 (5열)
- 팀별 배지, 팀원, 진행률 표시
- 팀 상세 모달 (프로젝트 제목, 입장하기, 체크리스트, 통계)
- 통계 모달 (주차별 커밋/파일/라인 수)
- 주목받는 프로젝트 모달
- 공지사항 섹션

### 6. 팀 상세 (`/app/teams/:id`) ⭐ 신규
- 파일 트리 및 코드 실행
- 프로젝트 미리보기
- 주차별 진행률 차트
- 팀원 목록 및 기여도
- 채팅 모달 (팀원/교수님 채팅방)
- 평가 모달 (개별 팀원 평가)

### 7. 프로젝트 (`/app/projects`)
- 진행 중인 프로젝트 목록
- 프로젝트 상태 (계획 중, 진행 중, 검토 중, 완료)

### 8. Q&A (`/app/qna`)
- 질문 목록
- 검색 기능
- 태그 필터

### 9. 랜덤 팀 생성 (`/app/teams/random`)
- 팀 크기 설정
- 랜덤 팀 생성
- 생성된 팀 목록

## 🔧 확장 가이드

### 새로운 페이지 추가

1. **페이지 컴포넌트 생성**
```tsx
// src/app/pages/NewPage.tsx
export default function NewPage() {
  return <div>새 페이지 내용</div>;
}
```

2. **라우트 등록**
```tsx
// src/app/routes.tsx
import NewPage from "./pages/NewPage";

// children 배열에 추가
{
  path: "new-page",
  Component: NewPage,
}
```

3. **네비게이션 추가 (선택)**
```tsx
// src/app/components/Navigation.tsx
const navItems: NavItem[] = [
  // ...
  { label: "새 페이지", path: "/app/new-page" },
];
```

### 새로운 API 엔드포인트 추가

```tsx
// src/app/api/mock-data.ts
export const api = {
  // 기존 API...
  newResource: {
    getAll: () => Promise.resolve([...]),
    getById: (id: string) => Promise.resolve(...),
  },
};
```

### 타입 정의 추가

```tsx
// src/app/types/index.ts
export interface NewType {
  id: string;
  // ...
}
```

## 🎨 스타일링 가이드

- **Tailwind CSS** 우선 사용
- 반응형 디자인 (모바일 퍼스트)
- 일관된 색상 체계:
  - Primary: Blue (#155DFC)
  - Background: Gray-50
  - Text: Gray-900

## 📝 코딩 규칙

1. **컴포넌트**: 함수형 컴포넌트 + TypeScript
2. **파일명**: PascalCase for components, camelCase for utilities
3. **Props**: interface로 정의
4. **State**: useState, useEffect 활용
5. **타입**: types/index.ts에 중앙 관리

## 🔐 인증

현재는 Mock 인증을 사용합니다. `useAuth` 훅을 통해 관리됩니다.

실제 API 연동 시:
1. `src/app/hooks/useAuth.ts` 수정
2. API 엔드포인트 연결
3. 토큰 관리 구현

## 🌐 향후 계획

### 기능 추가
- [ ] 실시간 채팅
- [ ] 알림 시스템
- [ ] 파일 업로드
- [ ] 캘린더 통합
- [ ] 성적 관리

### 기술 개선
- [ ] 실제 백엔드 API 연동
- [ ] 상태 관리 라이브러리 (Zustand/Redux)
- [ ] React Query for data fetching
- [ ] 테스트 추가 (Jest, React Testing Library)
- [ ] CI/CD 파이프라인

## 📄 라이선스

본 서비스는 교육 목적으로 제작된 프로젝트입니다.

## 👥 기여자

- 개발: [팀명/개발자명]
- 디자인: Figma

---

**CampusConnect** - 학생들의 협업을 더 쉽게 🚀
