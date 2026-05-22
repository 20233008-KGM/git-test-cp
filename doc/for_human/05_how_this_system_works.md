# 이 시스템은 어떻게 동작하나요?

> **관련:** `doc/for_human/17_full_data_flow.md` · `doc/for_agent/01_architecture.md`

## 비유: 학교 게시판 + 개인 수첩 + 로그인 출입증

- **게시판** = 수업·팀·Q&A 화면  
- **수첩** = 마이페이지  
- **출입증** = Firebase 로그인  
- **창고** = Supabase (수업·팀·질문 등 **이미 여기서 읽어 옴**)  

## 사용자가 버튼을 누르면

```
당신(브라우저)
    → React 화면이 바뀜
    → api/supabase-api.ts (Supabase 중간 다리)
    → ai_courses, ai_teams, ai_questions …
    → 화면에 팀 카드, 프로필 등 표시
```

**아직 안 되는 것:** RLS 최종 적용 (H-001)

**이미 됨:** 팀 채팅(Realtime) · 마이페이지 AI 문단(Gemini Edge, H-002) · 프로덕션 배포(H-005)

## 로그인할 때

```
이메일·비밀번호 → Firebase 확인
    → Supabase ai_users (firebase_uid로 연결)
    → AuthContext에 프로필 전달
    → /app 은 로그인 없으면 차단
```

## 역할 세 가지

| 역할 | 할 수 있는 일 (목표) |
|------|----------------------|
| student | 팀 참여, 업로드, Q&A, 네트워크 |
| professor | 수업·팀 전체 보기, 피드백 |
| admin | 시스템 관리 |

## supabase-api.ts

화면과 Supabase 창고 사이의 **중간 다리**입니다.

## 다음에 할 일

글쓰기·수정 UI, 파일 업로드, RLS 점검 → `01_project_status.md`

더 깊은 흐름: **17_full_data_flow.md**
