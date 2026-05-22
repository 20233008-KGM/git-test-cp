# recommend-troubleshooting (Edge Function)

팀 상세 **트러블슈팅 로그** 맨 위 「AI 추천」 카드용. `generate-report`와 동일 Secret을 사용합니다.

## 배포

```bash
supabase functions deploy recommend-troubleshooting
```

`supabase/config.toml`에 `[functions.recommend-troubleshooting] verify_jwt = false` 필요.

## Secret

| Name | 설명 |
|------|------|
| `GEMINI_API_KEY` | Google AI API 키 (필수 — AI 추천) |
| `GEMINI_MODEL` | 선택, 기본 `gemini-2.5-flash` |

키가 없으면 **200** + `model: "draft-db-only"` (팀 DB 메타 기반 초안).

## 요청

`POST` body:

```json
{ "teamId": "team-...", "locale": "ko" }
```

## 응답

```json
{
  "problem": "...",
  "plan": "...",
  "rationale": "...",
  "generated_at": "2026-05-22T...",
  "model": "gemini-2.5-flash"
}
```

## 로컬

```bash
supabase functions serve recommend-troubleshooting --env-file supabase/.env.local
```

`supabase/.env.local` 예: `GEMINI_API_KEY=AIza...`
