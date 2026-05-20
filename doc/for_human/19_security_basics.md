# 보안 기초 — 꼭 알아둘 것

> **관련:** `doc/for_agent/22_security_notes.md` · `doc/for_human/28_human_action_items.md` (H-001)

## 1. 비밀번호

- Firebase에 저장 (우리 서버에 평문 저장 안 함)  
- 강한 비밀번호 권장  

## 2. API 키

| 키 종류 | 어디에 둘 수 있나 |
|---------|-------------------|
| Supabase anon | 프론트 (단, RLS 필수) |
| Supabase service role | **서버만**, 절대 Git |
| OpenAI | **서버만** |

프론트 키는 `.env`의 `VITE_*`로 분리됨. OpenAI 등은 **서버(Edge)만** (H-002).

## 3. RLS (Row Level Security)

DB가 “이 학생은 이 수업만 본다”고 스스로 거릅니다.  
설정 전에는 **민감한 실데이터 넣지 마세요**.

**승인만 하시면 됩니다:** [`31_rls_beta_decision.md`](./31_rls_beta_decision.md) (H-001)

## 4. HTTPS

배포 시 Vercel 등이 자동으로 HTTPS 제공합니다.

## 5. 학생 개인정보

- 학번, 연락처 등은 **최소 수집**  
- 약관·학교 규정 확인 (당신 + 법무)  

## 6. AI 데이터

프로젝트 내용을 OpenAI에 보낼 때 **개인정보·비밀 과제** 주의.

상세: `doc/for_agent/22_security_notes.md`
