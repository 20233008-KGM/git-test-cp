/** POST recommend-troubleshooting Edge 요청 */
export type AiTroubleshootingRecommendRequest = {
  teamId: string;
  locale?: "ko" | "en";
};

/** 팀 상세 AI 추천 카드 응답 */
export type AiTroubleshootingRecommendResponse = {
  problem: string;
  plan: string;
  rationale?: string;
  generated_at: string;
  model: string;
};
