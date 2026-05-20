import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GenerateRequest = {
  userId?: string;
  locale?: "ko" | "en";
};

type ReportSection = { title: string; body: string };

type ReportResponse = {
  summary: string;
  problems_solved: string[];
  technologies: string[];
  role_description: string;
  growth_reflection: string;
  sections?: ReportSection[];
  generated_at: string;
  model?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function isMissingRelationError(error: { code?: string; message?: string }) {
  return error?.code === "42P01" || (error?.message?.includes("does not exist") ?? false);
}

function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function flattenFeedbackSnippet(row: {
  selected_options?: unknown;
  custom_text?: string | null;
}): string {
  const options = asStringArray(row.selected_options);
  const custom = row.custom_text?.trim() ?? "";
  return truncateText([...options, custom].filter(Boolean).join(", "), 120);
}

function flattenPeerReviewsSnippet(
  rows: Array<{
    good_keywords?: unknown;
    bad_keywords?: unknown;
    comment?: string | null;
  }>
): string {
  const parts: string[] = [];
  for (const row of rows) {
    const good = asStringArray(row.good_keywords);
    const bad = asStringArray(row.bad_keywords);
    const comment = row.comment?.trim();
    if (good.length > 0) parts.push(`강점:${good.join("/")}`);
    if (bad.length > 0) parts.push(`보완:${bad.join("/")}`);
    if (comment) parts.push(comment);
  }
  return truncateText(parts.join(" · "), 150);
}

const RETROSPECTIVE_SECTION_KEYS = ["role", "strengths", "regrets", "growth"] as const;

function flattenRetrospectiveSnippet(sections: unknown): string {
  if (!sections || typeof sections !== "object") return "";
  const record = sections as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of RETROSPECTIVE_SECTION_KEYS) {
    const section = record[key];
    if (!section || typeof section !== "object") continue;
    const content = section as Record<string, unknown>;
    const custom = typeof content.custom === "string" ? content.custom.trim() : "";
    const auto = typeof content.auto === "string" ? content.auto.trim() : "";
    const text = custom || auto;
    if (text) parts.push(text);
  }
  const joined = parts.join(" · ");
  return joined.length > 200 ? `${joined.slice(0, 200)}…` : joined;
}

function hasProjectEvalContent(row: {
  completion_comment?: string | null;
  problem_solving_comment?: string | null;
  holistic_comment?: string | null;
}): boolean {
  return Boolean(
    row.completion_comment?.trim() ||
      row.problem_solving_comment?.trim() ||
      row.holistic_comment?.trim()
  );
}

