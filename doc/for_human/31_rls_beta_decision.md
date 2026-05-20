# RLS Beta — 승인만 하면 되는 가이드 (H-001)

> **기술 상세:** [`rls_review_packet.md`](../for_agent/rls_review_packet.md) · **ADR:** `06_decision_log.md` ADR-012  
> **쉬운 보안:** [`19_security_basics.md`](./19_security_basics.md)

## 이게 뭔가요?

지금 DB는 **로그인한 사람이 아니어도** anon 키로 데이터를 읽고 쓸 수 있는 설정에 가깝습니다.  
앱 화면은 막지만, **키를 아는 사람이 직접 DB API를 호출하면** 다른 사람 데이터를 건드릴 수 있습니다.

**RLS(행 수준 보안)** 는 DB가 “이 수업 학생만”, “본인 글만 수정”처럼 **스스로 거르는** 기능입니다.

## AI가 권장하는 방향 (ADR-012)

**Firebase 로그인 + Supabase Third-Party Auth**  
→ 지금 쓰는 Firebase 계정을 유지하면서 Supabase JWT에 `firebase_uid`를 넣는 방식.

대안(전면 Supabase 로그인)은 마이그레이션 비용이 큽니다.

## 당신이 결정할 것 (3가지 중 하나)

| 선택 | 채팅에 이렇게 답하기 | 의미 |
|------|---------------------|------|
| **A. 승인** | 「RLS 적용 승인」 | Beta RLS 초안 SQL 검토·스테이징 적용 진행 |
| **B. 보류** | 「RLS 보류」 | Alpha 유지, 파일럿만 소규모 데이터 |
| **C. 질문** | 구체적 질문 | AI가 `rls_review_packet.md` 기준으로 답변 |

## 승인(A) 후 AI·개발자가 하는 일

1. Supabase **스테이징**에서 `20260519000000_rls_beta_draft.sql` 검토·수정  
2. Firebase ↔ Supabase JWT 연동 설정 (Third-Party Auth)  
3. 회귀 테스트 (E2E·수동)  
4. 문제 없으면 프로덕션 적용 — **별도 GO**

## 승인 전에도 해도 되는 일

- [29_supabase_bundle_sql.md](./29_supabase_bundle_sql.md) — 피드백·동료평가 테이블  
- [30_edge_ai_report.md](./30_edge_ai_report.md) — AI 리포트 (RLS와 무관)

## 승인하지 않아도 되는 경우

- 내부 데모만, 가짜 데이터만  
- 아직 실제 학생 개인정보를 넣지 않음  

→ 그래도 **「RLS 보류」**라고 알려 주시면 AI가 문서에 기록합니다.

## 승인 후 기술 연동

→ **[33_firebase_supabase_jwt_setup.md](./33_firebase_supabase_jwt_setup.md)** (JWT·RLS 적용 절차)

## 관련 H-001

`28_human_action_items.md` — 완료 시 「H-001 완료」 또는 「RLS 적용 승인」
