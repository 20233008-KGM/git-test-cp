import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { readDailyGeminiBudget } from "./gemini-env.ts";

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Gemini generateContent 호출 전 일일 예산 1건 예약 */
export async function tryReserveGeminiCall(
  supabase: SupabaseClient
): Promise<{ allowed: boolean; reason?: string }> {
  const budget = readDailyGeminiBudget();
  const usageDate = todayUtcDate();

  const { data, error } = await supabase
    .from("ai_gemini_usage_daily")
    .select("call_count")
    .eq("usage_date", usageDate)
    .maybeSingle();

  if (error) {
    console.warn("[gemini-budget] usage read failed — allow call", error.message);
    return { allowed: true };
  }

  const current = Number(data?.call_count ?? 0);
  if (current >= budget) {
    return { allowed: false, reason: "daily_budget_exceeded" };
  }

  const { error: upsertError } = await supabase.from("ai_gemini_usage_daily").upsert(
    {
      usage_date: usageDate,
      call_count: current + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "usage_date" }
  );

  if (upsertError) {
    console.warn("[gemini-budget] usage write failed — allow call", upsertError.message);
    return { allowed: true };
  }

  return { allowed: true };
}

export function isGeminiQuotaError(status: number, message: string): boolean {
  if (status === 429 || status === 402) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource exhausted")
  );
}
