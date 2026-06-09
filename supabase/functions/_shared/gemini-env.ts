/** Supabase Edge Secret 이름 (Dashboard Custom secrets와 동일하게 유지) */
export const GEMINI_API_KEY_SECRET = "GEMINI_API_KEY";
export const GEMINI_MODEL_SECRET = "GEMINI_MODEL";
export const MEETING_SUMMARY_USE_GEMINI_SECRET = "MEETING_SUMMARY_USE_GEMINI";
export const AI_REPORT_USE_GEMINI_SECRET = "AI_REPORT_USE_GEMINI";
export const AI_PROGRESS_USE_GEMINI_SECRET = "AI_PROGRESS_USE_GEMINI";
export const AI_TROUBLESHOOT_USE_GEMINI_SECRET = "AI_TROUBLESHOOT_USE_GEMINI";
export const AI_DAILY_GEMINI_BUDGET_SECRET = "AI_DAILY_GEMINI_BUDGET";

export function readGeminiApiKey(): string | undefined {
  return Deno.env.get(GEMINI_API_KEY_SECRET)?.trim() || undefined;
}

export function readGeminiModelId(defaultModel: string): string {
  return Deno.env.get(GEMINI_MODEL_SECRET)?.trim() || defaultModel;
}

function readBooleanSecret(name: string, defaultValue = false): boolean {
  const raw = Deno.env.get(name)?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "true" || raw === "1" || raw === "yes";
}

/** 회의록 요약에만 Gemini 사용 */
export function meetingSummaryGeminiEnabled(): boolean {
  return readBooleanSecret(MEETING_SUMMARY_USE_GEMINI_SECRET, false);
}

/** 마이페이지 generate-report — 무료 티어 기본 off */
export function reportGeminiEnabled(): boolean {
  return readBooleanSecret(AI_REPORT_USE_GEMINI_SECRET, false);
}

/** 팀 progress-insight — 무료 티어 기본 off */
export function progressInsightGeminiEnabled(): boolean {
  return readBooleanSecret(AI_PROGRESS_USE_GEMINI_SECRET, false);
}

/** 트러블슈팅 추천 — 무료 티어 기본 off */
export function troubleshootGeminiEnabled(): boolean {
  return readBooleanSecret(AI_TROUBLESHOOT_USE_GEMINI_SECRET, false);
}

export function readDailyGeminiBudget(): number {
  const raw = Deno.env.get(AI_DAILY_GEMINI_BUDGET_SECRET)?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 120;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120;
}