async function gatherContext(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: user, error: userError } = await supabase
    .from("ai_users")
    .select("id, name, email, major, skills")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) throw new Error("사용자를 찾을 수 없습니다.");

  const { data: memberships, error: memError } = await supabase
    .from("ai_team_members")
    .select("team_id, role")
    .eq("user_id", userId);

  if (memError) throw memError;

  const teamIds = Array.from(
    new Set((memberships ?? []).map((m) => m.team_id).filter(Boolean))
  ) as string[];

  if (teamIds.length === 0) {
    return {
      user,
      teams: [] as Array<Record<string, unknown>>,
      logs: [] as Array<Record<string, unknown>>,
      deliverableCount: 0,
      feedbackCount: 0,
      retrospectiveCount: 0,
      peerReviewCount: 0,
      professorStudentEvalCount: 0,
      professorProjectEvalCount: 0,
    };
  }

  const [
    teamsResult,
    logsResult,
    deliverablesResult,
    feedbacksResult,
    retrosResult,
    peerResult,
    profStudentResult,
    profProjectResult,
  ] = await Promise.all([
    supabase
      .from("ai_teams")
      .select("id, name, project_title, progress, course_id")
      .in("id", teamIds),
    supabase
      .from("ai_team_detail_troubleshooting_logs")
      .select("id, team_id, problem, plan, solution, status")
      .in("team_id", teamIds)
      .order("sort_order", { ascending: true }),
    supabase.from("ai_team_deliverables").select("team_id").in("team_id", teamIds),
    supabase
      .from("ai_team_detail_feedbacks")
      .select("team_id, selected_options, custom_text")
      .eq("author_user_id", userId)
      .in("team_id", teamIds),
    supabase
      .from("ai_team_detail_retrospectives")
      .select("team_id, sections")
      .eq("author_user_id", userId)
      .in("team_id", teamIds),
    supabase
      .from("ai_team_detail_peer_reviews")
      .select("team_id, good_keywords, bad_keywords, comment")
      .eq("reviewer_user_id", userId)
      .in("team_id", teamIds),
    supabase
      .from("ai_team_detail_professor_student_evals")
      .select("team_id, comment")
      .eq("student_row_id", userId)
      .in("team_id", teamIds),
    supabase
      .from("ai_team_detail_professor_project_evals")
      .select("team_id, completion_comment, problem_solving_comment, holistic_comment")
      .in("team_id", teamIds),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (logsResult.error) throw logsResult.error;
  if (deliverablesResult.error) throw deliverablesResult.error;
  if (feedbacksResult.error && !isMissingRelationError(feedbacksResult.error)) {
    throw feedbacksResult.error;
  }
  if (retrosResult.error && !isMissingRelationError(retrosResult.error)) {
    throw retrosResult.error;
  }
  if (peerResult.error && !isMissingRelationError(peerResult.error)) {
    throw peerResult.error;
  }
  if (profStudentResult.error && !isMissingRelationError(profStudentResult.error)) {
    throw profStudentResult.error;
  }
  if (profProjectResult.error && !isMissingRelationError(profProjectResult.error)) {
    throw profProjectResult.error;
  }

  const feedbackRows = feedbacksResult.error ? [] : (feedbacksResult.data ?? []);
  const feedbackSnippetByTeam = new Map<string, string>();
  const feedbackTeamIds = new Set<string>();
  for (const row of feedbackRows) {
    const tid = row.team_id as string;
    feedbackTeamIds.add(tid);
    const snippet = flattenFeedbackSnippet(row);
    if (snippet) feedbackSnippetByTeam.set(tid, snippet);
  }
  const retroRows = retrosResult.error ? [] : (retrosResult.data ?? []);
  const retroTeamIds = new Set<string>();
  const retroSnippetByTeam = new Map<string, string>();
  for (const row of retroRows) {
    const tid = row.team_id as string;
    const snippet = flattenRetrospectiveSnippet(row.sections);
    retroTeamIds.add(tid);
    if (snippet) retroSnippetByTeam.set(tid, snippet);
  }
  const peerRows = peerResult.error ? [] : (peerResult.data ?? []);
  const peerCountByTeam = new Map<string, number>();
  const peerRowsByTeam = new Map<string, typeof peerRows>();
  for (const row of peerRows) {
    const tid = row.team_id as string;
    peerCountByTeam.set(tid, (peerCountByTeam.get(tid) ?? 0) + 1);
    const list = peerRowsByTeam.get(tid) ?? [];
    list.push(row);
    peerRowsByTeam.set(tid, list);
  }
  const peerSnippetByTeam = new Map<string, string>();
  for (const [tid, rows] of peerRowsByTeam) {
    const snippet = flattenPeerReviewsSnippet(rows);
    if (snippet) peerSnippetByTeam.set(tid, snippet);
  }

  const profStudentRows = profStudentResult.error ? [] : (profStudentResult.data ?? []);
  const profStudentCommentByTeam = new Map<string, string>();
  for (const row of profStudentRows) {
    const comment = (row.comment as string)?.trim();
    if (comment) profStudentCommentByTeam.set(row.team_id as string, comment);
  }

  const profProjectRows = profProjectResult.error ? [] : (profProjectResult.data ?? []);
  const profProjectTeamIds = new Set<string>();
  for (const row of profProjectRows) {
    if (hasProjectEvalContent(row)) profProjectTeamIds.add(row.team_id as string);
  }

  const courseIds = Array.from(
    new Set((teamsResult.data ?? []).map((t) => t.course_id).filter(Boolean))
  ) as string[];

  let courseNameById = new Map<string, string>();
  if (courseIds.length > 0) {
    const { data: courses, error: courseError } = await supabase
      .from("ai_courses")
      .select("id, name")
      .in("id", courseIds);
    if (courseError) throw courseError;
    courseNameById = new Map((courses ?? []).map((c) => [c.id, c.name]));
  }

  const roleByTeam = new Map(
    (memberships ?? []).map((m) => [m.team_id, m.role ?? "팀원"])
  );

  const teams = (teamsResult.data ?? []).map((team) => ({
    teamId: team.id,
    teamName: team.name,
    projectTitle: team.project_title ?? team.name,
    courseName: courseNameById.get(team.course_id) ?? "수업",
    memberRole: roleByTeam.get(team.id) ?? "팀원",
    progress: team.progress ?? 0,
    troubleshootingCount: (logsResult.data ?? []).filter((l) => l.team_id === team.id).length,
    deliverableCount: (deliverablesResult.data ?? []).filter((d) => d.team_id === team.id)
      .length,
    feedbackSubmitted: feedbackTeamIds.has(team.id),
    feedbackSnippet: feedbackSnippetByTeam.get(team.id),
    retrospectiveSubmitted: retroTeamIds.has(team.id),
    retrospectiveSnippet: retroSnippetByTeam.get(team.id),
    peerReviewsSubmitted: peerCountByTeam.get(team.id) ?? 0,
    peerReviewSnippet: peerSnippetByTeam.get(team.id),
    professorStudentEvalReceived: profStudentCommentByTeam.has(team.id),
    professorProjectEvalReceived: profProjectTeamIds.has(team.id),
    professorFeedbackSnippet: (() => {
      const parts = [
        profStudentCommentByTeam.get(team.id),
        profProjectRows.find((r) => r.team_id === team.id)?.holistic_comment?.trim(),
      ].filter(Boolean) as string[];
      if (parts.length === 0) return undefined;
      const joined = parts.join(" · ");
      return joined.length > 120 ? `${joined.slice(0, 120)}…` : joined;
    })(),
  }));

  const logs = (logsResult.data ?? [])
    .filter((log) => Boolean(log.problem?.trim()))
    .slice(0, 12)
    .map((log) => ({
      problem: log.problem,
      plan: log.plan,
      solution: log.solution,
      status: log.status,
    }));

  return {
    user,
    teams,
    logs,
    deliverableCount: (deliverablesResult.data ?? []).length,
    feedbackCount: feedbackTeamIds.size,
    retrospectiveCount: retroTeamIds.size,
    peerReviewCount: peerRows.length,
    professorStudentEvalCount: profStudentCommentByTeam.size,
    professorProjectEvalCount: profProjectTeamIds.size,
  };
}

async function callOpenAi(
  apiKey: string,
  locale: "ko" | "en",
  context: Awaited<ReturnType<typeof gatherContext>>
): Promise<ReportResponse> {
  const lang = locale === "en" ? "English" : "Korean";
  const payload = {
    student: {
      name: context.user.name,
      email: context.user.email,
      major: context.user.major,
      skills: asStringArray(context.user.skills),
    },
    teams: context.teams,
    troubleshooting_logs: context.logs,
    deliverable_count: context.deliverableCount,
    feedback_count: context.feedbackCount,
    retrospective_count: context.retrospectiveCount,
    peer_review_count: context.peerReviewCount,
    professor_student_eval_count: context.professorStudentEvalCount,
    professor_project_eval_count: context.professorProjectEvalCount,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You write university team-project portfolio reports. Respond in ${lang}. Return JSON only with keys: summary (string), problems_solved (string[]), technologies (string[]), role_description (string), growth_reflection (string), sections (array of {title, body}). Be factual; use only provided data. teams may include feedbackSubmitted, feedbackSnippet, retrospectiveSubmitted, retrospectiveSnippet, peerReviewsSubmitted, peerReviewSnippet, professorStudentEvalReceived, professorProjectEvalReceived, professorFeedbackSnippet per team.`,
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI 응답이 비어 있습니다.");
  }

  const parsed = JSON.parse(content) as Partial<ReportResponse>;
  const generatedAt = new Date().toISOString();

  return {
    summary: parsed.summary ?? `${context.user.name}님의 팀 활동 리포트입니다.`,
    problems_solved: asStringArray(parsed.problems_solved),
    technologies:
      asStringArray(parsed.technologies).length > 0
        ? asStringArray(parsed.technologies)
        : asStringArray(context.user.skills),
    role_description: parsed.role_description ?? "",
    growth_reflection: parsed.growth_reflection ?? "",
    sections: Array.isArray(parsed.sections)
      ? parsed.sections.filter(
          (s): s is ReportSection =>
            Boolean(s) &&
            typeof s === "object" &&
            typeof (s as ReportSection).title === "string" &&
            typeof (s as ReportSection).body === "string"
        )
      : undefined,
    generated_at: generatedAt,
    model: "gpt-4o-mini",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey?.trim()) {
    return jsonResponse(
      {
        code: "NOT_IMPLEMENTED",
        message:
          "OPENAI_API_KEY가 Supabase Edge Secret에 등록되지 않았습니다. H-002(28_human_action_items.md)를 완료한 뒤 functions deploy 하세요.",
      },
      501
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase Edge 환경 변수가 설정되지 않았습니다." }, 500);
  }

  try {
    const body = (await req.json()) as GenerateRequest;
    const userId = body.userId?.trim();
    if (!userId) {
      return jsonResponse({ error: "userId is required" }, 400);
    }

    const locale = body.locale === "en" ? "en" : "ko";
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const context = await gatherContext(supabase, userId);
    const report = await callOpenAi(openaiKey, locale, context);

    return jsonResponse(report);
  } catch (error) {
    console.error("[generate-report]", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "AI 리포트 생성에 실패했습니다." },
      500
    );
  }
});
