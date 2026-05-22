# 유지보수 가이드 — 프로젝트를 오래 쓰려면

> **관련:** `doc/for_agent/26_document_standards.md` · `doc/for_agent/23_agent_operating_rules.md`

## doit.md 유지보수 원칙

- 코드가 바뀌면 **관련 doc를 반드시** 같은 때 갱신
- 오래된 내용 방치 금지 · 문서와 실제 불일치 금지
- 문서 업데이트 = 개발의 일부 (AI에게 명시적으로 요청)

표준: `doc/for_agent/26_document_standards.md` · 구조·색인: `00_project_overview.md`

## 매주 (또는 작업 세션마다)

- [ ] `01_project_status.md` · `for_agent/02_current_state.md` 일치  
- [ ] `25_ai_work_log.md` — AI가 뭘 했는지 (**맨 위**·`YYYY-MM-DD HH:mm:ss`)  
- [ ] `29_vision_requests_report.md` — vision # 상세 · §대화창에서 요청한 내용 (`C-YYMMDD-N`, 맨 위 = 최신)  
  · 에이전트 정본: `for_agent/chat_request_recording.md`  
- [ ] `26_vision_features_status.md` — vision 기능 상태 요약  
- [ ] AI에게 작업 시키면 끝에 **doc 갱신** (`23` 체크리스트)  
- [ ] `05_todo.md` 완료 항목 체크  
- [ ] `28_human_action_items.md` — 사람이 할 일 (H-001~)

## 기능을 바꿀 때

| 바꾼 것 | 갱신할 문서 |
|---------|-------------|
| 새 페이지 | 06_folder_structure, 08_frontend (agent) |
| DB 테이블 | 09_database |
| 로그인 | 12_auth_system |
| 배포 | 13_deployment |
| 버그 | 15_common_mistakes, agent 15_known_issues |

## 새 AI 대화창을 열 때

1. `doc/starter.txt` 붙여넣기 또는 “doc/starter.txt 읽고 이어서 해줘”  
2. `doc/for_agent/17_handoff.md` 확인  

## 새 사람이 팀에 들어올 때

1. `doc/for_human/00_start_here.md`  
2. `04_project_intro.md`  
3. 코딩 담당은 `doc/for_agent/00_project_overview.md`  

## 버전 관리 (Git)

- `main`에 바로 force push 하지 않기  
- 큰 변경 전 브랜치 (AI·개발자)  
- 커밋은 **당신이 원할 때만** (규칙)

## 기술 부채 상환

`doc/for_agent/16_tech_debt.md` — facade 파일명·imports 정리 등을 **의도적으로** 잡기

## 서비스 종료 시

- Supabase/Firebase 프로젝트 삭제  
- 학생 데이터 백업·삭제 정책 (법적 요구)
