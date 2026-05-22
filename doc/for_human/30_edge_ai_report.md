# 마이페이지 AI 리포트 — Edge 배포 (10분)

> **관련:** `28_human_action_items.md` H-002 · 기술: `supabase/functions/generate-report/README.md`

DB 미리보기(A4)는 **이미 동작**합니다. 이 가이드는 **AI가 문단을 생성**하는 기능만 켭니다.

## 준비물

- Supabase 프로젝트 관리자 권한
- [Google AI Studio](https://aistudio.google.com/) Gemini API Key (카드 없이 발급 가능)
- (선택) PC에 [Supabase CLI](https://supabase.com/docs/guides/cli) 설치

## 1. Gemini API Key

1. https://aistudio.google.com/apikey 접속
2. **Create API key** → `AIza...` 키 복사 (한 번만 표시됨)
3. 모델은 키에 묶이지 않음 — Edge에서 기본 `gemini-2.5-flash` 사용

## 2. Supabase Secret 등록

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택  
2. **Project Settings** → **Edge Functions** → **Secrets**  
3. **Add secret**  
   - Name: `GEMINI_API_KEY`  
   - Value: (방금 복사한 `AIza...` 키)  
4. (선택) **Add secret**  
   - Name: `GEMINI_MODEL`  
   - Value: `gemini-2.5-flash` (기본과 같으면 생략 가능) · 더 가볍게: `gemini-2.5-flash-lite`  
5. Save

> API Key는 **절대** GitHub·`.env`의 `VITE_*`에 넣지 마세요 (Edge Secret만).

## 3. Edge Function 배포

코드 변경 후 **반드시 재배포**해야 Gemini가 적용됩니다.

### 방법 A — Dashboard (CLI 없이)

1. **Edge Functions** 메뉴  
2. 기존 `generate-report` 업데이트  
3. 로컬 `supabase/functions/generate-report/index.ts` 내용 붙여넣기

### 방법 B — CLI (권장)

프로젝트 루트에서:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-report
```

`YOUR_PROJECT_REF`는 Dashboard URL의 `project/` 뒤 문자열 (예: `exsboyynrmxtdyyyqkyy`).

## 4. 동작 확인

1. CampusConnect 로그인 → **마이페이지**  
2. **AI 리포트 생성 (베타)** 클릭  
3. **GEMINI_API_KEY 없이 배포만 한 경우:** 「DB 집계 초안」+ `model: draft-db-only` (200)  
4. **GEMINI_API_KEY 등록·재배포 후:** AI 문단 갱신 + `model: gemini-2.5-flash` (또는 설정한 모델)  
5. 404·함수 미배포: 「DB 활동 미리보기」 — Edge Functions → Logs 확인

## 5. AI에게 알리기

채팅에 **「H-002 완료 (Gemini)」** 라고 적어 주세요.

## 비용·주의

- Gemini **무료 티어**는 일·분당 호출 한도가 있음 (Flash 계열 권장)  
- 무료 티어 데이터 정책은 Google 문서·학교 **H-006** 확인  
- (레거시) `OPENAI_API_KEY`만 있으면 예전처럼 gpt-4o-mini 사용 가능 — **Gemini 우선**
