# 02 — 현재 상태 (항상 최신 유지)

> **관련:** `05_todo.md` · `17_handoff.md` · `27_vision_feature_matrix.md` · `28_human_action_items.md`  
> **마지막 갱신:** 2026-05-20 · **단계:** Alpha → Beta 진입 중 · **전체 진행률:** ~70%

## 스냅샷

| 영역 | % | 상태 |
|------|---|------|
| 프론트엔드 UI | 83 | 마이페이지 리포트·권한 분리·수업 생성 UX·링크 게시물 |
| 데이터 연동 (읽기) | 60 | `supabase-api.ts` → Supabase `ai_*` |
| 데이터 연동 (쓰기) | 54 | Q&A·트러블슈팅·채팅·피드백·회고록·네트워크·산출물 |
| 인증 | 58 | Firebase + `ai_users` + JWT 스캐폴드(기본 off) + ProtectedRoute |
| DB / RLS | 45 | 리뷰 패키지·Beta 초안 SQL (T-011, 미적용) |
| DevOps | 35 | CI build + E2E, `vercel.json`, `deploy_vercel_checklist.md` (H-005) |
| AI 리포트 | 65 | DB·A4·마이페이지 집계; Edge 초안(OPENAI 없음) + LLM deploy H-002 |
| E2E 테스트 | 81 | Playwright 31플로우 + 인증 가드, GH Actions + smoke 커맨드 |

## vision 기반 이해도 점검 (2026-05-20)

| 항목 | 점검 결과 | 근거 |
|------|-----------|------|
| 핵심 3축(네트워크·워크스페이스·마이페이지) | 구현 이해도 높음 | 각 축의 핵심 화면·API·DB 흐름 연결 확인 |
| 추가요청 1: 대용량+링크 게시물 | 구현 | 업로드 500MB + 링크(URL) 등록/조회/삭제 지원 |
| 추가요청 2: 교수에게 학생용 리포트 비노출 | 구현 | `MyPage` role 가드 + 교수 전용 안내 블록 |
| 추가요청 3: 수업 코드 자동 생성 | 구현 | `CoursesPage`에서 `CC-XXXX-XXXX` 자동 생성 + 재생성 버튼 |
| 추가요청 4: 일정 캘린더 입력 | 구현 | `CoursesPage` 일정 입력을 `type="date"`로 전환 |
| 추가요청 5: 트러블슈팅 로그 새로고침 유실 | 구현 | TeamDetail 초기 로드 실패 내성 강화 + E2E #24 |
| 추가요청 6: 조원평가·회고록 전용 페이지 | 구현 | TeamDetail 버튼을 전용 route/page로 전환 + E2E #25/#26 |
| 추가요청 7: 수업 상세 네비 개편(나의팀멤버/조원평가) | 구현 | `CourseDetailPage` 좌측 사이드 네비 + 나의팀멤버 탭 + 조원평가 이동(T-052) |
| 추가요청 8: 수강생 카드 상세 프로필 모달 | 구현 | `StudentsNetworkPage` 카드 클릭 상세 프로필 모달 조회 + E2E #28(T-053) |
| 추가요청 9: 팀리스트 내 내가 속한 팀 직관적 표시 | 구현 | `TeamsPage` 내 팀 배지/강조 스타일 + E2E #29(T-054) |
| 추가요청 10: MyPage 리포트 팀플 정보 실데이터 검증 | 구현 | 종료 수업(`archived`) 참여 팀플만 집계 + 더미 폴백 제거(T-055) |
| 추가요청 11: CourseDetail 내부 네비 제거·메인 네비 이관 | 구현 | `MainLayout` 좌측 네비 확장 + `CourseDetailPage` 내부 네비 제거(T-056) |
| 추가요청 12: human_action_items 완료 체크칸 + AI 체크 기반 검증 | 구현 | `28_human_action_items` 체크 열 추가 + `[o]` 우선 검증 규칙 반영(T-058) |

## 구현 완료 (기능)

