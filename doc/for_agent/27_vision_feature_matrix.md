# 27 — vision.md 기능 추적 매트릭스

> **원본:** `vision.md` · **관련:** `02_current_state.md` · `for_human/26_vision_features_status.md`  
> **갱신:** 2026-05-20 코드·DB 대조

## 문제의식 → 플랫폼 (요약)

| vision 문제 | 대응 기능 | 문서 |
|---------------|-----------|------|
| 관계 형성 어려움 | 수강생 네트워크 | §1 |
| 피드백 비효율 | 워크스페이스·트러블슈팅·Q&A | §2 |
| 팀플 휘발성 | 히스토리·아카이브 | §2, §3 |
| 성장 이력 부재 | 마이페이지·AI 리포트 | §3 |

**데이터 열:** `Supabase` = `supabase-api.ts` · `—` = 미연동

---

## 1. 수강생 네트워크

| vision 기능 | 페이지/코드 | UI | 데이터 | 비고 |
|-------------|-------------|-----|--------|------|
| 전체 수강생 프로필 조회 | `StudentsNetworkPage` | ✅ | Supabase | |
| 기술 스택 태그 | 프로필·네트워크 | ✅ | Supabase | `saveProfile` |
| 상세 프로필 | `OtherStudentProfilePage` | ✅ | Supabase | |
| 1:1 채팅 | TeamDetail 모달 | ✅ | Supabase CRUD + Realtime | 팀 스코프; RLS T-011 |
| 내 정보 수정·저장 | 네트워크 모달 | ✅ | Supabase | |

**달성도:** UI ~80% · 읽기 ~55% · 쓰기 ~45%

---

## 2. 팀플 워크스페이스

| vision 기능 | 페이지/코드 | UI | 데이터 | 비고 |
|-------------|-------------|-----|--------|------|
| 중간 작업 결과 업로드 | TeamDetail | ✅ | Storage | `ai_team_deliverables` |
| 같은 수업 열람 | course scope | ✅ | Supabase | RLS 검증 필요 |
| 작업 히스토리 | Teams | ✅ | Supabase | `ai_team_activities` |
| 트러블슈팅 CRUD | TeamDetail | ✅ | CRUD | |
| Q&A CRUD | QnA pages | ✅ | CRUD | `answers` jsonb |
| 종료 수업 | `CoursesPage` filter | ✅ | archived | 읽기 전용 배너 |
| 팀 피드백 제출 | TeamDetail | ✅ | Supabase | `ai_team_detail_feedbacks` (H-007) |
| 동료평가 제출 | TeamDetail 모달 | ✅ | Supabase | `ai_team_detail_peer_reviews` (H-008) |
| 회고록 작성 | TeamDetail 모달 | ✅ | Supabase | `ai_team_detail_retrospectives` (H-009) |
| 교수 작업물·평가 | TeamDetail (교수) | ✅ | Supabase | 산출물·제출 현황·평가 DB (H-010) |

**달성도:** UI ~70% · 읽기 ~55% · 쓰기 ~50%

---

## 3. 마이페이지

| vision 기능 | 페이지/코드 | UI | 데이터 | AI |
|-------------|-------------|-----|--------|-----|
| 종료·진행 프로젝트 표시 | `MyPage` | ✅ | Supabase | 팀 집계·시드 |
| 리포트 3페이지 | `MyPage` | ✅ | `gatherContext` | DB |
| A4 인쇄 | `AiReportPrintView` | ✅ | draft | LLM ❌ |
| AI 문단 생성 | MyPage 버튼 | 🔶 | Edge=클라 집계 | deploy·H-002 |
| 교수 평가 → 리포트 | `gatherContext` | ✅ | 번들 v2 | 스니펫·건수 |

**달성도:** UI ~75% · 읽기 ~60% · AI ~60% (DB+Edge 코드, deploy 대기)

---

## 철학 4가지 — 구현 체크

| 철학 | 구현 방향 | 현재 |
|------|-----------|------|
| 과정 > 결과 | 트러블슈팅 | CRUD ✅ |
| 협업 기억 | DB 영구 저장 | ✅, RLS 강화 중 |
| 사람 중심 | 네트워크 | ✅ |
| 성장 데이터 | 리포트 | DB ✅, LLM 🔶 |

---

## 갱신 규칙

기능 완료 시: 표 갱신 → `02` · `05` · `for_human/26_vision_features_status.md`
