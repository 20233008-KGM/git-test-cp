# generate-report (Edge Function)

마이페이지 AI 리포트 LLM 생성 (`T-030`).

## 배포 전 (인간 — H-002)

1. [Google AI Studio](https://aistudio.google.com/apikey) Gemini API Key 발급
2. Supabase Dashboard → **Project Settings → Edge Functions → Secrets**
   - `GEMINI_API_KEY` = `AIza...`
   - (선택) `GEMINI_MODEL` = `gemini-2.5-flash` (기본값과 동일하면 생략)
3. CLI (프로젝트 루트):

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy generate-report
```

`SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY`는 Edge 런타임에 자동 주입됩니다.

## 동작

| Secret | HTTP | 응답 `model` |
|--------|------|----------------|
| 없음 (`GEMINI`·`OPENAI` 둘 다 없음) | **200** | `draft-db-only` |
| `GEMINI_API_KEY` | 200 | `gemini-2.5-flash` (또는 `GEMINI_MODEL`) |
| `OPENAI_API_KEY`만 (레거시) | 200 | `gpt-4o-mini` |
| 함수 미배포 | (클라이언트) 404 | 「DB 활동 미리보기」 |

우선순위: **Gemini → OpenAI → DB 초안**

집계 데이터: 팀·트러블슈팅·산출물·**피드백·회고·동료평가·교수 평가** (클라이언트 `ai-report.ts`와 동일).

## 요청

```json
{ "userId": "<ai_users.uuid>", "locale": "ko" }
```

## 로컬 테스트 (선택)

```bash
supabase functions serve generate-report --env-file supabase/.env.local
```

`supabase/.env.local` 예:

```
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash
```

(Git 커밋 금지)
