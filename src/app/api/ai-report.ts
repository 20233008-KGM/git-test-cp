import { auth } from "../firebase";
import { supabase } from "../supabase";
import type {
  AiReportContext,
  AiReportGenerateRequest,
  AiReportGenerateResponse,
  AiReportNotReadyError,
  AiReportTeamSnapshot,
  AiReportTroubleshootingCase,
} from "../types/ai-report";

const FUNCTION_NAME = "generate-report";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isMissingRelationError(error: { code?: string; message?: string }) {
  return error.code === "42P01" || (error.message?.includes("does not exist") ?? false);
}

function truncateSnippet(text: string, max = 120): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

const RETROSPECTIVE_SECTION_KEYS = ["role", "strengths", "regrets", "growth"] as const;

function flattenFeedbackSnippet(row: {
  selected_options?: unknown;
  custom_text?: string | null;
}): string {
  const options = asArray<string>(row.selected_options);
  const custom = row.custom_text?.trim() ?? "";
  const parts = [...options, custom].filter(Boolean);
  return truncateSnippet(parts.join(", "), 120);
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
    const good = asArray<string>(row.good_keywords);
    const bad = asArray<string>(row.bad_keywords);
    const comment = row.comment?.trim();
    if (good.length > 0) parts.push(`강점:${good.join("/")}`);
    if (bad.length > 0) parts.push(`보완:${bad.join("/")}`);
    if (comment) parts.push(comment);
  }
  return truncateSnippet(parts.join(" · "), 150);
}

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
  return truncateSnippet(parts.join(" · "), 200);
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

