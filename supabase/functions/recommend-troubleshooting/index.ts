/**
 * recommend-troubleshooting — 팀 상세 트러블슈팅 AI 추천
 *
 * Secret: GEMINI_API_KEY (generate-report와 동일)
 * 배포: supabase functions deploy recommend-troubleshooting
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type RecommendRequest = {
  teamId?: string;
  locale?: "ko" | "en";
  intent?: "troubleshooting" | "progress-insight";
};

type TroubleshootingLogRow = {
  id: string;
  problem: string;
  plan: string | null;
  solution: string | null;
  status: string;
  author: string;
};

type RecommendResponse = {
  problem: string;
  plan: string;
  rationale?: string;
  generated_at: string;
  model: string;
};

type ProgressInsightResponse = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next_steps: string[];
  architecture_risks: string[];
  improvements: string[];
  generated_at: string;
  model: string;
};

type DeliverableRow = {
  file_name: string;
  description: string | null;
  subtitle: string | null;
  mime_type: string | null;
  storage_path: string | null;
  file_size: number | null;
  public_url: string | null;
};

type SourceSnippet = {
  file_name: string;
  excerpt: string;
};

type TeamContext = {
  team: {
    id: string;
    name: string;
    project_title: string | null;
    progress: number | null;
    course_id: string | null;
  };
  teammates: Array<{ name: string; contribution: number | null }>;
  logs: TroubleshootingLogRow[];
  deliverables: Array<{
    file_name: string;
    description: string | null;
    subtitle: string | null;
    mime_type: string | null;
    is_link: boolean;
  }>;
  source_snippets: SourceSnippet[];
  chat_snippets: string[];
  feedback_count: number;
};

const DELIVERABLES_BUCKET = "ai_team_deliverables";
const SOURCE_EXTS = /\.(ts|tsx|js|jsx|py|java|go|rs|sql|md|json|yaml|yml|html|css)$/i;
const MAX_SOURCE_BYTES = 120_000;
const MAX_SNIPPET_CHARS = 3500;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function isMissingRelationError(error: { code?: string; message?: string }) {
  return error?.code === "42P01" || (error?.message?.includes("does not exist") ?? false);
}

async function gatherTeamContext(
  supabase: ReturnType<typeof createClient>,
  teamId: string
): Promise<TeamContext> {
  const { data: team, error: teamError } = await supabase
    .from("ai_teams")
    .select("id, name, project_title, progress, course_id")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError) throw teamError;
  if (!team) {
    const notFound = new Error("팀을 찾을 수 없습니다.");
    (notFound as Error & { status?: number }).status = 404;
    throw notFound;
  }

  const [logsResult, deliverablesResult, chatResult, teammatesResult, feedbackResult] =
    await Promise.all([
      supabase
        .from("ai_team_detail_troubleshooting_logs")
        .select("id, problem, plan, solution, status, author")
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("ai_team_deliverables")
        .select("file_name, description, subtitle, mime_type, storage_path, file_size, public_url")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("ai_team_detail_chat_messages")
        .select("text, sender")
        .eq("team_id", teamId)
        .order("sort_order", { ascending: false })
        .limit(12),
      supabase
        .from("ai_team_detail_teammates")
        .select("name, contribution")
        .eq("team_id", teamId),
      supabase
        .from("ai_team_detail_feedbacks")
        .select("id")
        .eq("team_id", teamId),
    ]);

  if (logsResult.error && !isMissingRelationError(logsResult.error)) throw logsResult.error;
  if (deliverablesResult.error && !isMissingRelationError(deliverablesResult.error)) {
    throw deliverablesResult.error;
  }
  if (chatResult.error && !isMissingRelationError(chatResult.error)) throw chatResult.error;
  if (teammatesResult.error && !isMissingRelationError(teammatesResult.error)) {
    throw teammatesResult.error;
  }
  if (feedbackResult.error && !isMissingRelationError(feedbackResult.error)) {
    throw feedbackResult.error;
  }

  const chatRows = (chatResult.data ?? []) as Array<{ text: string; sender: string }>;
  const chat_snippets = chatRows
    .map((m) => truncateText(`${m.sender}: ${m.text}`, 100))
    .filter(Boolean)
    .reverse();

  const deliverableRows = (deliverablesResult.data ?? []) as DeliverableRow[];
  const source_snippets = await sampleDeliverableSourceSnippets(supabase, deliverableRows);

  return {
    team: {
      id: team.id,
      name: team.name ?? teamId,
      project_title: team.project_title ?? null,
      progress: typeof team.progress === "number" ? team.progress : null,
      course_id: team.course_id ?? null,
    },
    teammates: (teammatesResult.data ?? []).map((t) => ({
      name: String(t.name ?? ""),
      contribution: typeof t.contribution === "number" ? t.contribution : null,
    })),
    logs: (logsResult.data ?? []) as TroubleshootingLogRow[],
    deliverables: deliverableRows.map((d) => {
      const fileName = String(d.file_name ?? "");
      const mime = d.mime_type ? String(d.mime_type) : null;
      const isLink =
        mime === "text/uri-list" ||
        /^https?:\/\//i.test(fileName) ||
        fileName.startsWith("http");
      return {
        file_name: fileName,
        description: d.description ? String(d.description) : null,
        subtitle: d.subtitle ? String(d.subtitle) : null,
        mime_type: mime,
        is_link: isLink,
      };
    }),
    source_snippets,
    chat_snippets,
    feedback_count: (feedbackResult.data ?? []).length,
  };
}

async function sampleDeliverableSourceSnippets(
  supabase: ReturnType<typeof createClient>,
  rows: DeliverableRow[]
): Promise<SourceSnippet[]> {
  const snippets: SourceSnippet[] = [];

  for (const row of rows) {
    if (snippets.length >= 4) break;
    const path = row.storage_path?.trim() ?? "";
    if (!path || path.startsWith("link://")) continue;

    const name = String(row.file_name ?? "");
    if (!SOURCE_EXTS.test(name)) continue;

    const size = Number(row.file_size ?? 0);
    if (size > MAX_SOURCE_BYTES) {
      snippets.push({
        file_name: name,
        excerpt: `(파일 ${Math.round(size / 1024)}KB — 전문 미수집, 파일명·확장자만 참고)`,
      });
      continue;
    }

    try {
      const { data, error } = await supabase.storage.from(DELIVERABLES_BUCKET).download(path);
      if (error || !data) continue;
      const text = await data.text();
      const trimmed = text.trim();
      if (!trimmed) continue;
      snippets.push({
        file_name: name,
        excerpt: truncateText(trimmed, MAX_SNIPPET_CHARS),
      });
    } catch {
      // skip unreadable binary
    }
  }

  return snippets;
}

function parseInsightStringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is string => typeof s === "string" && s.trim())
    .map((s) => truncateText(s.trim(), 160))
    .slice(0, max);
}

function buildDraftRecommendation(context: TeamContext): RecommendResponse {
  const open = context.logs.filter((l) => l.status === "in-progress");
  const resolved = context.logs.filter((l) => l.status === "resolved");
  const progress = context.team.progress ?? 0;
  const deliverableCount = context.deliverables.length;

  if (open.length > 0) {
    const latest = open[open.length - 1];
    return {
      problem: `진행 중 이슈 점검 필요: ${truncateText(latest.problem, 100)}`,
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (deliverableCount === 0 && progress < 60) {
    return {
      problem: "역할·일정·산출물이 불명확해 마감 지연 위험이 있습니다.",
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (resolved.length > 0 && open.length === 0) {
    const last = resolved[resolved.length - 1];
    return {
      problem: `최근 해결 이슈「${truncateText(last.problem, 70)}」의 재발·회고 누락 가능성`,
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (context.chat_snippets.length > 0) {
    return {
      problem: "채팅에만 남은 막힌 지점이 트러블슈팅으로 정리되지 않았을 수 있습니다.",
      plan: "",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  return {
    problem: "통합·배포·데모 전 환경·데이터 불일치로 런타임 오류가 날 수 있습니다.",
    plan: "",
    generated_at: new Date().toISOString(),
    model: "draft-db-only",
  };
}

function buildLlmPayload(context: TeamContext) {
  return {
    team: context.team,
    teammates: context.teammates,
    troubleshooting_logs: context.logs.map((l) => ({
      status: l.status,
      problem: truncateText(l.problem, 200),
      plan: l.plan ? truncateText(l.plan, 150) : null,
      solution: l.solution ? truncateText(l.solution, 150) : null,
      author: l.author,
    })),
    deliverables: context.deliverables.map((d) => ({
      name: d.file_name,
      subtitle: d.subtitle ? truncateText(d.subtitle, 80) : null,
      kind: d.is_link ? "link" : "file",
      description: d.description ? truncateText(d.description, 120) : null,
    })),
    recent_chat: context.chat_snippets.slice(-8),
    source_code_samples: context.source_snippets,
    feedback_submission_count: context.feedback_count,
  };
}

function buildSystemPrompt(locale: "ko" | "en"): string {
  const lang = locale === "en" ? "English" : "Korean";
  return `You help university team projects diagnose risks from real team context (deliverables, troubleshooting logs, chat). Respond in ${lang}. Return JSON only with keys: problem (string, max 140 chars), rationale (string, optional, max 100 chars). Do NOT include a plan or solution steps. Suggest ONE likely problem situation the team should investigate next—specific to the data. Do not copy existing logs verbatim.`;
}

function buildProgressInsightDraft(context: TeamContext): ProgressInsightResponse {
  const deliverableCount = context.deliverables.length;
  const resolved = context.logs.filter((l) => l.status === "resolved").length;
  const open = context.logs.length - resolved;
  const codeLike = context.deliverables.filter((d) =>
    /\.(ts|tsx|js|py|java|zip)$/i.test(d.file_name)
  ).length;
  const sampled = context.source_snippets.length;

  const strengths: string[] = [];
  const gaps: string[] = [];
  const next_steps: string[] = [];
  const architecture_risks: string[] = [];
  const improvements: string[] = [];

  if (deliverableCount > 0) strengths.push(`산출물 ${deliverableCount}건 제출됨`);
  else gaps.push("산출물 미등록");
  if (codeLike > 0) strengths.push(`코드·압축 산출물 ${codeLike}건`);
  if (sampled > 0) strengths.push(`소스 ${sampled}개 파일 일부 분석됨`);
  if (resolved > 0) strengths.push(`해결된 트러블슈팅 ${resolved}건`);
  if (open > 0) gaps.push(`미해결 이슈 ${open}건`);
  if (sampled === 0 && codeLike === 0) {
    next_steps.push("핵심 소스·README를 산출물로 업로드하세요.");
    architecture_risks.push("코드 미제공으로 아키텍처 리뷰가 제한됩니다.");
  }
  if (open > 0) next_steps.push("진행 중 트러블슈팅을 해결·회고까지 마무리하세요.");

  return {
    summary: `산출물 ${deliverableCount}건, 트러블슈팅 해결 ${resolved}건·진행 ${open}건. 소스 샘플 ${sampled}건.`,
    strengths,
    gaps,
    next_steps,
    architecture_risks,
    improvements,
    generated_at: new Date().toISOString(),
    model: "draft-db-only",
  };
}

function buildProgressInsightSystemPrompt(locale: "ko" | "en"): string {
  const lang = locale === "en" ? "English" : "Korean";
  return `You are a staff engineer (Cursor-agent quality) reviewing a university team's repo/workspace. Input includes deliverable metadata, troubleshooting logs, chat, and source_code_samples (excerpts from uploaded files when available).

Rules (${lang}):
- Return JSON only with keys: summary, strengths, gaps, next_steps, architecture_risks, improvements (each string array 2-4 items except summary).
- summary: 2-3 sentences synthesis; do NOT duplicate bullet text verbatim.
- next_steps: what the team should do next (concrete, prioritized).
- architecture_risks: unstable structure, missing layers, coupling, deployment risks — cite file names when evidence exists.
- improvements: how to improve quality/process/architecture.
- strengths/gaps: current state wins and blockers.
- When source_code_samples is non-empty, reason about patterns (routing, state, API, tests). When empty, say code review is limited and suggest uploads.
- Be specific; no generic fluff.`;
}

async function callGeminiProgressInsight(
  apiKey: string,
  modelId: string,
  locale: "ko" | "en",
  context: TeamContext
): Promise<ProgressInsightResponse> {
  const payload = buildLlmPayload(context);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildProgressInsightSystemPrompt(locale) }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
      generationConfig: {
        temperature: 0.55,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const completion = await response.json();
  const content = completion?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content || typeof content !== "string") {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  const parsed = JSON.parse(content) as Partial<ProgressInsightResponse>;
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  if (!summary) throw new Error("Gemini JSON에 summary가 없습니다.");

  return {
    summary: truncateText(summary, 400),
    strengths: parseInsightStringList(parsed.strengths, 5),
    gaps: parseInsightStringList(parsed.gaps, 5),
    next_steps: parseInsightStringList(parsed.next_steps, 5),
    architecture_risks: parseInsightStringList(parsed.architecture_risks, 5),
    improvements: parseInsightStringList(parsed.improvements, 5),
    generated_at: new Date().toISOString(),
    model: modelId,
  };
}

async function callGemini(
  apiKey: string,
  modelId: string,
  locale: "ko" | "en",
  context: TeamContext
): Promise<RecommendResponse> {
  const payload = buildLlmPayload(context);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt(locale) }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const completion = await response.json();
  const content = completion?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content || typeof content !== "string") {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  const parsed = JSON.parse(content) as Partial<RecommendResponse>;
  const problem = typeof parsed.problem === "string" ? parsed.problem.trim() : "";
  const plan = typeof parsed.plan === "string" ? parsed.plan.trim() : "";
  if (!problem) {
    throw new Error("Gemini JSON에 problem이 없습니다.");
  }

  return {
    problem: truncateText(problem, 140),
    plan: plan ? truncateText(plan, 200) : "",
    rationale:
      typeof parsed.rationale === "string" ? truncateText(parsed.rationale, 80) : undefined,
    generated_at: new Date().toISOString(),
    model: modelId,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase Edge 환경 변수가 설정되지 않았습니다." }, 500);
  }

  try {
    const body = (await req.json()) as RecommendRequest;
    const teamId = body.teamId?.trim();
    if (!teamId) {
      return jsonResponse({ error: "teamId is required" }, 400);
    }

    const locale = body.locale === "en" ? "en" : "ko";
    const intent = body.intent === "progress-insight" ? "progress-insight" : "troubleshooting";
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const context = await gatherTeamContext(supabase, teamId);

    const geminiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
    if (intent === "progress-insight") {
      if (geminiKey) {
        const modelId = Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_GEMINI_MODEL;
        const insight = await callGeminiProgressInsight(geminiKey, modelId, locale, context);
        return jsonResponse(insight);
      }
      return jsonResponse(buildProgressInsightDraft(context));
    }

    if (geminiKey) {
      const modelId = Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_GEMINI_MODEL;
      const recommendation = await callGemini(geminiKey, modelId, locale, context);
      return jsonResponse(recommendation);
    }

    return jsonResponse(buildDraftRecommendation(context));
  } catch (error) {
    console.error("[recommend-troubleshooting]", error);
    const status =
      error && typeof error === "object" && "status" in error && error.status === 404
        ? 404
        : 500;
    return jsonResponse(
      { error: error instanceof Error ? error.message : "AI 추천 생성에 실패했습니다." },
      status
    );
  }
});
