import { supabase } from "../supabase";
import type {
  TeamProgressInsightRequest,
  TeamProgressInsightResponse,
} from "../types/ai-team-progress";

const FUNCTION_NAME = "recommend-troubleshooting";

function edgeFunctionHeaders(): Record<string, string> | undefined {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || typeof key !== "string") return undefined;
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
  };
}

export type TeamProgressInsightView = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next_steps: string[];
  architecture_risks: string[];
  improvements: string[];
  model: string;
};

function parseStringList(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is string => typeof s === "string" && s.trim())
    .map((s) => s.trim())
    .slice(0, max);
}

function isDuplicateInsightLine(line: string, summary: string): boolean {
  const text = line.trim();
  if (!text || text.length < 10) return false;
  if (summary.includes(text)) return true;
  const probe = text.slice(0, Math.min(48, text.length));
  return probe.length >= 10 && summary.includes(probe);
}

/** vision #128 — summary와 bullet 중복 제거 */
export function normalizeProgressInsightForDisplay(
  insight: TeamProgressInsightView
): TeamProgressInsightView {
  const summary = insight.summary.trim();
  const filterDup = (items: string[]) =>
    items.map((s) => s.trim()).filter((s) => s && !isDuplicateInsightLine(s, summary));

  return {
    ...insight,
    summary,
    strengths: filterDup(insight.strengths),
    gaps: filterDup(insight.gaps),
    next_steps: filterDup(insight.next_steps),
    architecture_risks: filterDup(insight.architecture_risks),
    improvements: filterDup(insight.improvements),
  };
}

function extractEdgeError(data: unknown): string | null {
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return null;
}

function mapInsightPayload(payload: TeamProgressInsightResponse): TeamProgressInsightView {
  return normalizeProgressInsightForDisplay({
    summary: payload.summary.trim(),
    strengths: parseStringList(payload.strengths),
    gaps: parseStringList(payload.gaps),
    next_steps: parseStringList(payload.next_steps),
    architecture_risks: parseStringList(payload.architecture_risks),
    improvements: parseStringList(payload.improvements),
    model: payload.model ?? "unknown",
  });
}

export async function fetchTeamProgressInsightFromEdge(
  teamId: string,
  locale: "ko" | "en" = "ko"
): Promise<TeamProgressInsightView | null> {
  const body: TeamProgressInsightRequest = {
    teamId,
    locale,
    intent: "progress-insight",
  };

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body,
    headers: edgeFunctionHeaders(),
  });

  const bodyError = extractEdgeError(data);
  if (bodyError) {
    console.warn("[team-progress-insight]", bodyError);
    return null;
  }

  if (error) {
    console.warn("[team-progress-insight]", error.message);
    return null;
  }

  const payload = data as TeamProgressInsightResponse | null;
  if (!payload || typeof payload.summary !== "string") return null;

  return mapInsightPayload(payload);
}
