# 11 — API 명세

> **관련:** `src/app/api/supabase-api.ts` · `07_backend.md`  
> Supabase `ai_*` 테이블 facade. 화면은 `api.*` 만 호출합니다.  
> **마지막 갱신:** 2026-05-20

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
  aiReport: { gatherContext, buildDraftFromContext, generateReport },
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

## `aiReport.gatherContext` · `buildDraftFromContext`

- **gatherContext(userId)** — `AiReportContext`: 팀 스냅샷, `troubleshootingCases`, 산출물·피드백·회고·동료평가·교수 평가 **팀별 스니펫**. 테이블 없으면 0.
- **buildDraftFromContext(context)** — LLM 없이 A4용 `AiReportGenerateResponse` 초안 (`model: draft-db-only`)
- UI: `MyPage` 「DB 활동 미리보기 (A4)」·`data-testid=report-activity-summary` · `AiReportPrintView`
- 인간 확인: [37_verify_ai_report.md](../for_human/37_verify_ai_report.md)

## `aiReport.generateReport`

- **호출:** `supabase.functions.invoke('generate-report', { body })`
- **요청:** `AiReportGenerateRequest` — `userId`, `projectIds?`, `locale?`
- **응답:** `AiReportGenerateResponse` (summary, problems_solved, technologies, …)
- **현재:** `supabase/functions/generate-report/index.ts` — `OPENAI_API_KEY` 없으면 501 `NOT_IMPLEMENTED`; 배포는 H-002

## 미구현

- 기타 리소스 CRUD 일부
- Express `/api/v1/*`
- Edge Function **배포**·OPENAI (집계 로직은 `generate-report`에 구현됨 → H-002)

## 인증

- Firebase Auth → `auth.currentUser.uid` → `ai_users.firebase_uid` 매칭
