# 05 — TODO (우선순위)

> **관련:** `02_current_state.md` · `17_handoff.md` · `28_human_action_items.md`  
> **마지막 갱신:** 2026-05-20

## P0 — 즉시 (데이터 기반)

| ID | 작업 | 담당 | 상태 |
|----|------|------|------|
| T-001 | Supabase 스키마 설계·마이그레이션 | DB | done |
| T-002 | `supabase-api.ts` → Supabase courses 연동 | FE+DB | done |
| T-003 | 환경변수 분리 (`VITE_*`, `.env.example`) | Infra | done |
| T-004 | 라우트 통합: course-scoped teams only | FE | done |

## P1 — 인증·접근

| ID | 작업 | 상태 |
|----|------|------|
| T-010 | Protected routes | done |
| T-011 | RLS 정책 초안 + 인간 리뷰 | in_progress | `rls_review_packet.md`, `supabase/migrations/20260519000000_rls_beta_draft.sql` (미적용) |
| T-012 | 회원가입·수업 코드 멤버십 | done |

## P2 — 핵심 기능

| ID | 작업 | 상태 |
|----|------|------|
| T-020 | 트러블슈팅 CRUD | done |
| T-021 | 팀 산출물 Storage | done |
| T-022 | Q&A CRUD | done |
| T-023 | 수강생 네트워크 저장 | done |
| T-024 | 워크스페이스 대용량 업로드 + 링크 게시물 | done |
| T-025 | 교수 계정 학생용 리포트 비노출 | done |
| T-026 | 수업 코드 자동 생성(해시형) | done |
| T-027 | 일정 입력 캘린더 선택 UI | done |
| T-050 | 트러블슈팅 로그 새로고침 유실 안정화 | done |
| T-051 | 조원평가·회고록 전용 페이지 전환 | done |
| T-052 | 수업 상세 네비: 나의팀멤버 추가 + 조원평가 이동 | done |
| T-053 | 수강생 카드 클릭 상세 프로필 모달 | done |
| T-054 | 팀 목록에서 내가 속한 팀 강조 UI | done |
| T-055 | 마이페이지 리포트 팀플 정보 실데이터 검증 | done |
| T-056 | 수업 상세 내부 네비 제거 + 메인 사이드바 이관 | done |
| T-058 | human_action_items 체크칸 + AI 체크기반 검증 규칙 | done |

### vision 점검 후 우선순위 (신규)

1. vision 추가요청 1~11 회귀 안정화
2. vision 추가요청 12 운영 검증(체크 `[o]` 동작 루프)

## P3 — AI·마이페이지

| ID | 작업 | 상태 | 비고 |
|----|------|------|------|
| T-030 | AI 리포트 | in_progress | DB·UI·Edge 코드 완료; deploy·OPENAI → H-002 |
| T-031 | A4 리포트 템플릿 | done | `AiReportPrintView`, MyPage 1–3페이지 DB |

## P4 — 품질·배포

