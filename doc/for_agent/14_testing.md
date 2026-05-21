# 14 — 테스트

> **관련:** `13_devops.md` · `tests/e2e/` · `28_human_action_items.md` (H-003, H-004)

## 현재

- **Playwright** — `playwright.config.ts`, `tests/e2e/`
- **핵심 E2E:** `core-flows.spec.ts` — 45플로우 + 인증 가드 1건 (교수 #12·#14·#40은 `E2E_PROFESSOR_*`)
- **단위 테스트:** 없음

## 실행

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:smoke
npm run test:e2e:smoke:force-public
npm run test:e2e:smoke:force-full
npm run verify:bundle:json
npm run verify:bundle:save
npm run verify:bundle:save:archive
npm run verify:bundle:save:archive:trim
npm run verify:bundle:save:archive:policy
npm run verify:bundle:save:archive:env
npm run verify:bundle:preflight
npm run verify:bundle:preflight:strict
npm run verify:bundle:preflight:selftest
npm run verify:bundle:pipeline
npm run verify:archived-kim
npm run verify:archived-kim:json
```

`.env`:

```env
E2E_TEST_EMAIL=...
E2E_TEST_PASSWORD=...
```

미설정 시 로그인 기반 시나리오는 skip된다. #12는 `E2E_PROFESSOR_*` 없으면 skip. #9·#10은 번들 v2 후. #11은 회고록 테이블. #12는 **교수** 계정·번들 v2.

`test:e2e:smoke`는 자동 분기 커맨드다.

- 학생 자격증명(`E2E_TEST_*`)이 있으면: #1·#3·#6·#24·#25·#26·#27·#28·#29·#30·#31 + 인증가드
- 학생 자격증명이 없으면: 인증가드만 실행(`public-only`)
- 강제 모드: `test:e2e:smoke:force-public`, `test:e2e:smoke:force-full`
- 실행 계획만 확인: `npm run test:e2e:smoke -- --dry-run --json`
- 통합 JSON 리포트: `npm run verify:bundle:json` (`human:verify:json` + smoke dry-run JSON + `human:sync --json` preview 결합)
- 통합 JSON 저장: `npm run verify:bundle:save` (최신 리포트 저장: `doc/for_agent/verification_report_latest.json`)
- 통합 JSON 저장+아카이브: `npm run verify:bundle:save:archive` (`latest` 갱신 + `doc/for_agent/verification_reports/verification_report_YYYYMMDD-HHMMSS.json` 생성)
- 통합 JSON 저장+아카이브 정리: `npm run verify:bundle:save:archive:trim` (아카이브 최신 5개만 유지)
- 통합 JSON 저장+정책 정리: `npm run verify:bundle:save:archive:policy` (아카이브 최신 5개 + 최근 14일만 유지)
- 통합 JSON 저장+환경정책: `npm run verify:bundle:save:archive:env` (`VERIFY_BUNDLE_KEEP_LATEST`, `VERIFY_BUNDLE_KEEP_DAYS`를 `.env`에서 읽어 정책 적용)
- 통합 JSON preflight: `npm run verify:bundle:preflight` (실행 전 정책/경로/경고만 JSON으로 점검)
- 통합 JSON preflight strict: `npm run verify:bundle:preflight:strict` (경고가 있으면 exit 1)
- 통합 JSON preflight self-test: `npm run verify:bundle:preflight:selftest` (strict pass/fail 경로 회귀 점검)
- 통합 JSON 파이프라인: `npm run verify:bundle:pipeline` (self-test 통과 후 latest+archive 저장 실행)

## 구현된 E2E 시나리오

1. 랜딩 로그인 → `/app/courses`
2. 과목 → 수강생 네트워크
3. 팀 목록 → 팀 상세
4. 마이페이지
5. 로그아웃 → 랜딩
6. 마이페이지 DB 리포트 미리보기 (A4) + 활동 집계 + `report-preview-close`로 overlay 닫기
7. 마이페이지 리포트 1→2→3 + PAGE02 (`mypage-team-card-db`) + PAGE01·03 testid
8. 팀 상세 채팅 메시지 전송
9. 팀 상세 피드백 제출 (`data-testid=team-feedback-submit`)
10. 수업 상세 사이드바 조원평가 제출 (학생·`peer-review-submit-*`)
11. 팀 상세 회고록 저장 (학생·`retrospective-submit`)
12. 교수 팀 제출 현황·프로젝트 평가 (`E2E_PROFESSOR_*`, `professor-team-submissions`)
13. 마이페이지 AI 리포트 생성 (`ai-report-generate-button`, `ai-report-message`)
14. 교수 마이페이지 학생 리포트 비노출 (`mypage-professor-report-block`)
15. 팀 상세 배포 링크 등록 (URL 게시물)
16. 팀 상세 파일 업로드 (`team-deliverable-file-input`)
17. 팀 상세 배포 링크 삭제 (삭제 확인 다이얼로그 포함)
18. 팀 상세 잘못된 링크 입력 검증 (에러 다이얼로그)
19. 팀 상세 링크 프로토콜 자동보정 (`https://` 자동 추가)
20. 팀 상세 소스코드 파일 업로드 (`.ts`)
21. 팀 상세 금지 확장자 업로드 차단 (`.exe`)
22. 팀 상세 업로드 가이드 노출 (`team-deliverable-upload-guide`)
23. 팀 상세 링크 제목 fallback (URL 기반 자동 제목)
24. 팀 상세 트러블슈팅 새로고침 유지 (`team-trouble-*`)
25. 수업 상세 사이드바 조원평가 페이지 이동 (`course-detail-side-peer-review`)
26. 팀 상세 회고록 전용 페이지 이동 (`team-retrospective-page-link`)
27. 수업 상세 나의팀멤버 탭 조회 (`course-detail-side-my-team-members`)
28. 수강생 카드 클릭 상세 프로필 모달 조회 (`student-profile-modal`)
29. 팀 목록에서 내가 속한 팀 강조 UI 노출 (`team-card-my-team-badge`)
30. 수업 상세 네비 중복 제거 확인 (`수업 메뉴` 단일 노출)
31. 마이페이지 PAGE02 실데이터 카드 기준 확인 (`mypage-team-card-db`)
32. 마이페이지 리포트 네비 라벨 (`mypage-report-next` / `prev`)
33. 종료 수업 조원평가·교수 평가 조회 (`course-my-peer-reviews-given`, `course-professor-evals-student`)
34. 마이페이지 학생 프로필 수정 (`mypage-profile-edit-form`)
35. 마이페이지 진입 렌더 회귀 (`mypage-page`, vision #47)
36. 아카이브 평가 페이지 렌더 (`eval-schema-missing-banner` 허용)
37. 마이페이지 과거 수업 전용 페이지 (`mypage-archived-courses-page`, vision #48)
38. 종료 수업 교수 평가 DB 문단 (`course-professor-eval-student`, vision #46)
39. 종료 수업 내 조원평가 DB 카드 (`course-my-peer-review-card`)
40. 교수 아카이브 동료평가 전체 조회 (`course-peer-reviews-overview`, vision #45, `E2E_PROFESSOR_*`)
41. 과거 수업 페이지 → 교수 평가 링크 (`mypage-archived-professor-evals`)
42. 다른 팀 트러블슈팅 작성 폼 비노출 (vision #49, `team-trouble-write-form`)
43. 수강생 프로필 fixed 오버레이 (vision #50)
44. 팀 탈퇴 워크스페이스 전용·참여 숨김 (vision #51)
45. 나의팀멤버 클릭 프로필 모달 (`student-quick-profile-modal`)

**로컬 시드 점검:** `npm run verify:archived-kim` — `ok: true` 이면 #35·#46·H-007~011 준비 완료

헬퍼: `tests/e2e/helpers/auth.ts`

## CI

- `.github/workflows/build.yml` — `npm run build` + (시크릿 있으면) `verify:archived-kim:json`
- `.github/workflows/e2e.yml` — `VITE_*`, `E2E_TEST_*` 시크릿 (H-004)

## 다음

- [ ] 시드/테스트 전용 Supabase project
- [ ] RLS 회귀 테스트 (T-011 후)
- [ ] 대용량 파일 업로드(>50MB) 실환경 회귀 테스트 (기본 업로드 E2E #16 완료)
