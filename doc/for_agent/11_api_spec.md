# 11 — API 명세

> **관련:** `src/app/api/supabase-api.ts` · `07_backend.md`  
> Supabase `ai_*` 테이블 facade. 화면은 `api.*` 만 호출합니다.  
> **마지막 갱신:** 2026-05-22

## `api` 객체 (실제 export)

```ts
export const api = {
  navigation: { getPrimaryCourseId, getTeamCourseId },
  auth: { getPageSummary },
  courses: { getAll, getById, create, archive },
  memberships: { joinByCode },
  students: { getAll, getById },
  professors: { getById },
  teamCards: { getAll },
  teams: { saveRandomAssignment },
  teamStages: { getAll, getByCourse },
  announcements: { getAll },
  studentNetwork: { getStudents, getExtras, getTeamKeywords, getEditForm, saveProfile },
  myPage: {
    getProjects, getProjectsForUser, getProfile,
    getSideNavItems, getReportStats, getReportHeader,
  },
  teamDetail: {
    getFeedbackOptions, getMyFeedback, submitFeedback,
    getRetrospectiveDraft, submitRetrospective,
    getProfessorStudentEvals, saveProfessorStudentEval,
    getProfessorProjectEval, saveProfessorProjectEval,
    getTeamSubmissionFeedbacks, getTeamSubmissionRetrospectives, getTeamSubmissionPeerReviews,
    getChatMessages, sendChatMessage,
    getPeerReviewStudents, getMyPeerReviews, submitPeerReview,
    getReviewKeywords, getTeammates,
    getTroubleshootingLogs, createTroubleshootingLog,
    updateTroubleshootingLog, deleteTroubleshootingLog, resolveTroubleshootingLog,
    getDeliverables, uploadDeliverable, deleteDeliverable,
  },
  projects: { getAll },
  questions: {
    getAll, getById, create, update, delete,
    createAnswer, updateAnswer, deleteAnswer, acceptAnswer,
  },
  aiReport: {
    gatherContext, buildDraftFromContext, buildMyPageReportView,
    generateReport, mapToMyPageProjects, formatActivitySummary,
  },
};
```

## `teamDetail` 쓰기 (2026-05-20)

| 메서드 | 테이블 | 비고 |
|--------|--------|------|
| `sendChatMessage` | `ai_team_detail_chat_messages` | Realtime INSERT |
| `submitFeedback` | `ai_team_detail_feedbacks` | H-007 SQL 필요 |
| `getRetrospectiveDraft` / `submitRetrospective` | `ai_team_detail_retrospectives` | H-009 / 번들 v2 |
| `getProfessorStudentEvals` / `saveProfessorStudentEval` | `ai_team_detail_professor_student_evals` | H-010 / 번들 v2 |
| `getProfessorProjectEval` / `saveProfessorProjectEval` | `ai_team_detail_professor_project_evals` | H-010 / 번들 v2 |
| `getTeamSubmissionFeedbacks` / `getTeamSubmissionRetrospectives` / `getTeamSubmissionPeerReviews` | 팀 제출 조회 | 교수·admin |
| `submitPeerReview` | `ai_team_detail_peer_reviews` | H-008 SQL 필요 |
| `createTroubleshootingLog` 등 | `ai_team_detail_troubleshooting_logs` | |
| `uploadDeliverable` | Storage + `ai_team_deliverables` | |

## `questions.create`

- 입력: `title`, `content`, `courseId?`, `tags?`
- 권한: `getAccessibleCourseIds()` 포함 수업만
- INSERT → `ai_questions`

## 데이터 소스

| 네임스페이스 | Supabase 테이블 (예) |
|--------------|----------------------|
| courses | `ai_courses`, `ai_course_stages`, `ai_course_memberships` |
| teamCards | `ai_teams`, `ai_team_members`, `ai_team_activities` |
| questions | `ai_questions` |
| studentNetwork | `ai_users`, `ai_user_learning_profiles`, … |
| teamDetail | `ai_team_detail_*`, `ai_team_deliverables`, Storage bucket |
| myPage | `ai_my_page_*` |

## `questions` 답변

- `answers` jsonb 배열에 저장 (별도 테이블 없음)
- `createAnswer` / `updateAnswer` / `deleteAnswer` / `acceptAnswer` (질문 작성자만 채택)

## `aiReport` (2026-05-22)

- **gatherContext(userId)** — `AiReportContext` (팀·트러블슈팅·평가 스니펫)
- **generateReport** — Edge `generate-report` (Gemini `GEMINI_API_KEY` 우선)
- **buildMyPageReportView(context, report?)** — PAGE 1·2·3 **박스 문장**에 LLM/초안 병합 (숫자 카드는 DB)
- **buildDraftFromContext** — Edge 실패 시 로컬·서버 DB 초안
- **mapToMyPageProjects** · **formatActivitySummary** 등

### MyPage UX

- 학생 리포트 섹션: `gatherContext` 후 **자동** `generateReport` (수동 새로고침 버튼 없음)
- **A4 용지** (`mypage-a4-report-sheet`, 210×297mm) + 툴바 **A4 인쇄 / PDF** (용지 밖)
- `data-testid`: `mypage-summary-paragraph`, `ai-report-message`, `mypage-a4-print-button`, `report-activity-summary`

### Edge `generate-report`

- Secret: `GEMINI_API_KEY` (Name 정확히) · 선택 `GEMINI_MODEL`
- `supabase/config.toml` → `[functions.generate-report] verify_jwt = false`
- 없으면 200 + `draft-db-only` (DB 초안)

- 인간 확인: [37_verify_ai_report.md](../for_human/37_verify_ai_report.md) · [30_edge_ai_report.md](../for_human/30_edge_ai_report.md)

## 미구현

- 기타 리소스 CRUD 일부
- Express `/api/v1/*`
- **recommendTroubleshootingAi** — Edge `recommend-troubleshooting` (`teamId`, Gemini)

## 인증

- Firebase Auth → `auth.currentUser.uid` → `ai_users.firebase_uid` 매칭
