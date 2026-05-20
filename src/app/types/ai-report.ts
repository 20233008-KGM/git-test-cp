/** AI 마이페이지 리포트 — Edge Function 요청/응답 (T-030) */

export interface AiReportGenerateRequest {
  /** Supabase ai_users.id (uuid) */
  userId: string;
  /** 집계할 archived / completed 프로젝트 id (선택) */
  projectIds?: string[];
  /** 출력 언어 */
  locale?: "ko" | "en";
}

export interface AiReportSection {
  title: string;
  body: string;
}

export interface AiReportGenerateResponse {
  summary: string;
  problems_solved: string[];
  technologies: string[];
  role_description: string;
  growth_reflection: string;
  sections?: AiReportSection[];
  generated_at: string;
  model?: string;
}

export interface AiReportNotReadyError {
  code: "NOT_IMPLEMENTED";
  message: string;
}

/** DB 집계 맥락 (LLM 입력·A4 템플릿용) */
export interface AiReportTeamSnapshot {
  teamId: string;
  teamName: string;
  projectTitle: string;
  courseName: string;
  memberRole: string;
  progress: number;
  troubleshootingCount: number;
  deliverableCount: number;
  sampleProblems: string[];
  /** 팀 피드백 제출 여부 (H-007 테이블) */
  feedbackSubmitted: boolean;
  /** 팀 피드백 요약 (선택지·자유입력) */
  feedbackSnippet?: string;
  /** 회고록 제출 여부 (H-009) */
  retrospectiveSubmitted: boolean;
  /** 회고록 본문 요약 (sections JSON, 최대 ~200자) */
  retrospectiveSnippet?: string;
  /** 본인이 제출한 동료평가 건수 (H-008) */
  peerReviewsSubmitted: number;
  /** 동료평가 요약 (키워드·코멘트) */
  peerReviewSnippet?: string;
  /** 교수 학생 평가 수신 여부 (H-010, student_row_id = ai_users.id) */
  professorStudentEvalReceived: boolean;
  /** 교수 프로젝트 평가 존재 여부 (팀 단위) */
  professorProjectEvalReceived: boolean;
  /** 교수 피드백 요약 (학생 코멘트·총체 평가 일부, 최대 ~120자) */
  professorFeedbackSnippet?: string;
}

/** 리포트 3페이지용 트러블슈팅 사례 (DB 로그 기반) */
export interface AiReportTroubleshootingCase {
  logId: string;
  teamId: string;
  teamName: string;
  projectTitle: string;
  courseName: string;
  title: string;
  problem: string;
  action: string;
  result: string;
  impact: string;
  status: string;
}

export interface AiReportContext {
  userId: string;
  userName: string;
  email: string;
  major?: string;
  skills: string[];
  generatedAt: string;
  teams: AiReportTeamSnapshot[];
  troubleshootingCases: AiReportTroubleshootingCase[];
  totalTroubleshootingLogs: number;
  totalDeliverables: number;
  totalFeedbacksSubmitted: number;
  totalRetrospectivesSubmitted: number;
  totalPeerReviewsSubmitted: number;
  /** 교수 학생 평가를 받은 팀 수 */
  totalProfessorStudentEvalsReceived: number;
  /** 교수 프로젝트 평가가 있는 팀 수 */
  totalProfessorProjectEvalsReceived: number;
}
