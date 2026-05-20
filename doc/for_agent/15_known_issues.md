# 15 — 알려진 이슈

> **관련:** `05_todo.md` · `22_security_notes.md`  
> **마지막 갱신:** 2026-05-20

| ID | 심각도 | 설명 | 상태 |
|----|--------|------|------|
| K-001 | ~~high~~ | ~~키 하드코딩~~ | **해결** — `VITE_*` + `.env` (T-003) |
| K-002 | ~~medium~~ | ~~팀 라우트 중복~~ | **해결** — 레거시 URL 리다이렉트 (T-004) |
| K-003 | ~~medium~~ | ~~전부 Mock~~ | **해결** — Supabase facade; CRUD 대부분 완료 |
| K-004 | low | `src/imports/` Figma 레거시 | open |
| K-005 | low | Express/Swagger 미구현 | open (의존성만) |
| K-006 | ~~low~~ | ~~README 불일치~~ | **해결** — `doc/README.md` 제거 |
| K-007 | ~~medium~~ | ~~Protected route 없음~~ | **해결** — `ProtectedRoute` (T-010) |
| K-008 | medium | RLS 정책 미검증 | T-011 |
| K-009 | ~~medium~~ | ~~`mock-data.ts` 파일명 혼동~~ | **해결** — `supabase-api.ts`로 rename (2026-05-19) |
| K-010 | ~~low~~ | ~~채팅 정적 조회만~~ | **해결** — DB 저장 + Realtime (2026-05-20) |
| K-011 | ~~low~~ | ~~Storage 미연동~~ | **해결** — T-021 |

## 재현 / 수정 예정

- K-008 → T-011, H-001

이슈 발견 시: ID 부여, 이 표 + `05_todo.md` 반영
