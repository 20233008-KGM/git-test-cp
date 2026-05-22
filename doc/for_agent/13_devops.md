# 13 — DevOps

> **관련:** `04_service_launch_flow.md` · `14_testing.md`

## 현재

| 항목 | 상태 |
|------|------|
| 로컬 개발 | `pnpm dev` (Vite) |
| 빌드 | `pnpm build` |
| CI/CD | `build.yml` (빌드) · `e2e.yml` (Playwright, 시크릿 시 H-004) |
| 호스팅 | `vercel.json` 준비 (미연결; H-005) |
| 환경 분리 | 없음 (dev only) |

## 권장 타겟

| 환경 | 프론트 | DB |
|------|--------|-----|
| local | Vite :5173 | Supabase local 또는 dev project |
| staging | Vercel preview | Supabase staging |
| prod | Vercel prod | Supabase prod |

## 환경 변수 (계획)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`.env.example` 커밋, `.env` gitignore

## CI 파이프라인 (계획)

```yaml
# .github/workflows/ci.yml
- pnpm install
- pnpm build
- pnpm exec playwright test
```

## 배포

- 루트 **`vercel.json`**: `npm run build` → `dist`, SPA `rewrites` → `/index.html`
- Vercel 프로젝트 연결 시 `VITE_*` 환경변수를 대시보드에 설정 (`.env`와 동일 키)
- **체크리스트:** `deploy_vercel_checklist.md` (DB·Firebase·스모크·롤백)
- **인간 승인 필수** (T-042 / H-005)
- DNS·도메인·학교 방화벽 — 인간 협업

## Edge Functions (`generate-report`)

| 단계 | 명령/위치 |
|------|-----------|
| 소스 | `supabase/functions/generate-report/` |
| Secret | Dashboard → **`GEMINI_API_KEY`** (H-002; 레거시 `OPENAI_API_KEY` 선택) |
| 배포 | `supabase functions deploy generate-report` |
| 가이드 | `supabase/functions/generate-report/README.md` |

## 모니터링 (Launch 후)

- Vercel Analytics
- Supabase Dashboard
- (선택) Sentry
