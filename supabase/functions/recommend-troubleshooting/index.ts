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
  deliverables: Array<{ file_name: string; description: string | null }>;
  chat_snippets: string[];
  feedback_count: number;
};

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
        .select("file_name, description")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(8),
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
    deliverables: (deliverablesResult.data ?? []).map((d) => ({
      file_name: String(d.file_name ?? ""),
      description: d.description ? String(d.description) : null,
    })),
    chat_snippets,
    feedback_count: (feedbackResult.data ?? []).length,
  };
}

function buildDraftRecommendation(context: TeamContext): RecommendResponse {
  const open = context.logs.filter((l) => l.status === "in-progress");
  const resolved = context.logs.filter((l) => l.status === "resolved");
  const progress = context.team.progress ?? 0;
  const deliverableCount = context.deliverables.length;

  if (open.length > 0) {
    const latest = open[open.length - 1];
    return {
      problem: `진행 중 이슈 마무리: ${truncateText(latest.problem, 90)}`,
      plan: latest.plan?.trim()
        ? `기존 계획을 검증·실행하고 해결·재발 방지를 solution에 기록하세요. (${truncateText(latest.plan, 80)})`
        : "원인 가설 → 재현 → 수정 → 검증 순으로 로그를 완성하고 팀 채팅에 결과를 공유하세요.",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (deliverableCount === 0 && progress < 60) {
    return {
      problem: "역할·일정이 불명확하면 산출물·마감이 지연될 수 있습니다.",
      plan: "이번 주 목표 산출물 1개, 담당자, 마감일을 트러블슈팅·채팅에 명시하고 진행률을 갱신하세요.",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (resolved.length > 0 && open.length === 0) {
    const last = resolved[resolved.length - 1];
    return {
      problem: "최근 해결한 이슈의 재발 방지·회고가 비어 있을 수 있습니다.",
      plan: `「${truncateText(last.problem, 60)}」과 유사한 상황을 막는 체크리스트 2~3개를 새 로그로 남기세요.`,
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  if (context.chat_snippets.length > 0) {
    return {
      problem: "채팅에만 남은 이슈가 트러블슈팅으로 정리되지 않았을 수 있습니다.",
      plan: "최근 채팅의 막힌 지점을 problem·plan 형식으로 옮기고 담당·기한을 적으세요.",
      generated_at: new Date().toISOString(),
      model: "draft-db-only",
    };
  }

  return {
    problem: "통합·배포·데모 전 환경·데이터 불일치로 오류가 날 수 있습니다.",
    plan: "로컬·스테이징·팀원 PC에서 동일 시나리오를 재현하고, 환경 변수·시드·의존성 차이를 로그에 기록하세요.",
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
      description: d.description ? truncateText(d.description, 120) : null,
    })),
    recent_chat: context.chat_snippets.slice(-8),
    feedback_submission_count: context.feedback_count,
  };
}

function buildSystemPrompt(locale: "ko" | "en"): string {
  const lang = locale === "en" ? "English" : "Korean";
  return `You help university team projects document troubleshooting. Respond in ${lang}. Return JSON only with keys: problem (string, max 120 chars), plan (string, max 200 chars), rationale (string, optional, max 80 chars). Suggest ONE new troubleshooting topic the team should write next—actionable, specific to the provided team data. Do not copy existing logs verbatim; if a similar issue exists, suggest the next step or a new angle. problem describes the risk or blocker; plan is concrete steps the team can take this week.`;
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
  if (!problem || !plan) {
    throw new Error("Gemini JSON에 problem/plan이 없습니다.");
  }

  return {
    problem: truncateText(problem, 120),
    plan: truncateText(plan, 200),
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
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const context = await gatherTeamContext(supabase, teamId);

    const geminiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
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
