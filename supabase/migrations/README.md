# Supabase 마이그레이션 (CampusConnect)

> **원격 적용:** 인간이 Supabase SQL Editor에서 실행 · **RLS Beta 강화는 H-001 승인 후**

## 빠른 실행 (권장)

| 목적 | 파일 | 인간 항목 |
|------|------|-----------|
| **팀 상세 쓰기 전체 (권장)** | `20260520102000_team_detail_writes_bundle_v2.sql` | H-007~010 |
| 피드백 + 동료평가 (v1) | `20260520095400_team_detail_writes_bundle.sql` | H-007·H-008 |

## 개별 파일

| 파일 | 내용 | 28 ID |
|------|------|-------|
| `20260519000000_rls_beta_draft.sql` | RLS Beta 스케치 (주석) | H-001 |
| `20260520094500_ai_team_detail_feedbacks.sql` | 팀 피드백 | H-007 |
| `20260520094800_ai_team_detail_peer_reviews.sql` | 동료평가 | H-008 |
| `20260520101000_ai_team_detail_retrospectives.sql` | 회고록 | H-009 |
| `20260520101500_ai_team_detail_professor_evals.sql` | 교수 평가 | H-010 |

## Edge Functions

→ `../functions/generate-report/README.md` (H-002)

## Realtime (선택)

| 파일 | 내용 |
|------|------|
| `20260520100300_realtime_chat.sql` | 채팅 INSERT 실시간 반영 |

## 적용 후 확인

1. 팀 상세 → 피드백 「완료」 → 새로고침 유지  
2. 팀 상세 → 동료평가 「등록 완료」 → 새로고침 유지  
2b. 팀 상세 → 회고록 「완료」 → 버튼이 「회고록 수정」으로 변경  
3. (선택) 채팅: 두 브라우저에서 메시지 즉시 표시  
4. (선택) Table Editor에서 `ai_team_detail_*` 행 확인
