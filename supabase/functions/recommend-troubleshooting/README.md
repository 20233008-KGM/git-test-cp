# recommend-troubleshooting (Edge Function)

팀 상세 **트러블슈팅 AI 추천** + **AI 통합 진행상황 요약**. `generate-report`와 동일 Secret.

## 배포

```bash
supabase functions deploy recommend-troubleshooting
```

`supabase/config.toml`에 `[functions.recommend-troubleshooting] verify_jwt = false` 필요.

## intent

| intent | 용도 | 클라이언트 |
|--------|------|------------|
| (생략) `troubleshooting` | 다음 조사할 문제 제안 | `ai-troubleshooting.ts` |
| `progress-insight` | 진행 요약·기억 저장 | `ai-team-progress.ts` |
| `meeting-summary` | 회의록 PDF/문서 1~2문장 요약 | `ai-meeting-minutes.ts` |

### progress-insight

- 산출물·트러블슈팅·채팅 수집
- **신규** 산출물만 ZIP/소스 추출 (증분) + **최신 ZIP 2건**은 매번 재해제
- 표시 제목에 `.zip`이 없어도 Storage 경로·MIME으로 ZIP 인식
- JSZip (`npm:jszip@3.10.1`), `node_modules`·`.git` 제외, `.ts`/`.tsx` 우선 스캔
- `ai_team_detail_ai_memory`에 마크다운 + `analyzed_deliverable_ids` 저장
- Gemini 없으면 `heuristic-insight` (코드 신호 기반)

## Secret

| Name | 설명 |
|------|------|
| `GEMINI_API_KEY` | Google AI Studio API 키 (결제 미연결 권장) |
| `GEMINI_MODEL` | 선택, 기본 `gemini-2.5-flash` |
| `MEETING_SUMMARY_USE_GEMINI` | `true`일 때만 회의록 요약에 Gemini 사용 |
| `AI_REPORT_USE_GEMINI` | `true`일 때만 `generate-report`에 Gemini (기본 off) |
| `AI_PROGRESS_USE_GEMINI` | `true`일 때만 progress-insight에 Gemini (기본 off) |
| `AI_TROUBLESHOOT_USE_GEMINI` | `true`일 때만 troubleshooting에 Gemini (기본 off) |
| `AI_DAILY_GEMINI_BUDGET` | 일일 호출 상한 (기본 `120`) |

키 없음: troubleshooting → `draft-db-only` 200 · progress-insight → `heuristic-insight` 200 · meeting-summary → 휴리스틱 폴백

회의록: Gemini 한도 초과(429 등) 시 **재시도 없이** 휴리스틱으로 폴백

## 요청 (troubleshooting)

```json
{ "teamId": "team-...", "locale": "ko" }
```

## 요청 (progress-insight)

```json
{ "teamId": "team-...", "locale": "ko", "intent": "progress-insight" }
```

## 응답 (troubleshooting)

```json
{
  "problem": "...",
  "plan": "...",
  "rationale": "...",
  "generated_at": "2026-05-22T...",
  "model": "gemini-2.5-flash"
}
```

## 응답 (progress-insight)

`summary`, `strengths`, `gaps`, `next_steps`, `architecture_risks`, `improvements`, `model`, `used_memory?`, `new_deliverables_analyzed?`, `source_samples_count?`

## 로컬

```bash
supabase functions serve recommend-troubleshooting --env-file supabase/.env.local
```

인간용 전체 설명: `doc/for_human/11_ai_system_explained.md`