- [o] 랜딩·로그인 UI (`/`, `/signin`)
- [o] 과목 목록 **현재/종료** 필터, 생성·보관 (교수)
- [o] 과목·팀·Q&A·네트워크·팀 상세 — Supabase 읽기·쓰기 (대부분)
- [o] `AuthContext` + Firebase + `ai_users` (`firebase_uid`)
- [o] Protected routes, course-scoped URL, 레거시 리다이렉트
- [o] 멤버십·수업 코드·랜덤 팀 (T-012)
- [o] Q&A·트러블슈팅·네트워크 프로필·팀 산출물 Storage (T-020~023)
- [o] 팀 상세 채팅 DB 저장 + Supabase Realtime (`sendChatMessage`, TeamDetailPage)
- [o] 팀 상세 피드백 DB 저장 (`submitFeedback`, H-007 SQL)
- [o] 팀 동료평가 DB 저장 (`submitPeerReview`, H-008 SQL)
- [o] 팀 회고록 DB 저장 (`submitRetrospective`, 트러블슈팅 자동연동, H-009 SQL)
- [o] 교수 팀 평가 DB·제출 현황 조회·AI 진행 요약 (H-010, 번들 v2)
- [o] AI 리포트 DB 집계·A4 인쇄·마이페이지 실데이터 (T-030/031, LLM 제외)
- [o] Playwright E2E + GitHub Actions (T-040, T-041)
- [o] 종료 수업 시드 (김학생 등) — `supabase/seed/archived_courses_kim_student.sql`
- [o] `supabase-api.ts` rename (TD-001)

## 미완료 / 진행 중

- [ ] RLS 정책 검증·강화·원격 적용 (T-011, H-001)
- [ ] Edge `generate-report` **배포**·OPENAI Secret (T-030, H-002) — 코드는 `supabase/functions/`
- [ ] 프로덕션 배포 실행 (T-042, H-005)
- [ ] E2E 전체 green (H-003, H-004 시크릿)
- [o] vision 추가요청 구현 완료 (T-024~T-027·T-050~T-056 완료)

## 최근 검증 (2026-05-20)

