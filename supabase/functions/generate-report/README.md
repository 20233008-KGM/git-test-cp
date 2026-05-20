# generate-report (Edge Function)

마이페이지 AI 리포트 LLM 생성 (`T-030`).

## 배포 전 (인간 — H-002)

1. [OpenAI](https://platform.openai.com/) API Key 발급
2. Supabase Dashboard → **Project Settings → Edge Functions → Secrets**
   - `OPENAI_API_KEY` = (발급 키)
3. CLI (프로젝트 루트):

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy generate-report
```

`SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY`는 Edge 런타임에 자동 주입됩니다.

## 동작

| `OPENAI_API_KEY` | HTTP | 응답 |
|------------------|------|------|
| 없음 | 501 | `{ code: "NOT_IMPLEMENTED", message }` |
| 있음 | 200 | `AiReportGenerateResponse` JSON |

집계 데이터: 팀·트러블슈팅·산출물·**피드백·회고·동료평가·교수 평가** (클라이언트 `ai-report.ts`와 동일). 번들 v2 SQL 미실행 시 해당 건수는 0.

## 요청

```json
{ "userId": "<ai_users.uuid>", "locale": "ko" }
```

## 로컬 테스트 (선택)

```bash
supabase functions serve generate-report --env-file supabase/.env.local
```

`supabase/.env.local` 예: `OPENAI_API_KEY=sk-...` (Git 커밋 금지)
