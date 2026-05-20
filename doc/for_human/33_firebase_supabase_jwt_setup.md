# Firebase ↔ Supabase JWT 연동 (RLS 승인 후)

> **먼저:** [31_rls_beta_decision.md](./31_rls_beta_decision.md)에서 **「RLS 적용 승인」**  
> **기술 패키지:** [`rls_review_packet.md`](../for_agent/rls_review_packet.md) · ADR-012

## 왜 하나요?

지금은 DB가 anon 키만으로도 넓게 열려 있습니다.  
RLS를 쓰려면 Supabase가 **「이 요청은 Firebase로 로그인한 ○○ 사용자」** 를 알아야 합니다.

## 개요 (3단계)

1. **Supabase** — Authentication → Providers → **Firebase** 활성화  
2. **Firebase** — 프로젝트 설정에서 Supabase용 Third-Party 연동 (콘솔 안내 따름)  
3. **앱** — Supabase 클라이언트에 Firebase ID 토큰 전달 (개발자·AI가 `supabase.ts` 수정)

## 1. Supabase Dashboard

1. [Supabase](https://supabase.com/dashboard) → 프로젝트  
2. **Authentication** → **Providers** (또는 Third-party / Firebase)  
3. **Firebase** 켜기 · Firebase 프로젝트 ID 입력  
4. 저장

## 2. Firebase Console

1. [Firebase Console](https://console.firebase.google.com/) → 동일 프로젝트  
2. **Authentication** → **Settings** → **Authorized domains**에 로컬·Vercel 도메인 추가  
3. Supabase 문서의 **「Use Firebase with Supabase」** 체크리스트대로 JWT secret·연동 확인

## 3. 앱 코드 (이미 준비됨)

코드: `src/app/supabase-firebase-auth.ts` · `AuthContext`에서 로그인 시 동기화

**.env 에 추가 (Dashboard 연동 후):**

```env
VITE_ENABLE_SUPABASE_FIREBASE_JWT=true
```

기본값은 **off** — 지금처럼 anon 키로 동작합니다. RLS SQL 스테이징 적용 후에만 `true`로 켜세요.

추가 작업:

- `supabase/migrations/20260519000000_rls_beta_draft.sql` 스테이징 적용  
- E2E·수동 회귀

## 4. 검증

| 확인 | 방법 |
|------|------|
| 학생 A가 B 수업 데이터 못 봄 | 다른 계정으로 API/화면 시도 |
| 본인 피드백만 수정 | 다른 학생 계정 |
| 교수는 담당 수업만 | 교수·타 수업 |

## 5. 완료 알림

채팅에 **「JWT 연동 완료」** 또는 **「RLS 스테이징 OK」**

## 관련 인간 항목

- H-001 RLS 결정  
- H-007 번들 v2 (테이블 존재)  
- H-005 배포 (프로덕션 적용 GO는 별도)