- doc 전반 코드·DB 대조 갱신
- 종료 수업 2건(SWE/OOP 2025) Supabase 반영
- 프로젝트 스캔: `CoursesPage`(수업코드 자동생성·일정 캘린더), `TeamDetailPage`(업로드 500MB·링크 게시물), `MyPage`(교수 비노출)
- T-025 완료: 교수 `MyPage`에서 학생 리포트 비노출 + E2E #14 추가
- T-026 완료: `CoursesPage` 수업 코드 자동 생성(`CC-XXXX-XXXX`) + 재생성 버튼
- T-027 완료: `CoursesPage` 일정 입력 캘린더(`type="date"`) 적용
- T-024 완료: `TeamDetailPage` 링크 등록 + 파일 업로드 500MB + E2E #15 추가
- T-024 안정화: 파일 업로드 E2E #16 추가(`team-deliverable-file-input`)
- T-024 안정화: 링크 삭제 E2E #17 추가(삭제 다이얼로그 수락 포함)
- T-024 안정화: 잘못된 링크 입력 검증 E2E #18 추가
- T-024 안정화: 링크 `https://` 자동보정 E2E #19 추가
- T-024 확장: 소스코드/압축 확장자 확대 + E2E #20(`.ts`) 추가
- T-024 안정화: 금지 확장자(`.exe`) 업로드 차단 E2E #21 추가
- T-024 안정화: 업로드 가이드 노출 E2E #22 + 허용 확장자 안내 문구 추가
- T-024 안정화: 링크 제목 fallback(E2E #23) 추가
- vision 신규요청 5~8 반영: T-050~053 등록
- T-050 착수: TeamDetail 초기 로드를 `Promise.allSettled`로 안정화
- T-050 회귀: 트러블슈팅 새로고침 유지 E2E #24 추가
- T-051 구현: 조원평가·회고록 전용 페이지(`peer-review`, `retrospective`) 추가
- T-051 회귀: 전용 페이지 이동 E2E #25/#26 추가
- T-052 구현: 수업 상세 좌측 사이드 네비(`나의팀멤버`, `조원평가`) 추가
- T-052 회귀: 수업 상세 나의팀멤버 탭 E2E #27 추가
- T-053 안정화: 수강생 카드/상세 모달 testid 보강 + E2E #28 추가
- 유지보수: `TeamDetailPage` 미사용 회고록/조원평가 모달 코드 정리
- T-054 구현: 팀 목록에 `내가 속한 팀` 강조 배지/스타일 적용
- T-056 구현: `CourseDetailPage` 내부 네비 제거 + `MainLayout` 사이드 네비 이관
- T-056 회귀: 수업 상세 네비 중복 제거 E2E #30 추가
- T-055 구현: `gatherAiReportContext`를 종료 수업 참여 팀플 기준으로 필터링
- T-055 안정화: `getProjectsForUser` 더미 테이블 폴백 제거 + 종료 팀플 없을 때 빈 상태 표기
- T-057 구현: `npm run test:e2e:smoke` 추가(핵심 회귀 #1/#3/#6/#24/#29/#30/#31 + 인증가드)
- T-057 검증: smoke 실행 결과 자격증명 기반 시나리오 skip, 인증가드 pass 확인
- T-065 개선: `test:e2e:smoke` 범위를 #25/#26/#27/#28까지 확장(수업상세 네비·전용 페이지·수강생 상세모달 회귀 포함)
- T-065 검증: 확장 smoke 실행 결과 자격증명 기반 11개 skip, 인증가드 1개 pass 확인
- T-066 개선: `scripts/run-e2e-smoke.mjs` 추가로 스모크를 자격증명 유무에 따라 자동 분기(`smoke:public`/`smoke:full`)
- T-066 검증: `.env` 자격증명 미설정 환경에서 `npm run test:e2e:smoke` 결과 skip 없이 인증가드 1개 pass 확인
- T-067 개선: smoke full 분기 조건을 학생 계정(`E2E_TEST_EMAIL/PASSWORD`) 기준으로 보정해 교수 계정만 있을 때 불필요한 full 실행 방지
- T-067 검증: 자격증명 미설정 환경에서 `npm run test:e2e:smoke` 결과 `public-only` 경로 1개 pass 확인
- T-068 개선: `run-e2e-smoke`에 `--full`/`--public` 수동 강제 옵션 추가, auto/public/full 분리 실행 지원
- T-068 검증: `test:e2e:smoke:auto`, `test:e2e:smoke:force-public`, `test:e2e:smoke:force-full` 실행 확인
- T-069 개선: `run-e2e-smoke`에 `--dry-run`/`--json` 옵션 추가 (실행 계획/분기 상태 구조화 출력)
- T-069 검증: `test:e2e:smoke -- --dry-run --json`, `test:e2e:smoke:force-full -- --dry-run --json` 결과 확인
- T-070 구현: `collect-verification-report.mjs` 추가, `human:verify:json` + smoke dry-run JSON을 단일 리포트로 결합
- T-070 검증: `npm run verify:bundle:json` 결과 `overallOk=true`, parse 오류 없음 확인
- T-071 개선: 통합 리포트에 `human:sync --json` preview 결과(`moved/reverted/manual/memoAdded`) 결합
- T-071 검증: `npm run verify:bundle:json` 결과 `humanSyncPreview` 포함, `revertedCount=0`에서 `overallOk=true` 확인
- T-072 개선: `verify:bundle:save` 추가, 통합 검증 리포트를 `doc/for_agent/verification_report_latest.json`로 저장
- T-072 검증: `npm run verify:bundle:save` 실행 후 최신 리포트 파일 생성/내용 확인
- T-073 개선: `verify:bundle:save:archive` 추가, latest 갱신과 timestamp 아카이브(`verification_reports/`) 동시 저장
- T-073 검증: 아카이브 파일 생성 및 `savedFiles`가 출력/저장 JSON 모두에 일관 반영되는지 확인
- T-074 개선: `--keep-latest` 옵션으로 아카이브 최신 N개 유지 + `prunedFiles` 출력 지원
- T-074 검증: `npm run verify:bundle:save:archive:trim` 실행 시 trim 정책 적용 및 `prunedFiles` 필드 확인
- T-075 개선: `--keep-days` 옵션 및 `retentionPolicy` 출력 추가(개수+일수 동시 정책 지원)
- T-075 검증: `npm run verify:bundle:save:archive:policy` 실행 시 `retentionPolicy={keepLatest:5,keepDays:14}` 확인
- T-076 개선: `.env` 기반 정책(`VERIFY_BUNDLE_KEEP_LATEST`, `VERIFY_BUNDLE_KEEP_DAYS`) 로딩 및 `retentionPolicy.source` 출력 추가
- T-076 검증: `VERIFY_BUNDLE_KEEP_LATEST=3`, `VERIFY_BUNDLE_KEEP_DAYS=7` 환경에서 `verify:bundle:save:archive:env` 실행 시 env 정책 적용/정리 확인
- T-077 개선: `--preflight` 옵션 추가로 정책/경로/경고를 실제 실행 없이 JSON으로 사전 점검
- T-077 검증: env 주입(`keepLatest=4`, `keepDays=10`) 후 `verify:bundle:preflight` 실행 시 source=env, warnings 없음 확인
- T-078 개선: `--preflight --strict` 모드 추가(경고 존재 시 exit 1)
- T-078 검증: `verify:bundle:preflight:strict` 실행 시 strict=true, warnings=[], 종료코드 0 확인
- T-079 개선: strict preflight pass/fail 경로를 자동 회귀 점검하는 `preflight-strict-selftest.mjs` 추가
- T-079 검증: `verify:bundle:preflight:selftest` 실행 결과 pass/fail 케이스 각각 기대 종료코드(0/1) 확인
- T-080 개선: `run-verify-bundle-pipeline.mjs` 추가로 preflight self-test 통과 후 리포트 저장을 단일 파이프라인으로 실행
- T-080 검증: `verify:bundle:pipeline` 실행 시 self-test 통과 → `verify:bundle:save:archive:env` 순차 완료 확인
- T-058 구현: `for_human/28_human_action_items.md` 미완료 표 체크 칸(`[ ]/[o]`) 추가
- T-058 구현: `23_agent_operating_rules.md`, `for_agent/28_human_action_items.md`에 `[o]` 항목 검증 절차 반영
- T-059 구현: `scripts/check-human-actions.mjs` 추가, `[o]` H-항목 자동 추출 커맨드(`npm run human:checked`) 제공
- T-059 검증: `npm run human:checked` 실행 결과 현재 체크된 항목 없음 확인
- T-060 구현: `scripts/verify-human-actions.mjs` 추가, `[o]` H-항목 자동 검증(`pass/fail/manual`) 커맨드 제공
- T-060 검증: `npm run human:verify` 실행 결과 현재 검증 대상 없음 확인
- T-061 구현: `human:verify:strict` 추가, H-003에 대해 엄격 모드 시 스모크 테스트 연동
- T-061 검증: `npm run human:verify:strict` 실행 결과 현재 검증 대상 없음 확인
- T-062 구현: `human:verify:json`(구조화 출력), `human:verify:ci`(strict+manual 실패 처리) 추가
- T-062 검증: `human:verify:json`/`human:verify:ci` 실행 결과 JSON 정상 출력 확인
- T-063 구현: `sync-human-actions.mjs` 추가, `[o]` 항목 pass→완료 이동 / fail→`[ ]` 복귀 반자동 처리
- T-063 검증: `human:sync`/`human:sync:json`/`human:sync:apply` 실행 결과 현재 이동/복귀 대상 없음 확인
- T-064 구현: `28_human_action_items.md`에 「자동 검증 메모(최신 20건)」 섹션 추가
- T-064 구현: `human:sync:apply` 시 pass/fail/manual 결과를 메모 표에 누적 기록
- T-060 구현: `scripts/verify-human-actions.mjs` 추가, `[o]` H-항목 자동 검증 커맨드(`npm run human:verify`) 제공
- T-060 검증: `npm run human:verify` 실행 결과 현재 검증 대상 없음 확인

## 알려진 블로커

1. **RLS:** enabled, 정책 강화 미적용 (T-011 / H-001)
2. **Figma imports:** `src/imports/` 레거시 유지
3. **인간:** `28_human_action_items.md` H-001~006

## 다음 즉시 액션

→ AI 선행: 완료 기능 회귀 안정화 + 일반 품질 개선  
→ 인간 블로커: T-011(H-001) · T-030 deploy(H-002) · T-042(H-005)
