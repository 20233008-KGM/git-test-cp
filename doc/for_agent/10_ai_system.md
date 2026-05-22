# 10 — AI 시스템

> **관련:** `11_api_spec.md` · `07_backend.md` · `src/app/api/ai-report.ts` · `28_human_action_items.md`

## 목표 기능

1. 팀·트러블슈팅·산출물 집계 (DB)
2. 마이페이지 리포트 3페이지 + A4 HTML/인쇄
3. LLM 요약 문단 (Gemini, Edge)

## 현재 상태 (~75%, 2026-05-22)

| 구성 | 상태 |
|------|------|
| `api.aiReport.gatherContext` | ✅ 트러블슈팅·산출물·피드백·회고·동료평가·교수 평가 |
| `buildMyPageReportView` | ✅ DB 카드 + Edge/Gemini 문단을 마이페이지 박스에 병합 |
| `MyPage` 리포트 1–3페이지 | ✅ **진입 시** `generate-report` 자동 호출, 기존 레이아웃 유지 |
| `AiReportPrintView` | ✅ A4 `@page` — 「A4 인쇄 / PDF」 |
| `generate-report` Edge | ✅ Gemini `GEMINI_API_KEY` 우선 · 없으면 DB 초안 200 · `verify_jwt=false` |
| `recommend-troubleshooting` Edge | ✅ 팀 상세 AI 추천 카드 · 동일 Secret · `verify_jwt=false` |

## 권장 아키텍처

```
[MyPage 진입]
  → gatherContext (DB)
  → generate-report (Edge, Gemini Secret)
  → buildMyPageReportView → PAGE 1·2·3 박스 문장
  → (선택) A4 인쇄 오버레이
```

**금지:** 클라이언트에 `GEMINI_API_KEY` · `VITE_*`에 LLM 키

## 출력 스키마

`AiReportGenerateResponse` — `summary`, `problems_solved`, `technologies`, `role_description`, `growth_reflection`, `sections?`, `model`

## 인간 협업

→ `28` H-002 (Gemini Secret `GEMINI_API_KEY`, Edge deploy) · H-006 (법무/AI 정책)

## TODO

- [o] T-031 A4 템플릿
- [o] T-025 교수 계정 학생용 리포트 비노출
- [o] 트러블슈팅 AI 추천 — `recommend-troubleshooting` Edge + `TeamDetailPage` 자동 호출
- 팀 현황 LLM 요약 — 미구현