| ID | 작업 | 상태 |
|----|------|------|
| T-040 | Playwright 핵심 플로우 | done | 31플로우 + 인증 가드 (`14_testing.md`) |
| T-041 | GitHub Actions CI | done | `.github/workflows/e2e.yml` |
| T-042 | 프로덕션 배포 | in_progress | `vercel.json` + `deploy_vercel_checklist.md`, 실행 H-005 |
| T-057 | Playwright 스모크 회귀 커맨드 정리 | done | `npm run test:e2e:smoke` + E2E #31 |
| T-059 | human_action_items 체크 추출 보조 스크립트 | done | `npm run human:checked` |
| T-060 | human_action_items 체크 자동 검증 커맨드 | done | `npm run human:verify` (`pass/fail/manual`) |
| T-061 | human_action_items 엄격 검증 모드 | done | `npm run human:verify:strict` |
| T-062 | human_action_items JSON/CI 검증 모드 | done | `human:verify:json`, `human:verify:ci` |
| T-063 | human_action_items 반자동 동기화 루프 | done | `human:sync`, `human:sync:apply`, `human:sync:json` |
| T-064 | human_action_items 자동 검증 메모 로그 | done | `human:sync:apply` 시 검증 메모 누적 |
| T-065 | Playwright 스모크에 vision 추가요청 회귀(25~28) 포함 | done | `test:e2e:smoke` grep 확장 |
| T-066 | Playwright 스모크 자격증명 자동 분기 실행 | done | `run-e2e-smoke.mjs` + `smoke:public/full` |
| T-067 | Playwright 스모크 full 분기 조건 보정(학생 자격증명 기준) | done | `run-e2e-smoke.mjs` 분기 기준 수정 |
| T-068 | Playwright 스모크 수동 강제 모드 추가(`--full`/`--public`) | done | `smoke:auto/force-full/force-public` |
| T-069 | Playwright 스모크 dry-run/JSON 실행 계획 출력 | done | `run-e2e-smoke.mjs --dry-run --json` |
| T-070 | human verify + smoke dry-run 통합 JSON 리포트 | done | `collect-verification-report.mjs`, `verify:bundle:json` |
| T-071 | 통합 검증 리포트에 `human:sync` preview 결합 | done | `verify:bundle:json`에 `humanSyncPreview` 추가 |
| T-072 | 통합 검증 리포트 최신 파일 저장 커맨드 | done | `verify:bundle:save`, `verification_report_latest.json` |
| T-073 | 통합 검증 리포트 latest+archive 동시 저장 | done | `verify:bundle:save:archive`, `verification_reports/` |
| T-074 | 통합 검증 리포트 아카이브 최신 N개 유지 정리 | done | `--keep-latest`, `verify:bundle:save:archive:trim` |
| T-075 | 통합 검증 리포트 아카이브 일수 기준 정리 | done | `--keep-days`, `verify:bundle:save:archive:policy` |
| T-076 | 통합 검증 리포트 정책값 `.env` 외부화 | done | `VERIFY_BUNDLE_KEEP_*`, `verify:bundle:save:archive:env` |
| T-077 | 통합 검증 리포트 실행 전 preflight 점검 | done | `--preflight`, `verify:bundle:preflight` |
| T-078 | 통합 검증 리포트 preflight strict 모드 | done | `--preflight --strict`, `verify:bundle:preflight:strict` |
| T-079 | 통합 검증 리포트 preflight strict self-test | done | `preflight-strict-selftest.mjs`, `verify:bundle:preflight:selftest` |
| T-080 | 통합 검증 리포트 실행 파이프라인 자동화 | done | `run-verify-bundle-pipeline.mjs`, `verify:bundle:pipeline` |

## 완료됨 (최근)

