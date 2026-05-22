# AI 시스템 쉽게 이해하기

> **관련:** `doc/for_agent/10_ai_system.md` · `28_human_action_items.md` (H-002)

vision.md의 **마이페이지**: 팀 활동을 모아 **리포트**로 정리합니다.

## 지금 상태

| 단계 | 상태 |
|------|------|
| DB에서 활동 모으기 | ✅ `gatherAiReportContext` |
| 화면 3페이지 + A4 인쇄 | ✅ |
| AI가 문단 새로 쓰기 | ✅ Edge **Gemini** (`GEMINI_API_KEY`, H-002 완료) |

마이페이지에서 **「A4 인쇄 / PDF」** 로 확인할 수 있습니다. 리포트 문단은 로그인 후 **자동**으로 Edge가 채웁니다.

## 왜 서버를 거치나?

API 키는 **비밀번호**입니다. 브라우저 코드에 넣으면 유출됩니다 — Supabase Edge Secret만 사용.

## 문단이 안 나올 때

→ [30_edge_ai_report.md](./30_edge_ai_report.md) (Secret 이름·deploy·401)

기술: `doc/for_agent/10_ai_system.md` · `11_api_spec.md`
