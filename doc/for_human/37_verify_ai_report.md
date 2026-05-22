# AI 리포트 집계 확인 — 3분

> **전제:** [29](./29_supabase_bundle_sql.md) 번들 v2 · [30](./30_edge_ai_report.md) Gemini Secret  
> **관련:** H-002

---

## 1. 학생 — 자동 AI 채움

| # | 동작 | 기대 |
|---|------|------|
| 1 | 로그인 → **마이페이지** | PAGE 01~03 로드 |
| 2 | 잠시 대기 | 「AI가 리포트 문단을 작성하는 중」 또는 완료 메시지 |
| 3 | PAGE 01 요약 문단 | AI/Gemini 문장 (또는 DB 초안 안내) |
| 4 | **집계:** 줄 | 트러블슈팅·산출물·피드백·회고·동료·교수평가 |
| 5 | PAGE 02 팀 카드 | 팀별 AI 본문 박스(있을 때) |
| 6 | **A4 인쇄 / PDF** | 인쇄 오버레이 |

- 「AI 리포트 생성 (베타)」버튼 **없음**

---

## 2. Gemini (H-002)

| # | 기대 |
|---|------|
| Secret Name | `GEMINI_API_KEY` |
| 메시지 | `리포트 문단을 AI로 채웠습니다. (gemini-2.5-flash)` |
| Secret 없음 | DB 초안 안내 (200, 레이아웃 동일) |

---

## 실패 시

| 증상 | 조치 |
|------|------|
| 401 / Missing authorization | [30](./30_edge_ai_report.md) §401 — `verify_jwt` 재배포 · Vercel `VITE_SUPABASE_ANON_KEY` |
| AI 문단 없음 | Secret Name `GEMINI_API_KEY` 확인 |
| 집계 0 | [29](./29_supabase_bundle_sql.md) · [38](./38_archived_kim_student_setup.md) |

완료: **「리포트 집계 OK」** 또는 이슈 알려주기
