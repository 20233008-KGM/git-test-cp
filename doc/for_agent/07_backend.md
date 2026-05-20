# 07 — 백엔드

> **관련:** `09_database.md` · `11_api_spec.md` · `06_decision_log.md` (ADR-012)  
> **마지막 갱신:** 2026-05-20

## 현재 상태

| 구성요소 | 상태 |
|----------|------|
| Express + swagger-jsdoc | package.json에만 존재, 서버 미구현 |
| Firebase Auth | `src/app/firebase.ts` (`VITE_*`) |
| Supabase Client | `src/app/supabase.ts` (anon key) |
| 데이터 facade | `supabase-api.ts`, `ai-report.ts` → Supabase `ai_*` |
| Edge Function | `supabase/functions/generate-report` (코드 완료, deploy·OPENAI → H-002) |

## Firebase → Supabase JWT (RLS Beta, 2026-05-20)

- `src/app/supabase-firebase-auth.ts` — `signInWithIdToken({ provider: "firebase" })`  
- `.env`: `VITE_ENABLE_SUPABASE_FIREBASE_JWT=true` (Dashboard Firebase provider 후)  
- 가이드: `for_human/33_firebase_supabase_jwt_setup.md`

## 인증 플로우

```
Client → Firebase signIn/signUp
       → onAuthStateChanged(firebase uid)
       → Supabase ai_users … eq('firebase_uid', uid)
       → AuthContext profile
```

`/app/*` → `ProtectedRoute` → 미로그인 시 `/signin`

### Beta RLS 연동 (계획, ADR-012)

프로덕션 전 **Supabase Third-Party Auth (Firebase)** 로 JWT에 `firebase_uid` 클레임 → RLS에서 `ai_users` 매칭.  
상세: `rls_review_packet.md` · `22_security_notes.md` · H-001

## API 레이어

**현재:** Supabase PostgREST 직접 호출 (facade 경유)  
**AI:** `supabase.functions.invoke('generate-report')` — 키는 Edge Secret만

### teamDetail 쓰기 (2026-05-20)

| API | 저장소 |
|-----|--------|
| `sendChatMessage` | `ai_team_detail_chat_messages` |
| `submitFeedback` | `ai_team_detail_feedbacks` (H-007 SQL) |
| `submitPeerReview` | `ai_team_detail_peer_reviews` (H-008 SQL) |
| 트러블슈팅·산출물 | 기존 `ai_team_detail_*` · Storage |

## 다음 작업

1. 번들 SQL 실행 (`migrations/20260520095400_team_detail_writes_bundle.sql`)
2. RLS + Third-Party Auth (H-001, T-011)
3. Edge deploy + `OPENAI_API_KEY` (H-002)

## 주의

- LLM API 키는 클라이언트에 두지 말 것
- `.env`는 gitignore — `.env.example` 참고
