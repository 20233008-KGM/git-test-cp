# 10 — AI 시스템

> **관련:** `11_api_spec.md` · `07_backend.md` · `src/app/api/ai-report.ts` · `28_human_action_items.md`

## 목표 기능

1. 팀·트러블슈팅·산출물 집계 (DB)
2. 마이페이지 리포트 3페이지 + A4 HTML/인쇄
3. (선택) LLM 요약 문단

## 현재 상태 (~58%, 2026-05-20)

| 구성 | 상태 |
|------|------|
| `api.aiReport.gatherContext` | ✅ 트러블슈팅·산출물·피드백·회고·동료평가·교수 평가 (팀별 스니펫) |
| `buildDraftFromContext` | ✅ LLM 없이 A4 JSON |
| `MyPage` 리포트 1–3페이지 | ✅ DB 우선 + 미리보기 후 집계 한 줄 |
| `AiReportPrintView` | ✅ A4 `@page` |
| `generate-report` Edge | 🔶 클라이언트와 동일 집계·LLM 페이로드 (2026-05-21) — **배포만** H-002 |

## 권장 아키텍처

```
[MyPage] → gatherContext (클라이언트)
        → generate-report (Edge, LLM)
        → AiReportPrintView (인쇄)
```

**금지:** 클라이언트에 OpenAI 키

## 출력 스키마

`AiReportGenerateResponse` — `summary`, `problems_solved`, `technologies`, `role_description`, `growth_reflection`, `sections?`

## 인간 협업

→ `28` H-002 (OpenAI·Edge Secret) · H-006 (법무/AI 정책)

## TODO

- T-030 Edge LLM (`05_todo.md`)
- [o] T-031 A4 템플릿
