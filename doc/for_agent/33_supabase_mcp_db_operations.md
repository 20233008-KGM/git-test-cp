# 33 — Supabase DB·Storage (MCP 자동 적용)

> **정본:** 이 문서 · **관련:** `09_database.md` · `28_human_action_items.md` · `starter.txt` §0  
> **마지막 갱신:** 2026-05-25

## 원칙 (필수)

| 대상 | 규칙 |
|------|------|
| **AI** | 스키마·Storage·RLS·밀린 `supabase/migrations/*.sql`는 **Supabase MCP**로 원격에 적용한다. 인간에게 SQL Editor·`apply_remote_full` 붙여넣기를 **요청하지 않는다**. |
| **인간** | Cursor에서 **Supabase MCP 연결**만 유지하면 된다. DDL·버킷·컬럼 추가는 **손대지 않는다**. |
| **H-xxx** | 일반 DB 마이그레이션용 H-ID를 **새로 만들지 않는다** (예: 구 H-012 삭제됨). RLS 승인(H-001)·시크릿(H-004) 등 **결정·키**만 인간 항목. |

`npm run supabase:apply-remote-full`은 **로컬에 `supabase/apply_remote_full.sql` 파일을 생성**할 뿐, 원격 적용은 하지 않는다. 원격 반영은 MCP가 담당한다.

---

## AI — 세션 중 DB 이슈 발견 시

1. **증상** — 앱 오류·`list_migrations`·`information_schema`·Storage 버킷 목록으로 원인 확인.
2. **정본 SQL** — `supabase/migrations/<timestamp>_<name>.sql` (이미 있으면 그대로, 없으면 마이그레이션 파일 추가 후 MCP 적용).
3. **적용** — MCP `apply_migration` (`name`: snake_case, `query`: 파일 전문).
4. **검증** — MCP `execute_sql`로 컬럼·테이블·`storage.buckets` 존재 확인.
5. **기록** — `25_ai_work_log.md` 맨 위 한 줄 · 영향 vision `#N`이면 `29` §상세 갱신.
6. **금지** — `28` 미완료에 「SQL 실행해 주세요」류 H-항목 추가.

### MCP 도구

| 도구 | 용도 |
|------|------|
| `apply_migration` | DDL·Storage bucket·RLS·정책 (원격 마이그레이션 이력에 남음) |
| `execute_sql` | 적용 후 검증·조회 (DDL은 가능하면 `apply_migration`) |
| `list_migrations` | 원격에 이미 적용된 이름 확인 |

### 적용 순서

- FK·컬럼 추가 → 의존 테이블·버킷 → Storage 정책 → 데이터 백필(`UPDATE`).
- 여러 파일이 있으면 **타임스탬프 순**으로 한 건씩 `apply_migration`.

### 인간에게 맡기는 DB 예외

- **H-001** RLS Beta **승인/보류** 결정 (정책 초안 적용은 승인 후 MCP).
- 프로덕션 **파괴적** DDL(대량 삭제·컬럼 DROP) — 사용자 명시 요청 없으면 금지.
- Supabase **결제·프로젝트 생성**·service role 키 발급.

---

## 인간 — 할 일 / 하지 않을 일

| ✅ 유지 | ❌ 불필요 |
|---------|-----------|
| Cursor Supabase MCP 연결 | SQL Editor에 마이그레이션 붙여넣기 |
| 기능 확인(산출물 등록·강의자료 업로드 등) | `npm run supabase:apply-remote-full` 후 Run |
| 「RLS 승인」「H-004 완료」 등 **결정·키** 알림 | 밀린 migration 목록 수동 적용 |

DB 관련 버그 리포트 시: **화면·오류 문구**만 전달하면 되고, AI가 MCP로 스키마를 맞춘다.

---

## 앱 오류 문구

Storage·테이블 누락 시 `supabase-api.ts`는 **「Supabase에 마이그레이션을 적용해 주세요」** 수준만 안내한다 (H-xxx·npm 스크립트명 노출 금지).

---

## 관련 파일

| 경로 | 역할 |
|------|------|
| `supabase/migrations/*.sql` | 마이그레이션 정본 |
| `supabase/apply_remote_full.sql` | 번들 SQL **생성 결과물** (MCP 대체 아님) |
| `scripts/build-apply-remote-full.mjs` | 위 파일 빌드 |
