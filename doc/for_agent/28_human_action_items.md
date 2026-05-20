# 28 — 인간 액션 아이템 (에이전트용)

> **관련:** `25_human_collaboration.md` · `22_security_notes.md` · `13_devops.md`  
> **인간이 읽는 정본:** `doc/for_human/28_human_action_items.md` (내용은 여기와 동기화)

## 목적

인간만 할 수 있는 작업(키, 승인, 법무, 배포 GO 등)을 **한곳**에 모아 둔다.  
블로커가 생겨도 **세션 전체를 멈추지 않고** 해당 TODO만 미루고, 이 파일에 기록한다.

## AI 행동 규칙

| 상황 | 행동 |
|------|------|
| 인간 전용 작업 필요 | `for_human/28_human_action_items.md` **미완료** 표에 행 추가 |
| 같은 세션 | **다른** AI 가능 작업 계속 (doc, UI, 테스트, 조사 등) |
| 채팅 | 새 **높음** 우선순위 항목이 생기면 한 줄 알림 가능 (세션 말미 요약 권장) |
| 완료 | 인간 “완료” 또는 검증 후 → **완료한 일** 표로 이동, `완료 시각` |
| 체크 기반 완료 | 미완료 표 `체크`가 `[o]`면 AI가 다음 세션에 「완료 확인 방법」 기준으로 동작 검증 후 완료 처리 |

## 세션 시작 시 — 인간 항목 확인 (필수)

`starter.txt` §0 [1단계] 직후 또는 착수 전:

1. `for_human/28_human_action_items.md` 를 연다.
2. **미완료** 표에서 `체크=[o]` 항목을 우선 점검한다.
3. `[o]` 항목은 「완료 확인 방법」으로 실제 검증 (`.env`, 사용자 메시지, CI, 화면/E2E 등)한다.
4. 검증 통과 시 완료 표로 이동, 실패 시 체크를 `[ ]`로 되돌리고 사유를 남긴다.
5. 여전히 미완료여도 **다른 작업 착수 가능**.

보조 커맨드(로컬): `npm run human:checked`  
→ `[o]` 체크된 H-항목과 검증 기준만 빠르게 추출

검증 커맨드(로컬): `npm run human:verify`  
→ `[o]` 체크된 H-항목에 대해 자동 검증 가능한 ID를 검사하고 `pass/fail/manual` 결과 출력

엄격 검증(로컬): `npm run human:verify:strict`  
→ 기본 검증 + H-003의 경우 스모크 테스트까지 포함한 검증 수행

JSON 출력: `npm run human:verify:json`  
→ 결과를 구조화(JSON)해서 로그/자동화에 재사용 가능

CI 게이트: `npm run human:verify:ci`  
→ strict + `--fail-on-manual` 적용, manual 항목도 실패 처리

반자동 동기화 preview: `npm run human:sync`  
→ `[o]` 항목의 이동/복귀/수동 대상 요약만 출력 (파일 미수정)

반자동 동기화 apply: `npm run human:sync:apply`  
→ 자동 검증 pass 항목 완료표 이동, fail 항목 체크 `[ ]` 복귀
→ `for_human/28_human_action_items.md`의 「자동 검증 메모」에 결과 누적

## 세션 종료 시 (필수)

`23_agent_operating_rules.md` 체크리스트에 포함:

- [ ] `28_human_action_items.md` — 신규 인간 항목 추가·완료 반영
- [ ] (해당 시) 채팅에 미완료 **높음** 항목 1~2줄 요약

## ID 규칙

- `H-001`, `H-002`, … 순번 증가
- 삭제하지 않고 완료 표로 이동

## 관련

- `25_human_collaboration.md` — 12가지 트리거·채팅 요청 형식(선택)
- `05_todo.md` — 개발 TODO (T-0xx)
- `17_handoff.md` — 기술 인수인계
