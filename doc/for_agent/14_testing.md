# 14 — 테스트

> **관련:** `13_devops.md` · `tests/e2e/` · `28_human_action_items.md` (H-003, H-004)

## 현재

- **Playwright** — `playwright.config.ts`, `tests/e2e/`
- **핵심 E2E:** `core-flows.spec.ts` — 12플로우 + 인증 가드 1건
- **단위 테스트:** 없음

## 실행

```bash
npm run test:e2e
npm run test:e2e:ui
```

`.env`:

```env
E2E_TEST_EMAIL=...
E2E_TEST_PASSWORD=...
```

미설정 시 로그인 11건 skip, #12는 `E2E_PROFESSOR_*` 없으면 skip. #9·#10은 번들 v2 후. #11은 회고록 테이블. #12는 **교수** 계정·번들 v2.

## 구현된 E2E 시나리오

1. 랜딩 로그인 → `/app/courses`
2. 과목 → 수강생 네트워크
3. 팀 목록 → 팀 상세
4. 마이페이지
5. 로그아웃 → 랜딩
6. 마이페이지 DB 리포트 미리보기 (A4) + 활동 집계 한 줄 (`report-activity-summary`, 교수평가 포함)
7. 마이페이지 리포트 페이지 1→2→3
8. 팀 상세 채팅 메시지 전송
9. 팀 상세 피드백 제출 (`data-testid=team-feedback-submit`)
10. 팀 상세 동료평가 제출 (학생·`peer-review-submit-*`)
11. 팀 상세 회고록 저장 (학생·`retrospective-submit`)
12. 교수 팀 제출 현황·프로젝트 평가 (`E2E_PROFESSOR_*`, `professor-team-submissions`)

헬퍼: `tests/e2e/helpers/auth.ts`

## CI

- `.github/workflows/build.yml` — `npm run build` (시크릿 불필요)
- `.github/workflows/e2e.yml` — `VITE_*`, `E2E_TEST_*` 시크릿 (H-004)

## 다음

- [ ] 시드/테스트 전용 Supabase project
- [ ] RLS 회귀 테스트 (T-011 후)