- [o] T-056 수업 상세 내부 네비 제거 + 메인 사이드바 이관 (2026-05-20)
- [o] T-054 팀 리스트 내 내가 속한 팀 강조 UI + E2E #29 (2026-05-20)
- [o] T-055 MyPage 리포트 실데이터 기준 보정(종료 팀플 필터 + 더미 폴백 제거) (2026-05-20)
- [o] T-057 Playwright 스모크 회귀 커맨드 + MyPage 실데이터 회귀 E2E #31 (2026-05-20)
- [o] T-065 Playwright 스모크 회귀 범위를 #25/#26/#27/#28까지 확장 (2026-05-20)
- [o] T-066 Playwright 스모크를 자격증명 유무에 따라 자동 분기 실행하도록 개선 (2026-05-20)
- [o] T-067 Playwright 스모크 full 분기를 학생 자격증명 기준으로 보정 (2026-05-20)
- [o] T-068 Playwright 스모크 수동 강제 모드(auto/public/full) 추가 (2026-05-20)
- [o] T-069 Playwright 스모크 dry-run/JSON 실행 계획 출력 추가 (2026-05-20)
- [o] T-070 human verify + smoke dry-run 통합 JSON 리포트 추가 (2026-05-20)
- [o] T-071 통합 검증 리포트에 human:sync preview 결합 (2026-05-20)
- [o] T-072 통합 검증 리포트 최신 파일 저장 커맨드 추가 (2026-05-20)
- [o] T-073 통합 검증 리포트 latest+archive 동시 저장 및 savedFiles 일관화 (2026-05-20)
- [o] T-074 통합 검증 리포트 아카이브 최신 N개 유지 정리 옵션 추가 (2026-05-20)
- [o] T-075 통합 검증 리포트 아카이브 일수 기준 정리 옵션 추가 (2026-05-20)
- [o] T-076 통합 검증 리포트 정책값 .env 외부화 및 source 표기 추가 (2026-05-20)
- [o] T-077 통합 검증 리포트 실행 전 preflight 점검 옵션 추가 (2026-05-20)
- [o] T-078 통합 검증 리포트 preflight strict 모드 추가 (2026-05-20)
- [o] T-079 통합 검증 리포트 preflight strict self-test 추가 (2026-05-20)
- [o] T-080 통합 검증 리포트 실행 파이프라인 자동화 추가 (2026-05-20)
- [o] T-058 human_action_items 체크칸 + AI 체크기반 검증 규칙 반영 (2026-05-20)
- [o] T-059 `human:checked` 스크립트 추가(`[o]` H-항목 추출) (2026-05-20)
- [o] T-060 `human:verify` 스크립트 추가(`[o]` H-항목 자동 검증) (2026-05-20)
- [o] T-061 `human:verify:strict` 추가(기본/엄격 검증 모드 분리) (2026-05-20)
- [o] T-062 `human:verify:json`·`human:verify:ci` 추가(JSON 출력 + CI 게이트) (2026-05-20)
- [o] T-063 `human:sync` 반자동 동기화 루프 추가(완료 이동/체크 복귀) (2026-05-20)
- [o] T-064 `human:sync` 자동 검증 메모(최신 20건) 누적 로그 추가 (2026-05-20)
- [o] 유지보수: `TeamDetailPage` 미사용 회고록/조원평가 모달 코드 정리 (2026-05-20)
- [o] T-053 수강생 카드 클릭 상세 프로필 모달 + E2E #28 (2026-05-20)
- [o] T-052 수업 상세 좌측 네비 개편(나의팀멤버 + 조원평가 이동) + E2E #27 (2026-05-20)
- [o] T-051 조원평가·회고록 전용 페이지 전환 + E2E #25/#26 (2026-05-20)
- [o] T-050 트러블슈팅 새로고침 유실 안정화 + E2E #24 (2026-05-20)
- [o] T-024 안정화: 링크 제목 fallback E2E #23 (2026-05-20)
- [o] T-024 안정화: 업로드 가이드 노출 E2E #22 (2026-05-20)
- [o] T-024 안정화: 금지 확장자 업로드 차단 E2E #21 (.exe) (2026-05-20)
- [o] T-024 확장: 소스코드/압축 확장자 확대 + E2E #20 (.ts 업로드) (2026-05-20)
- [o] T-024 안정화: 링크 프로토콜 자동보정 E2E #19 (2026-05-20)
- [o] T-024 안정화: 잘못된 링크 입력 검증 E2E #18 (2026-05-20)
- [o] T-024 안정화: 링크 게시물 삭제 E2E #17 (2026-05-20)
- [o] T-024 안정화: 팀 산출물 파일 업로드 E2E #16 (2026-05-20)
- [o] T-024 대용량 업로드(500MB) + 링크 게시물 + E2E #15 (2026-05-20)
- [o] T-027 일정 입력 캘린더(`type="date"`) 적용 (2026-05-20)
- [o] T-026 수업 코드 자동 생성(`CC-XXXX-XXXX`) + 재생성 버튼 (2026-05-20)
- [o] T-025 교수 계정 학생용 리포트 비노출 + E2E #14 (2026-05-20)
- [o] 프로젝트 스캔 기반 doc 최신화 (`02`·`10`·`14`·`17`·`27`·`for_human/01`) (2026-05-20)
- [o] MyPage 집계 새로고침·A4 닫기 testid (2026-05-20)
- [o] MyPage resolveReportContext 캐시 (2026-05-20)
- [o] MyPage DEMO 지연·A4 overlay testid (2026-05-20)
- [o] mapReportContextToMyPageProjects + RLS 스테이징 가이드 (2026-05-20)
- [o] 마이페이지 프로젝트 카드·AI 생성 E2E #13 (2026-05-20)
- [o] Edge generate-report DB 초안 200 (OPENAI 없음) (2026-05-20)
- [o] 마이페이지 PAGE01 역량·활동 요약 DB 추정 (2026-05-20)
- [o] 마이페이지 PAGE01 카드·PAGE03 intro DB 집계 (2026-05-20)
- [o] 마이페이지 리포트 1·2페이지 DB 집계 동기화 (2026-05-20)
- [o] A4 팀별 상세 섹션(트러블슈팅·산출물) + E2E (2026-05-20)
- [o] A4 해결 문제·기술 역량 DB 초안 + E2E testid (2026-05-20)
- [o] A4 성장 회고 DB 초안 + README·상태 doc (2026-05-20)
- [o] AI 리포트 피드백·동료평가 스니펫 (클라·Edge) (2026-05-20)
- [o] AI 리포트 회고록 sections 스니펫 (클라·Edge) (2026-05-20)
- [o] 37 리포트 검증 가이드 + 런칭·배포 doc 동기화 (2026-05-20)
- [o] AI 리포트 교수 평가 집계 (클라·Edge·MyPage) (2026-05-20)
- [o] E2E #6 집계 요약 + 스모크·10_ai_system (2026-05-20)
- [o] Edge generate-report 집계 동기화 + MyPage 요약 (2026-05-20)
- [o] AI 리포트 집계(피드백·회고·동료평가) + 36 런칭 한 페이지 (2026-05-20)
- [o] 17_handoff·RLS·스모크 가이드 + 교수 동료평가 조회 (2026-05-20)
- [o] Firebase JWT 스캐폴드 + CI 시크릿 가이드 (2026-05-20)
- [o] 교수 제출 조회 + JWT 가이드 + E2E #12 (2026-05-20)
- [o] SQL 번들 v2 + 교수 평가 DB (2026-05-20)
- [o] 팀 회고록 DB + E2E #11 + H-009 (2026-05-20)
- [o] H-001 인간 RLS 결정 가이드 (31, starter, 22) (2026-05-20)
- [o] vision·개요 doc 동기화 (26, 00, 00_start_here) (2026-05-20)
- [o] H-002·런칭 순서 인간 가이드 + Realtime SQL (2026-05-20)
- [o] E2E #10 동료평가 + for_human/29 SQL 가이드 (2026-05-20)
- [o] E2E #9 팀 피드백 + 07_backend 갱신 (2026-05-20)
- [o] DB 마이그레이션 번들 + 11_api_spec + ADR-012 (2026-05-20)
- [o] 동료평가 DB 저장 + H-008 (2026-05-20)
- [o] T-042 배포 체크리스트 + CI build.yml (2026-05-20)
- [o] 팀 피드백 DB 저장 + 마이그레이션 H-007 (2026-05-20)
- [o] Edge `generate-report` 함수 구현 (2026-05-20)
- [o] E2E #8 팀 채팅 전송 (2026-05-20)
- [o] 팀 상세 채팅 DB 저장 + Realtime (2026-05-20)
- [o] 마이페이지 리포트 2·3페이지 DB, E2E #7 (2026-05-20)
- [o] 마이페이지 요약·Vercel 준비 (2026-05-20)
- [o] 김학생 종료 수업 시드 (2026-05-20)
- [o] T-040·T-041 E2E + CI (2026-05-19)
- [o] doc 전반 코드 대조 (2026-05-19)

## 작업 규칙

1. 착수 전 `02_current_state.md` 확인
2. 완료 시 이 파일 + `17_handoff.md` + (기능 시) `27` 갱신
3. 아키텍처 변경 시 `06_decision_log.md`
