import { supabase } from "../supabase";
import {
  appendMeetingSummaryLine,
  isLowQualityMeetingSummary,
  readMeetingTextFromFile,
  summarizeMeetingText,
} from "../utils/meetingMinutes";

const FUNCTION_NAME = "recommend-troubleshooting";

function edgeFunctionHeaders(): Record<string, string> | undefined {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || typeof key !== "string") return undefined;
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
  };
}

export async function summarizeMeetingDeliverableViaEdge(
  deliverableId: string,
  locale: "ko" | "en" = "ko",
): Promise<string> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { intent: "meeting-summary", deliverableId, locale },
    headers: edgeFunctionHeaders(),
  });

  if (error) {
    throw new Error(error.message ?? "회의록 요약 요청에 실패했습니다.");
  }

  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) {
      throw new Error(message);
    }
  }

  const summary =
    data && typeof data === "object" && "summary" in data
      ? (data as { summary?: unknown }).summary
      : null;

  if (typeof summary !== "string" || !summary.trim()) {
    throw new Error("회의록 요약 응답이 비어 있습니다.");
  }

  return summary.trim();
}

export async function persistMeetingSummaryForDeliverable(input: {
  deliverableId: string;
  fileName: string;
  file?: File;
  existingDescription?: string | null;
}): Promise<void> {
  let summary: string | null = null;

  if (input.file) {
    const text = await readMeetingTextFromFile(input.file);
    if (text) summary = summarizeMeetingText(text);
  }

  if (!summary) {
    summary = await summarizeMeetingDeliverableViaEdge(input.deliverableId);
  }

  if (isLowQualityMeetingSummary(input.fileName, summary)) {
    throw new Error("회의록 요약 품질이 충분하지 않습니다.");
  }

  const description = appendMeetingSummaryLine(
    input.existingDescription,
    input.fileName,
    summary,
  );
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("ai_team_deliverables")
    .update({ description, updated_at: now })
    .eq("id", input.deliverableId);

  if (error) throw error;
}
