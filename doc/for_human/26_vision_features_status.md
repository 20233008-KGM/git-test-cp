# vision.md 기능 — 지금 어디까지 됐나요?

> **원본:** `vision.md` · **기술:** `doc/for_agent/27_vision_feature_matrix.md`  
> **갱신:** 2026-05-21

- ✅ 동작함 (코드·DB 준비 완료)
- 🔶 일부만 (인간 키·SQL·배포 대기)
- ❌ 없음

---

## 신규 추가요청사항 (vision #1~#48)

| 구간 | 상태 | 비고 |
|------|------|------|
| #1~#48 (코드) | ✅ | `29_vision_requests_report.md` 상세 |
| AI 문단 LLM | 🔶 | H-002 Edge 배포 |
| RLS 강화 | 🔶 | H-001 승인 후 |

**최근 (#47~#48):** 마이페이지 TDZ 수정 · 과거 수업 전용 페이지(`/app/mypage/archived-courses`)

---

## 1. 수강생 네트워크

| 기능 | 상태 | 설명 |
|------|------|------|
| 수강생 프로필 목록 | ✅ | Supabase |
| 기술 태그·프로필 저장 | ✅ | |
| 다른 사람 프로필 | ✅ | |
| 팀 채팅 | ✅ | DB + Realtime (선택 SQL) |

---

## 2. 팀플 워크스페이스

| 기능 | 상태 | 설명 |
|------|------|------|
| 팀 목록·상세·활동 | ✅ | |
| Q&A 질문·답변 | ✅ | CRUD |
| 트러블슈팅 | ✅ | 등록·수정·삭제 |
| 중간 결과물 업로드 | ✅ | Storage |
| 종료 수업 읽기 전용 | ✅ | archived |
| 팀 피드백·동료평가·회고록 | ✅ | 원격 시드·`verify:archived-kim` |
| 교수 평가·제출 현황 | ✅ | 교수 팀 상세·종료 수업 조회 페이지 |
| 교수 동료평가 전체 조회 | ✅ | `CoursePeerReviewsOverviewPage` (#45) |

---

## 3. 마이페이지

| 기능 | 상태 | 설명 |
|------|------|------|
| 팀·활동 DB 집계 | ✅ | 종료 팀플만 |
| 리포트 3페이지 | ✅ | DB 우선 |
| A4 미리보기·인쇄 | ✅ | |
| 과거 수업 (버튼→전용 페이지) | ✅ | vision #48 |
| AI 문단 자동 생성 | 🔶 | Edge deploy → H-002 |

---

## 철학 4줄

| 철학 | 상태 |
|------|------|
| 과정 > 결과 | ✅ 트러블슈팅 |
| 협업 기억 | ✅ DB 저장 |
| 사람 중심 | ✅ 네트워크 |
| 성장 데이터 | 🔶 리포트·LLM |

---

## 다음 (인간)

1. [36_launch_one_pager.md](./36_launch_one_pager.md) · [00_pre_launch_order.md](./00_pre_launch_order.md)  
2. H-011 `[o]` → `npm run human:verify`  
3. Edge [30](./30_edge_ai_report.md) · RLS [31](./31_rls_beta_decision.md)
