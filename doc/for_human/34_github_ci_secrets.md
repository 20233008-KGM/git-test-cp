# GitHub Actions — 시크릿 등록 (H-004)

> **워크플로:** `.github/workflows/e2e.yml` · 로컬은 `.env` (H-003)

## 1. GitHub에서 열기

저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

## 2. 필수 (학생 E2E #1~11)

| Secret 이름 | 값 |
|-------------|-----|
| `E2E_TEST_EMAIL` | Firebase **학생** 테스트 계정 이메일 |
| `E2E_TEST_PASSWORD` | 비밀번호 |
| `VITE_FIREBASE_API_KEY` | Firebase 콘솔 |
| `VITE_FIREBASE_AUTH_DOMAIN` | |
| `VITE_FIREBASE_PROJECT_ID` | |
| `VITE_FIREBASE_STORAGE_BUCKET` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | |
| `VITE_FIREBASE_APP_ID` | |
| `VITE_SUPABASE_URL` | Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon key |

로컬 `.env`와 **동일한 값**을 쓰면 CI와 로컬 결과가 맞습니다.

## 3. 선택 (교수 E2E #12)

| Secret 이름 | 값 |
|-------------|-----|
| `E2E_PROFESSOR_EMAIL` | Firebase **교수** 계정 |
| `E2E_PROFESSOR_PASSWORD` | |

없으면 #12 테스트만 skip 됩니다.

## 4. 확인

1. PR 또는 `main` push  
2. **Actions** 탭 → **E2E (Playwright)** job green  
3. 실패 시 **playwright-report** 아티팩트 다운로드

## 5. AI에게

**「H-004 완료」** 또는 Actions 스크린샷 공유

## 관련

- [00_pre_launch_order.md](./00_pre_launch_order.md)  
- Supabase 테이블: [29_supabase_bundle_sql.md](./29_supabase_bundle_sql.md) (번들 v2)
