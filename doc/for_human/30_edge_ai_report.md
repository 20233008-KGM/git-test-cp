# 마이페이지 AI 리포트 — Edge 배포 (10분)

> **관련:** `28_human_action_items.md` H-002 · 기술: `supabase/functions/generate-report/README.md`

DB 미리보기(A4)는 **이미 동작**합니다. 이 가이드는 **AI가 문단을 생성**하는 기능만 켭니다.

## 준비물

- Supabase 프로젝트 관리자 권한
- [OpenAI](https://platform.openai.com/) 계정 (API Key)
- (선택) PC에 [Supabase CLI](https://supabase.com/docs/guides/cli) 설치

## 1. OpenAI API Key

1. OpenAI → API Keys → **Create new secret key**
2. 키를 복사해 안전한 곳에 보관 (다시 안 보임)

## 2. Supabase Secret 등록

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택  
2. **Project Settings** → **Edge Functions** → **Secrets**  
3. **Add secret**  
   - Name: `OPENAI_API_KEY`  
   - Value: (방금 복사한 sk-… 키)  
4. Save

## 3. Edge Function 배포

### 방법 A — Dashboard (CLI 없이)

1. **Edge Functions** 메뉴  
2. **Deploy a new function** 또는 기존 `generate-report` 업데이트  
3. 로컬 파일 `supabase/functions/generate-report/index.ts` 내용을 붙여넣거나 Git 연동

### 방법 B — CLI (권장)

프로젝트 루트에서:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-report
```

`YOUR_PROJECT_REF`는 Dashboard URL의 `project/` 뒤 문자열입니다.

## 4. 동작 확인

1. CampusConnect 로그인 → **마이페이지**  
2. **AI 리포트 생성 (베타)** 클릭  
3. 501이 아니고 요약 문단이 갱신되면 성공  
4. 실패 시: Edge Functions → Logs 탭에서 오류 확인

## 5. AI에게 알리기

채팅에 **「H-002 완료」** 라고 적어 주세요.

## 비용·주의

- OpenAI 사용량에 따라 과금됩니다 (gpt-4o-mini 사용)  
- API Key는 **절대** GitHub·`.env`의 `VITE_*`에 넣지 마세요 (Edge Secret만)  
- 학교 AI 정책은 **H-006** 확인
