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
};
