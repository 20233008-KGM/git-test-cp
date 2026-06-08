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
  used_memory?: boolean;
  new_deliverables_analyzed?: number;
  source_samples_count?: number;
  detected_has_readme?: boolean;
  zip_source_analyzed?: boolean;
  project_content?: string;
  project_value?: string;
};

function parseStringList(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is string => typeof s === "string" && s.trim())
    .map((s) => s.trim())
    .slice(0, max);
}

const STACK_TOPIC_RE =
  /react|typescript|vite|supabase|firebase|next\.?js|스택으로|기반으로|진입 파일/i;

function stripSentenceEnding(text: string): string {
  return text.replace(/[.!?。…]+\s*$/u, "").trim();
}

function isDuplicateInsightLine(line: string, summary: string): boolean {
  const text = line.trim();
  if (!text || text.length < 8) return false;
  if (summary.includes(text)) return true;
  const probe = text.slice(0, Math.min(40, text.length));
  if (probe.length >= 10 && summary.includes(probe)) return true;
  if (STACK_TOPIC_RE.test(text) && STACK_TOPIC_RE.test(summary)) return true;
  if (/스택으로 보이|기반으로 보이|업로드된 소스 기준/.test(text) && STACK_TOPIC_RE.test(summary)) {
    return true;
  }
  if (/배포·데모 URL|데모 URL/.test(text) && /배포|데모|URL/.test(summary)) return true;
  return false;
}

/** 건수·읽음 메타만 나열한 얕은 요약(구 Edge/Gemini) 감지 */
export function isShallowProgressInsight(insight: {
  summary: string;
  strengths?: string[];
}): boolean {
  const summary = insight.summary.trim();
  if (!summary) return true;

  const countOnlySummary =
    /^(팀 활동 요약:|산출물 \d+건)/.test(summary) &&
    (/소스 샘플 \d+건/.test(summary) || /트러블슈팅 해결 \d+건/.test(summary)) &&
    summary.length < 200 &&
    !/(react|next|vite|supabase|typescript|python|readme|api|컴포넌트|구조|스택)/i.test(summary);

  const strengths = insight.strengths ?? [];
  const strengthsOnlyMeta =
    strengths.length > 0 &&
    strengths.every(
      (s) =>
        /(\d+건|제출됨|분석됨|샘플|읽음)/.test(s) &&
        s.length < 56 &&
        !/(react|next|vite|supabase|readme|api|ui|테스트|zip)/i.test(s)
    );

  return countOnlySummary || (strengthsOnlyMeta && strengths.length <= 3);
}

/** 클라이언트 DB 폴백 — ZIP/README를 읽지 못하는 메타 수준 요약 */
export function isClientMetadataFallbackInsight(insight: {
  model?: string;
  summary?: string;
  next_steps?: string[];
}): boolean {
  if (insight.model === "draft-db-insight") return true;
  const blob = `${insight.summary ?? ""} ${(insight.next_steps ?? []).join(" ")}`;
  return (
    /ZIP에 src·package\.json·README/.test(blob) ||
    /프로젝트 압축본「\.」/.test(blob) ||
    (/트러블슈팅 기록이 없어 협업·디버깅/.test(blob) &&
      /프로젝트 압축본/.test(blob) &&
      !/(react|vite|supabase|readme에|README\(|스택|구조가 확인)/i.test(blob))
  );
}

/** Edge ZIP·README·문서(PDF/PPTX/DOCX) 분석 결과가 있으면 DB 폴백보다 Edge를 쓸지 */
export function shouldPreferEdgeProgressInsight(
  edge: TeamProgressInsightView | null,
  hasArchiveDeliverable: boolean
): boolean {
  if (!edge?.summary?.trim() || edge.model === "draft-db-only") return false;
  if (isShallowProgressInsight(edge)) return false;
  if (!hasArchiveDeliverable) return true;
  return (
    (edge.source_samples_count ?? 0) > 0 ||
    edge.detected_has_readme === true ||
    edge.zip_source_analyzed === true ||
    (edge.new_deliverables_analyzed ?? 0) > 0
  );
}

function suggestsMissingReadme(line: string): boolean {
  return (
    /readme.*(없|부재|미작|미비|추가|작성|정리|제출)|실행\s*가이드.*없|실행\s*방법.*(없|정리하세요)|온보딩.*없/i.test(
      line
    ) || /ZIP에 src·package\.json·README/i.test(line)
  );
}

/** vision #128 — summary와 bullet 중복 제거 · UI용 분량 축소 */
export function normalizeProgressInsightForDisplay(
  insight: TeamProgressInsightView,
  opts?: { detectedHasReadme?: boolean }
): TeamProgressInsightView {
  let summary = insight.summary.trim();
  summary = summary
    .replace(/입니다\.입니다/g, "입니다.")
    .replace(/습니다\.입니다/g, "습니다.")
    .replace(/하세요\.을\(를\) 권장합니다/g, "하세요.")
    .replace(/하세요\.을\(를\) 권장합니다\./g, "하세요.");
  if (opts?.detectedHasReadme && suggestsMissingReadme(summary)) {
    summary = summary
      .replace(/readme[^.]*?(없|부재|미비)[^.]*\.?/gi, "")
      .replace(/실행\s*가이드[^.]*?(없|부재)[^.]*\.?/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  const cappedSummary = summary.length > 240 ? `${summary.slice(0, 237)}…` : summary;

  const filterAdvice = (items: string[], max: number) =>
    items
      .map((s) => s.trim())
      .filter((s) => {
        if (!s || isDuplicateInsightLine(s, cappedSummary)) return false;
        if (opts?.detectedHasReadme && suggestsMissingReadme(s)) return false;
        return true;
      })
      .slice(0, max);

  return {
    ...insight,
    summary: cappedSummary,
    strengths: [],
    gaps: filterAdvice(insight.gaps, 2),
    next_steps: filterAdvice(insight.next_steps, 2),
    architecture_risks: filterAdvice(insight.architecture_risks, 1),
    improvements: filterAdvice(insight.improvements, 1),
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
  const detectedHasReadme = payload.detected_has_readme === true;
  return normalizeProgressInsightForDisplay(
    {
      summary: payload.summary.trim(),
      strengths: parseStringList(payload.strengths),
      gaps: parseStringList(payload.gaps),
      next_steps: parseStringList(payload.next_steps),
      architecture_risks: parseStringList(payload.architecture_risks),
      improvements: parseStringList(payload.improvements),
      model: payload.model ?? "unknown",
      used_memory: payload.used_memory === true,
      new_deliverables_analyzed:
        typeof payload.new_deliverables_analyzed === "number"
          ? payload.new_deliverables_analyzed
          : undefined,
      source_samples_count:
        typeof payload.source_samples_count === "number"
          ? payload.source_samples_count
          : undefined,
      detected_has_readme: detectedHasReadme,
      zip_source_analyzed: payload.zip_source_analyzed === true,
      project_content:
        typeof payload.project_content === "string" && payload.project_content.trim()
          ? payload.project_content.trim()
          : undefined,
      project_value:
        typeof payload.project_value === "string" && payload.project_value.trim()
          ? payload.project_value.trim()
          : undefined,
    },
    { detectedHasReadme }
  );
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
