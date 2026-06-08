export type TeamProgressInsightRequest = {
  teamId: string;
  locale?: "ko" | "en";
  intent: "progress-insight";
};

export type TeamProgressInsightResponse = {
  summary: string;
  strengths: string[];
  gaps: string[];
  /** vision #132 — 앞으로 할 일 */
  next_steps: string[];
  /** vision #132 — 아키텍처·구조 리스크 */
  architecture_risks: string[];
  /** vision #132 — 개선 방향 */
  improvements: string[];
  generated_at: string;
  model: string;
  /** 이전 AI 기억 문서를 참고했는지 */
  used_memory?: boolean;
  /** 이번 호출에서 ZIP/소스를 새로 읽은 산출물 수 */
  new_deliverables_analyzed?: number;
  /** ZIP/파일에서 추출한 유효 소스 스니펫 수 */
  source_samples_count?: number;
  /** ZIP 전체 목록 스캔으로 README 존재 여부 (샘플에 README 본문이 없어도 true 가능) */
  detected_has_readme?: boolean;
  /** ZIP 해제·인벤토리 스캔 또는 소스 샘플 추출 성공 */
  zip_source_analyzed?: boolean;
  /** 문서·코드 전체 기반으로 파악한 프로젝트 개요 */
  project_content?: string;
  /** 프로젝트의 핵심 가치·목표 */
  project_value?: string;
};
