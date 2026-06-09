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

/** AI가 생성한 프로젝트별 상세 분석 */
export interface AiReportPerProject {
  /** 매칭용 — AI가 입력 데이터의 teamId를 그대로 에코 */
  team_id?: string;
  project_title: string;
  /** 프로젝트 개요 (수업·팀·목표 한두 문장) */
  overview: string;
  /** 이 프로젝트가 주는 핵심 가치 */
  core_value: string;
  /** 본인이 한 경험 (역할·구체적 기여) */
  my_experience: string;
  /** 동료·교수 평가 요약 */
  eval_summary: string;
}

export interface AiReportGenerateResponse {
  summary: string;
  problems_solved: string[];
  technologies: string[];
  role_description: string;
  growth_reflection: string;
  sections?: AiReportSection[];
  /** 프로젝트별 상세 분석 (AI 생성) */
  per_project?: AiReportPerProject[];
  /** 어떤 문제를 주로 발굴·기획했는지 패턴 분석 */
  problem_discovery_pattern?: string;
  /** 주로 어떤 방식으로 문제를 해결해왔는지 */
  resolution_style?: string;
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
  /** 팀 산출물 파일명 (A4 팀 섹션용, 최대 5건) */
  deliverableFileNames: string[];
  /** 회의록 요약 (파일명 - 핵심, 업로드 시 자동 생성) */
  meetingSummaries: string[];
  /** 요약 대기 중인 회의록 파일명 */
  pendingMeetingFileNames: string[];
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
  /** 팀원들이 나에게 남긴 동료평가 키워드 집계 */
  peerReviewsReceived: { text: string; count: number }[];
  /** 수신 동료평가 요약 */
  peerReviewReceivedSnippet?: string;
  /** 교수 학생 평가 수신 여부 (H-010, student_row_id = ai_users.id) */
  professorStudentEvalReceived: boolean;
  /** 교수 프로젝트 평가 존재 여부 (팀 단위) */
  professorProjectEvalReceived: boolean;
  /** 교수 피드백 요약 (학생 코멘트·총체 평가 일부, 최대 ~120자) */
  professorFeedbackSnippet?: string;
  /** AI가 산출물·트러블슈팅 분석 후 추출한 프로젝트 핵심 가치 */
  projectValue?: string;
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
  /** 팀 산출물 파일명 (기술·역량 초안용) */
  deliverableFileNames: string[];
  /** ai_user_ai_context.report_excerpt (Compaction Agent) */
  userContextExcerpt?: string;
  /** ai_user_ai_context.context_markdown 전체 */
  userContextMarkdown?: string;
}
