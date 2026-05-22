import { supabase } from "../supabase";
import type {
  AiTroubleshootingRecommendRequest,
  AiTroubleshootingRecommendResponse,
} from "../types/ai-troubleshooting";

const FUNCTION_NAME = "recommend-troubleshooting";

function edgeFunctionHeaders(): Record<string, string> | undefined {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || typeof key !== "string") return undefined;
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
  };
}

function extractEdgeError(
  data: unknown,
  fallback: string
): string | null {
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return null;
}

/**
 * POST /functions/v1/recommend-troubleshooting
 */
export async function recommendTroubleshootingFromEdge(
  request: AiTroubleshootingRecommendRequest
): Promise<AiTroubleshootingRecommendResponse> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: request,
    headers: edgeFunctionHeaders(),
  });

  const bodyError = extractEdgeError(data, "");
  if (bodyError) {
    throw new Error(bodyError);
  }

  if (error) {
    const message = error.message ?? "AI 추천 요청에 실패했습니다.";
    const lower = message.toLowerCase();
    if (
      lower.includes("404") ||
      lower.includes("not found") ||
      lower.includes("failed to send a request to the edge function")
    ) {
      throw new Error(
        "recommend-troubleshooting Edge에 연결할 수 없습니다. `supabase functions deploy recommend-troubleshooting` 후 새로고침하세요."
      );
    }
    throw new Error(message);
  }

  const payload = data as AiTroubleshootingRecommendResponse | null;

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.problem !== "string" ||
    typeof payload.plan !== "string"
  ) {
    throw new Error("AI 추천 응답 형식이 올바르지 않습니다.");
  }

  const rationale =
    typeof payload.rationale === "string" && payload.rationale.startsWith("DB 초안")
      ? undefined
      : payload.rationale;

  return { ...payload, rationale };
}