async function getAiUserById(userId: string) {
  const { data, error } = await supabase
    .from("ai_users")
    .select("id, name, email, major, skills, firebase_uid")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function assertCurrentUser(userId: string) {
  const firebaseUid = auth.currentUser?.uid;
  if (!firebaseUid) throw new Error("로그인이 필요합니다.");
  const user = await getAiUserById(userId);
  if (!user) throw new Error("사용자를 찾을 수 없습니다.");
  if (user.firebase_uid !== firebaseUid) {
    throw new Error("본인 리포트만 조회할 수 있습니다.");
  }
  return user;
}

/**
 * 팀·트러블슈팅·산출물 메타를 Supabase에서 집계 (LLM 없음).
 */
export async function gatherAiReportContext(userId: string): Promise<AiReportContext> {
  const user = await assertCurrentUser(userId);

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
      userId,
      userName: user.name,
      email: user.email,
      major: user.major ?? undefined,
      skills: asArray<string>(user.skills),
      generatedAt: new Date().toISOString(),
      teams: [],
      troubleshootingCases: [],
      totalTroubleshootingLogs: 0,
      totalDeliverables: 0,
      totalFeedbacksSubmitted: 0,
      totalRetrospectivesSubmitted: 0,
      totalPeerReviewsSubmitted: 0,
      totalProfessorStudentEvalsReceived: 0,
      totalProfessorProjectEvalsReceived: 0,
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
      .select("id, team_id, problem, plan, solution, status, sort_order")
      .in("team_id", teamIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ai_team_deliverables")
      .select("team_id")
      .in("team_id", teamIds),
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

  const logs = logsResult.data ?? [];
  const deliverables = deliverablesResult.data ?? [];
  const feedbackRows = feedbacksResult.error ? [] : (feedbacksResult.data ?? []);
  const feedbackSnippetByTeam = new Map<string, string>();
  const feedbackTeamIds = new Set<string>();
  for (const row of feedbackRows) {
    const tid = row.team_id as string;
    const snippet = flattenFeedbackSnippet(row);
    feedbackTeamIds.add(tid);
    if (snippet) feedbackSnippetByTeam.set(tid, snippet);
  }
  const retroRows = retrosResult.error ? [] : (retrosResult.data ?? []);
  const retroSnippetByTeam = new Map<string, string>();
  const retroTeamIds = new Set<string>();
  for (const row of retroRows) {
    const tid = row.team_id as string;
    const snippet = flattenRetrospectiveSnippet(row.sections);
    if (snippet) {
      retroTeamIds.add(tid);
      retroSnippetByTeam.set(tid, snippet);
    } else if (row.sections && typeof row.sections === "object") {
      retroTeamIds.add(tid);
    }
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
  const profProjectByTeam = new Map<
    string,
    {
      completion_comment?: string | null;
      problem_solving_comment?: string | null;
      holistic_comment?: string | null;
    }
  >();
  for (const row of profProjectRows) {
    if (hasProjectEvalContent(row)) {
      profProjectByTeam.set(row.team_id as string, row);
    }
  }

  const roleByTeam = new Map(
    (memberships ?? []).map((m) => [m.team_id, m.role ?? "팀원"])
  );

  const teamRows = teamsResult.data ?? [];
  const teamById = new Map(teamRows.map((team) => [team.id, team]));

  const troubleshootingCases: AiReportTroubleshootingCase[] = logs
    .filter((log) => Boolean(log.problem?.trim()))
    .map((log) => {
      const team = teamById.get(log.team_id);
      const problem = log.problem.trim();
      const plan = log.plan?.trim();
      const solution = log.solution?.trim();
      const status = log.status ?? "in-progress";
      return {
        logId: log.id,
        teamId: log.team_id,
        teamName: team?.name ?? "팀",
        projectTitle: team?.project_title ?? team?.name ?? "프로젝트",
        courseName: team ? (courseNameById.get(team.course_id) ?? "수업") : "수업",
        title: problem.length > 48 ? `${problem.slice(0, 48)}…` : problem,
        problem,
        action: plan || "(대응 계획 미기록)",
        result:
          solution ||
          (status === "resolved" ? "해결 완료 (상세 미기록)" : "진행 중"),
        impact:
          status === "resolved"
            ? "해결 완료로 팀 기록에 반영됨"
            : "진행 중인 이슈로 팀 워크스페이스에서 추적 중",
        status,
      };
    })
    .slice(0, 8);

  const teams: AiReportTeamSnapshot[] = teamRows.map((team) => {
    const teamLogs = logs.filter((l) => l.team_id === team.id);
    const problems = teamLogs
      .map((l) => l.problem)
      .filter((p): p is string => Boolean(p))
      .slice(0, 3);

    const studentComment = profStudentCommentByTeam.get(team.id);
    const projectEval = profProjectByTeam.get(team.id);
    const holistic = projectEval?.holistic_comment?.trim() ?? "";
    const snippetParts = [studentComment, holistic].filter(Boolean) as string[];
    const professorFeedbackSnippet =
      snippetParts.length > 0 ? truncateSnippet(snippetParts.join(" · ")) : undefined;

    return {
      teamId: team.id,
      teamName: team.name,
      projectTitle: team.project_title ?? team.name,
      courseName: courseNameById.get(team.course_id) ?? "수업",
      memberRole: roleByTeam.get(team.id) ?? "팀원",
      progress: team.progress ?? 0,
      troubleshootingCount: teamLogs.length,
      deliverableCount: deliverables.filter((d) => d.team_id === team.id).length,
      sampleProblems: problems,
      feedbackSubmitted: feedbackTeamIds.has(team.id),
      feedbackSnippet: feedbackSnippetByTeam.get(team.id),
      retrospectiveSubmitted: retroTeamIds.has(team.id),
      retrospectiveSnippet: retroSnippetByTeam.get(team.id),
      peerReviewsSubmitted: peerCountByTeam.get(team.id) ?? 0,
      peerReviewSnippet: peerSnippetByTeam.get(team.id),
      professorStudentEvalReceived: Boolean(studentComment),
      professorProjectEvalReceived: Boolean(projectEval),
      professorFeedbackSnippet,
    };
  });

  return {
    userId,
    userName: user.name,
    email: user.email,
    major: user.major ?? undefined,
    skills: asArray<string>(user.skills),
    generatedAt: new Date().toISOString(),
    teams,
    troubleshootingCases,
    totalTroubleshootingLogs: logs.length,
    totalDeliverables: deliverables.length,
    totalFeedbacksSubmitted: feedbackTeamIds.size,
    totalRetrospectivesSubmitted: retroTeamIds.size,
    totalPeerReviewsSubmitted: peerRows.length,
    totalProfessorStudentEvalsReceived: profStudentCommentByTeam.size,
    totalProfessorProjectEvalsReceived: profProjectByTeam.size,
  };
}

function buildGrowthReflectionDraft(context: AiReportContext): string {
  const lines: string[] = [];
  for (const team of context.teams) {
    const parts: string[] = [];
    if (team.retrospectiveSnippet) parts.push(`회고 — ${team.retrospectiveSnippet}`);
    if (team.professorFeedbackSnippet) parts.push(`교수 평가 — ${team.professorFeedbackSnippet}`);
    if (team.feedbackSnippet) parts.push(`팀 피드백 — ${team.feedbackSnippet}`);
    if (team.peerReviewSnippet) parts.push(`동료평가 — ${team.peerReviewSnippet}`);
    if (parts.length > 0) {
      lines.push(`[${team.projectTitle}] ${parts.join(" / ")}`);
    }
  }

  if (lines.length > 0) {
    return `${lines.join("\n")}\n\n(DB 활동 기반 초안입니다. Edge·OpenAI 배포 H-002 후 AI가 문단을 다듬습니다.)`;
  }

  if (context.totalTroubleshootingLogs > 0) {
    return `트러블슈팅 ${context.totalTroubleshootingLogs}건의 문제 해결 과정이 기록되어 있습니다. 회고·평가를 추가하면 성장 회고 초안이 풍부해집니다. (H-002 후 AI 문단 생성)`;
  }

  return "팀 활동·회고·평가 기록을 쌓으면 성장 회고 초안이 채워집니다. Edge·OpenAI 배포(H-002) 후 AI 문단 생성을 이용할 수 있습니다.";
}

/** LLM 없이 DB 맥락만으로 A4용 초안 JSON 생성 */
export function buildDraftReportFromContext(
  context: AiReportContext
): AiReportGenerateResponse {
  const teamLines = context.teams.map((t) => {
    const extras: string[] = [];
    if (t.feedbackSubmitted) extras.push("팀 피드백 ✓");
    if (t.retrospectiveSubmitted) extras.push(t.retrospectiveSnippet ? "회고록 ✓" : "회고록(빈) ✓");
    if (t.peerReviewsSubmitted > 0) extras.push(`동료평가 ${t.peerReviewsSubmitted}건`);
    if (t.professorStudentEvalReceived) extras.push("교수 학생평가 ✓");
    if (t.professorProjectEvalReceived) extras.push("교수 프로젝트평가 ✓");
    const extraText = extras.length > 0 ? `, ${extras.join(", ")}` : "";
    return `${t.courseName} · ${t.projectTitle} (${t.memberRole}, 진행 ${t.progress}%, 트러블슈팅 ${t.troubleshootingCount}건, 산출물 ${t.deliverableCount}건${extraText})`;
  });

  const problems =
    context.troubleshootingCases.length > 0
      ? context.troubleshootingCases.map((c) => c.problem)
      : context.teams.flatMap((t) => t.sampleProblems).slice(0, 8);

  return {
    summary:
      context.teams.length > 0
        ? `${context.userName}님은 ${context.teams.length}개 팀 프로젝트에 참여했습니다. 트러블슈팅 ${context.totalTroubleshootingLogs}건, 산출물 ${context.totalDeliverables}건, 팀 피드백 ${context.totalFeedbacksSubmitted}건, 회고록 ${context.totalRetrospectivesSubmitted}건, 동료평가 ${context.totalPeerReviewsSubmitted}건, 교수 평가(학생 ${context.totalProfessorStudentEvalsReceived}팀·프로젝트 ${context.totalProfessorProjectEvalsReceived}팀)가 기록되어 있습니다.`
        : `${context.userName}님의 팀 활동 기록이 아직 없습니다. 팀에 배정된 뒤 다시 생성해 보세요.`,
    problems_solved:
      problems.length > 0
        ? problems
        : ["등록된 트러블슈팅 로그가 없습니다."],
    technologies:
      context.skills.length > 0 ? context.skills : ["(프로필에 기술 스택을 추가해 주세요)"],
    role_description:
      teamLines.length > 0
        ? teamLines.join("\n")
        : "참여한 팀 프로젝트가 없습니다.",
    growth_reflection: buildGrowthReflectionDraft(context),
    sections: context.teams.map((t) => ({
      title: `${t.projectTitle}`,
      body: [
        `수업: ${t.courseName}`,
        `역할: ${t.memberRole}`,
        `트러블슈팅 ${t.troubleshootingCount}건 · 산출물 ${t.deliverableCount}건 · 피드백 ${t.feedbackSubmitted ? "완료" : "미제출"} · 회고 ${t.retrospectiveSubmitted ? "완료" : "미제출"} · 동료평가 ${t.peerReviewsSubmitted}건 · 교수평가 ${t.professorStudentEvalReceived || t.professorProjectEvalReceived ? "있음" : "없음"}`,
        t.feedbackSnippet ? `팀 피드백: ${t.feedbackSnippet}` : "",
        t.peerReviewSnippet ? `동료평가: ${t.peerReviewSnippet}` : "",
        t.retrospectiveSnippet ? `회고 요약: ${t.retrospectiveSnippet}` : "",
        t.professorFeedbackSnippet
          ? `교수 피드백: ${t.professorFeedbackSnippet}`
          : "",
        t.sampleProblems.length > 0
          ? `주요 이슈: ${t.sampleProblems.join(" / ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    })),
    generated_at: context.generatedAt,
    model: "draft-db-only",
  };
}

/**
 * POST /functions/v1/generate-report
 */
export async function generateAiReport(
  request: AiReportGenerateRequest
): Promise<AiReportGenerateResponse> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: request,
  });

  if (error) {
    const message = error.message ?? "AI 리포트 생성 요청에 실패했습니다.";
    if (message.includes("Failed to send") || message.includes("404")) {
      throw notReady(
        "Edge Function이 아직 배포되지 않았습니다. 「DB 활동 미리보기」를 이용하세요."
      );
    }
    throw new Error(message);
  }

  const payload = data as
    | AiReportGenerateResponse
    | AiReportNotReadyError
    | { error?: string }
    | null;

  if (payload && "code" in payload && payload.code === "NOT_IMPLEMENTED") {
    throw notReady(payload.message);
  }

  if (payload && "error" in payload && typeof payload.error === "string") {
    throw new Error(payload.error);
  }

  if (!payload || typeof payload !== "object" || !("summary" in payload)) {
    throw notReady("응답 형식이 올바르지 않습니다.");
  }

  return payload;
}

function notReady(message: string): Error {
  const err = new Error(message);
  err.name = "AiReportNotReady";
  return err;
}
