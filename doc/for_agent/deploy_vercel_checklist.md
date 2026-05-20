# Vercel 배포 체크리스트 (T-042)

> **관련:** `13_devops.md` · `04_service_launch_flow.md` · `for_human/28_human_action_items.md` (H-005)  
> **대상:** 인간 GO/NO-GO 전 · AI 배포 준비 시

## 배포 전 — Supabase (DB)

| # | 항목 | 확인 |
|---|------|------|
| 1 | 프로덕션 Supabase 프로젝트 URL·anon key 확보 | [ ] |
| 2 | RLS 리뷰 (`rls_review_packet.md`, H-001) | [ ] |
| 3 | **`migrations/20260520102000_team_detail_writes_bundle_v2.sql`** (H-007~010 일괄) · [29](../for_human/29_supabase_bundle_sql.md) | [ ] |
| 4 | Edge `generate-report` deploy + `OPENAI_API_KEY` (H-002, 선택) | [ ] |
| 5 | Storage bucket `ai_team_deliverables` 정책 확인 | [ ] |

## 배포 전 — Firebase

| # | 항목 | 확인 |
|---|------|------|
| 1 | Authentication 이메일/비밀번호 활성화 | [ ] |
| 2 | Authorized domains에 Vercel 도메인 추가 (`*.vercel.app`, 커스텀 도메인) | [ ] |
| 3 | 테스트 계정 E2E용 (H-003, H-004) | [ ] |

## 배포 전 — 로컬 빌드

```bash
npm ci
npm run build
```

| # | 항목 | 확인 |
|---|------|------|
| 1 | `dist/` 생성, 에러 없음 | [ ] |
| 2 | `.env`에 `VITE_*` 전부 설정 후 `npm run dev` 스모크 | [ ] |

## Vercel 프로젝트 설정

| 설정 | 값 |
|------|-----|
| Framework | Vite |
| Build Command | `npm run build` (`vercel.json`과 동일) |
| Output Directory | `dist` |
| Install Command | `npm ci` |

### Environment Variables (Production + Preview)

GitHub Secrets(H-004)와 **동일 키**를 Vercel에도 등록합니다.

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

> `OPENAI_API_KEY`는 **클라이언트에 넣지 않음** — Supabase Edge Secret만 (H-002).

## 배포 후 스모크 (5분)

| # | 동작 | 기대 |
|---|------|------|
| 1 | `/` 랜딩 로드 | 200 |
| 2 | 로그인 → `/app/courses` | 리다이렉트 없음 |
| 3 | 수업·팀·Q&A 열람 | 데이터 표시 |
| 4 | 팀 상세 트러블슈팅·채팅·피드백 | 쓰기 OK (H-007 후 피드백) |
| 5 | 마이페이지 리포트 미리보기 | A4 표시 |

## 롤백

- Vercel Dashboard → Deployments → 이전 배포 **Promote to Production**
- DB 마이그레이션은 롤백 SQL 별도 준비 (적용 전 백업 권장)

## 인간 승인

→ **H-005** 채팅 또는 `28` 완료 표에 배포 URL·시각 기록
