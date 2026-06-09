# 02 — 현재 상태 (항상 최신 유지)

> **관련:** `05_todo.md` · `17_handoff.md` · `27_vision_feature_matrix.md` · `28_human_action_items.md`  
> **마지막 갱신:** 2026-06-09 · **단계:** Beta · **전체 진행률:** ~88%

## 스냅샷

| 영역 | % | 상태 |
|------|---|------|
| 프론트엔드 UI | 97 | vision #60~#163 · 공지·DM·강의계획서·카탈로그·교수 그리드 |
| 데이터 연동 (읽기) | 72 | `supabase-api.ts` → Supabase `ai_*` · 카탈로그·강의계획서·스테이지 |
| 데이터 연동 (쓰기) | 68 | Q&A·채팅·피드백·회고·산출물·공지·DM·교수 프로필 |
| 인증 | 58 | Firebase + `ai_users` + JWT 스캐폴드(기본 off) + ProtectedRoute |
| DB / RLS | 45 | 리뷰 패키지·Beta 초안 SQL (T-011, 미적용) |
| DevOps | 45 | CI build + archived verify + `prelaunch:check` + E2E (H-005 완료) |
| AI 리포트 | 82 | DB 집계 + Gemini Edge; 폴더 산출물·팀 AI 메모리·트러블슈팅 추천 |
| E2E 테스트 | 85 | Playwright **48** 코어 + peer-network + user-journeys |

## vision 기반 이해도 점검 (2026-06-09)

| 항목 | 점검 결과 | 근거 |
|------|-----------|------|
| 핵심 3축(네트워크·워크스페이스·마이페이지) | 구현 이해도 높음 | 각 축의 핵심 화면·API·DB 흐름 연결 확인 |
| #143~#163 (5/26 이후) | 구현 | Realtime 6테이블·DM·공지·스테이지·카탈로그·시작/종료일 |
| 교수 `student_growth_approach` | 구현 (마이그레이션 대기) | `ProfessorProfilePage`·`StudentsNetworkPage`·`MyPage` · `20260609000000` |
| 교수 `teaching_style` | 구현 | `20260603000000` · 프로필·수강자들 모달 |
| 강의 카탈로그 | 구현 | `ai_course_catalog` · `CoursesPage` 검색 · E2E #48 |
| 강의계획서 검색 | 구현 | `SyllabusSearchPage` · `ai_course_syllabi` · `extract-syllabus` Edge |
| 폴더 산출물 + Gemini | 구현 | vision #155~#156 · 로딩 오버레이·% 진행 |
| 1:1 DM·공지·강의자료 | 구현 | H-012 MCP 적용 (2026-05-25) |

## 구현 완료 (기능)

- [o] 랜딩·로그인 UI (`/`, `/signin`)
- [o] 과목 목록 **현재/종료** 필터, 생성·보관 (교수) · 카탈로그 검색·자율 입장
- [o] 과목·팀·Q&A·네트워크·팀 상세 — Supabase 읽기·쓰기 (대부분)
- [o] `AuthContext` + Firebase + `ai_users` (`firebase_uid`)
- [o] Protected routes, course-scoped URL, 레거시 리다이렉트
- [o] 멤버십·수업 코드·랜덤 팀 (T-012)
- [o] Q&A·트러블슈팅·네트워크 프로필·팀 산출물 Storage (T-020~023)
- [o] 팀 상세 채팅 DB 저장 + Supabase Realtime (`sendChatMessage`, TeamDetailPage)
- [o] 팀 상세 피드백·동료평가·회고록 DB 저장 (H-007~H-009)
- [o] 교수 팀 평가 DB·제출 현황 조회·AI 진행 요약 (H-010)
- [o] AI 리포트 DB 집계·A4·마이페이지 자동 Gemini 채움 (T-030/031, H-002)
- [o] Playwright E2E + GitHub Actions (T-040, T-041)
- [o] 종료 수업 시드 (김학생) — `npm run verify:archived-kim`
- [o] vision #47·#48 — 마이페이지 TDZ 수정 · 과거 수업 전용 페이지
- [o] 공지 게시판·1:1 DM·강의자료 (H-012)
- [o] 수업 스테이지 per-course (`ai_course_stages`) · 시작/종료일
- [o] 강의계획서 검색 (`/app/syllabi`) · 강의 카탈로그 (`ai_course_catalog`)
- [o] 교수 프로필 teaching_style · student_growth_approach
- [o] `supabase-api.ts` facade (TD-001)

## 미완료 / 진행 중

- [ ] RLS 정책 검증·강화·원격 적용 (T-011, H-001)
- [o] Edge `generate-report` Gemini + `verify_jwt=false` (H-002 완료)
- [o] 프로덕션 배포 (T-042, H-005) — https://git-test-cp.vercel.app
- [ ] E2E 전체 green in CI (H-004 시크릿)
- [ ] `20260609000000_ai_users_student_growth_approach` 원격 MCP 적용

## 최근 검증 (2026-06-09)

- **교수 성장 방식:** `ai_users.student_growth_approach` 마이그레이션·타입·API·교수 프로필 편집·수강자들·마이페이지 표시
- **강의 카탈로그:** `ai_course_catalog` 테이블 · 수업 페이지 검색·입장 · `import:catalog`·`create:courses-xlsx` 스크립트
- **강의계획서:** `SyllabusSearchPage` · `ai_course_syllabi` · `seed:syllabus`
- **팀 채팅:** `sort_order` bigint 마이그레이션 (`20260609100000`)
- **doc·README:** 프로젝트 현황·루트 README 최신화

## 최근 검증 (2026-05-26, vision #143~#163)

- **#143:** Realtime publication 6테이블 · debounced reload hook
- **#154:** 1:1 DM peer 검증 확장 (교수·멤버십 전 역할)
- **#155~#156:** 폴더 산출물 Gemini 로딩·STORE 무압축
- **#157~#159:** 산출물 배너 URL · 프로필 인박스 점멸·미확인 공지/DM
- **#160:** 수업 `start_date`·`end_date`
- **#161~#163:** 수업 생성 UX · per-course 스테이지 · 교수 카드 그리드

## 최근 검증 (2026-05-25, H-012)

- **강의자료·산출물·DM SQL** — MCP `course_materials`·`direct_messages`·Storage 500MB

## 최근 검증 (2026-05-22, vision #56~59)

- **#56~#59:** 프로필 여백 · 이메일 안내 제거 · `/mypage/profile` · 로그인 푸터 제거
- **배포:** https://git-test-cp.vercel.app (H-005)
- **E2E:** `core-flows.spec.ts` 48 `test()` · smoke 자동 분기

## 알려진 블로커

1. **RLS:** enabled, 정책 강화 미적용 (T-011 / H-001)
2. **Figma imports:** `src/imports/` 레거시 유지
3. **인간:** `28_human_action_items.md` H-001·H-004·H-006

## 다음 즉시 액션

→ 인간 블로커: T-011(H-001) RLS · H-004(CI E2E 시크릿)  
→ MCP: `20260609000000_ai_users_student_growth_approach` 원격 적용  
→ E2E 회귀: 교수 성장 방식 저장·표시 플로우  
→ 반응형 P1 잔여 — `MyPage`·`QnAPage` 이중 `max-w-*` (`32` §2)
