import { auth } from "../firebase";
import { supabase } from "../supabase";
import type { MyPageProject } from "../types";
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
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
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

function aggregatePeerReviewKeywords(
  rows: Array<{
    good_keywords?: unknown;
    bad_keywords?: unknown;
    comment?: string | null;
  }>
): { text: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const keywords = [
      ...asArray<string>(row.good_keywords),
      ...asArray<string>(row.bad_keywords),
    ];
    const comment = row.comment?.trim();
    if (comment) keywords.push(comment);
    for (const kw of keywords) {
      const key = kw.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
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
      deliverableFileNames: [],
    };
  }

  const [
    teamsResult,
    logsResult,
    deliverablesResult,
    feedbacksResult,
    retrosResult,
    peerResult,
    peerReceivedResult,
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
      .select("team_id, file_name")
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
      .from("ai_team_detail_peer_reviews")
      .select("team_id, good_keywords, bad_keywords, comment")
      .eq("teammate_id", userId)
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
  if (peerReceivedResult.error && !isMissingRelationError(peerReceivedResult.error)) {
    throw peerReceivedResult.error;
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
  let archivedCourseIds = new Set<string>();
  if (courseIds.length > 0) {
    const { data: courses, error: courseError } = await supabase
      .from("ai_courses")
      .select("id, name, status")
      .in("id", courseIds);
    if (courseError) throw courseError;
    courseNameById = new Map((courses ?? []).map((c) => [c.id, c.name]));
    archivedCourseIds = new Set(
      (courses ?? [])
        .filter((course) => course.status === "archived")
        .map((course) => course.id)
    );
  }

  const teamRows = (teamsResult.data ?? []).filter((team) =>
    archivedCourseIds.has(team.course_id)
  );
  const includedTeamIds = new Set(teamRows.map((team) => team.id));
  if (teamRows.length === 0) {
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
      deliverableFileNames: [],
    };
  }

  const logs = (logsResult.data ?? []).filter((log) => includedTeamIds.has(log.team_id));
  const deliverables = (deliverablesResult.data ?? []).filter((row) =>
    includedTeamIds.has(row.team_id)
  );
  const feedbackRows = (feedbacksResult.error ? [] : (feedbacksResult.data ?? [])).filter((row) =>
    includedTeamIds.has(row.team_id)
  );
  const feedbackSnippetByTeam = new Map<string, string>();
  const feedbackTeamIds = new Set<string>();
  for (const row of feedbackRows) {
    const tid = row.team_id as string;
    const snippet = flattenFeedbackSnippet(row);
    feedbackTeamIds.add(tid);
    if (snippet) feedbackSnippetByTeam.set(tid, snippet);
  }
  const retroRows = (retrosResult.error ? [] : (retrosResult.data ?? [])).filter((row) =>
    includedTeamIds.has(row.team_id)
  );
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
  const peerRows = (peerResult.error ? [] : (peerResult.data ?? [])).filter((row) =>
    includedTeamIds.has(row.team_id)
  );
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

  const peerReceivedRows = (peerReceivedResult.error ? [] : (peerReceivedResult.data ?? [])).filter(
    (row) => includedTeamIds.has(row.team_id)
  );
  const peerReceivedByTeam = new Map<string, typeof peerReceivedRows>();
  for (const row of peerReceivedRows) {
    const tid = row.team_id as string;
    const list = peerReceivedByTeam.get(tid) ?? [];
    list.push(row);
    peerReceivedByTeam.set(tid, list);
  }
  const peerReceivedKeywordsByTeam = new Map<string, { text: string; count: number }[]>();
  const peerReceivedSnippetByTeam = new Map<string, string>();
  for (const [tid, rows] of peerReceivedByTeam) {
    const keywords = aggregatePeerReviewKeywords(rows);
    if (keywords.length > 0) peerReceivedKeywordsByTeam.set(tid, keywords);
    const snippet = flattenPeerReviewsSnippet(rows);
    if (snippet) peerReceivedSnippetByTeam.set(tid, snippet);
  }

  const profStudentRows = (profStudentResult.error ? [] : (profStudentResult.data ?? [])).filter(
    (row) => includedTeamIds.has(row.team_id)
  );
  const profStudentCommentByTeam = new Map<string, string>();
  for (const row of profStudentRows) {
    const comment = (row.comment as string)?.trim();
    if (comment) profStudentCommentByTeam.set(row.team_id as string, comment);
  }

  const profProjectRows = (profProjectResult.error ? [] : (profProjectResult.data ?? [])).filter(
    (row) => includedTeamIds.has(row.team_id)
  );
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
    (memberships ?? [])
      .filter((m) => includedTeamIds.has(m.team_id))
      .map((m) => [m.team_id, m.role ?? "팀원"])
  );

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
      deliverableFileNames: deliverables
        .filter((d) => d.team_id === team.id)
        .map((d) => d.file_name)
        .filter((name): name is string => Boolean(name?.trim()))
        .slice(0, 5),
      sampleProblems: problems,
      feedbackSubmitted: feedbackTeamIds.has(team.id),
      feedbackSnippet: feedbackSnippetByTeam.get(team.id),
      retrospectiveSubmitted: retroTeamIds.has(team.id),
      retrospectiveSnippet: retroSnippetByTeam.get(team.id),
      peerReviewsSubmitted: peerCountByTeam.get(team.id) ?? 0,
      peerReviewSnippet: peerSnippetByTeam.get(team.id),
      peerReviewsReceived: peerReceivedKeywordsByTeam.get(team.id) ?? [],
      peerReviewReceivedSnippet: peerReceivedSnippetByTeam.get(team.id),
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
    deliverableFileNames: deliverables
      .map((d) => d.file_name)
      .filter((name): name is string => Boolean(name?.trim())),
  };
}

function formatProblemSolvedLine(caseItem: AiReportTroubleshootingCase): string {
  const segments: string[] = [caseItem.problem.trim()];
  const action = caseItem.action.trim();
  const result = caseItem.result.trim();
  if (action && action !== "(대응 계획 미기록)") {
    segments.push(`대응: ${truncateSnippet(action, 80)}`);
  }
  if (result && !result.startsWith("진행 중")) {
    segments.push(`결과: ${truncateSnippet(result, 80)}`);
  }
  return `[${caseItem.projectTitle}] ${segments.join(" — ")}`;
}

function buildProblemsSolvedDraft(context: AiReportContext): string[] {
  if (context.troubleshootingCases.length > 0) {
    return context.troubleshootingCases.map(formatProblemSolvedLine);
  }
  const sampleProblems = context.teams.flatMap((t) => t.sampleProblems).slice(0, 8);
  if (sampleProblems.length > 0) {
    return sampleProblems.map((p) => truncateSnippet(p, 160));
  }
  return ["등록된 트러블슈팅 로그가 없습니다."];
}

function extractDeliverableExtensions(fileNames: string[]): string[] {
  const extensions = new Set<string>();
  for (const name of fileNames) {
    const match = name.trim().match(/\.([a-z0-9]{1,8})$/i);
    if (match) extensions.add(match[1].toLowerCase());
  }
  return Array.from(extensions).sort();
}

export function buildTechnologiesDraft(context: AiReportContext): string[] {
  const fromSkills = context.skills.map((s) => s.trim()).filter(Boolean);
  const fromFiles = extractDeliverableExtensions(context.deliverableFileNames).map(
    (ext) => `산출물 .${ext}`
  );
  const merged = Array.from(new Set([...fromSkills, ...fromFiles]));
  if (merged.length > 0) return merged;
  if (context.totalDeliverables > 0) {
    return [`팀 산출물 ${context.totalDeliverables}건 (프로필 기술 스택·파일명을 추가하면 더 풍부해집니다)`];
  }
  return ["(프로필에 기술 스택을 추가해 주세요)"];
}

function buildTeamSectionBody(
  team: AiReportTeamSnapshot,
  cases: AiReportTroubleshootingCase[]
): string {
  const teamCases = cases.filter((c) => c.teamId === team.teamId).slice(0, 3);
  const lines: string[] = [
    `수업: ${team.courseName}`,
    `역할: ${team.memberRole}`,
    `트러블슈팅 ${team.troubleshootingCount}건 · 산출물 ${team.deliverableCount}건 · 피드백 ${team.feedbackSubmitted ? "완료" : "미제출"} · 회고 ${team.retrospectiveSubmitted ? "완료" : "미제출"} · 동료평가 ${team.peerReviewsSubmitted}건 · 교수평가 ${team.professorStudentEvalReceived || team.professorProjectEvalReceived ? "있음" : "없음"}`,
  ];

  if (team.deliverableFileNames.length > 0) {
    lines.push(`산출물: ${team.deliverableFileNames.join(", ")}`);
  }

  for (const caseItem of teamCases) {
    lines.push(`트러블슈팅: ${formatProblemSolvedLine(caseItem)}`);
  }

  if (teamCases.length === 0 && team.sampleProblems.length > 0) {
    lines.push(`주요 이슈: ${team.sampleProblems.join(" / ")}`);
  }

  if (team.feedbackSnippet) lines.push(`팀 피드백: ${team.feedbackSnippet}`);
  if (team.peerReviewSnippet) lines.push(`동료평가: ${team.peerReviewSnippet}`);
  if (team.retrospectiveSnippet) lines.push(`회고 요약: ${team.retrospectiveSnippet}`);
  if (team.professorFeedbackSnippet) lines.push(`교수 피드백: ${team.professorFeedbackSnippet}`);

  return lines.filter(Boolean).join("\n");
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

/** 마이페이지·A4 미리보기 공통 집계 한 줄 */
export function formatReportActivitySummary(context: AiReportContext): string {
  return `집계: 트러블슈팅 ${context.totalTroubleshootingLogs}건 · 산출물 ${context.totalDeliverables}건 · 피드백 ${context.totalFeedbacksSubmitted} · 회고 ${context.totalRetrospectivesSubmitted} · 동료평가 ${context.totalPeerReviewsSubmitted} · 교수평가 ${context.totalProfessorStudentEvalsReceived}/${context.totalProfessorProjectEvalsReceived}팀`;
}

function averageTeamProgress(context: AiReportContext): number {
  if (context.teams.length === 0) return 0;
  return Math.round(
    context.teams.reduce((sum, team) => sum + team.progress, 0) / context.teams.length
  );
}

export interface MyPageSummaryCard {
  label: string;
  value: string;
  note: string;
}

export interface MyPageCompetencyItem {
  label: string;
  value: number;
  desc: string;
}

export interface MyPageActivityBullet {
  title: string;
  body: string;
}

function clampCompetencyScore(score: number): number {
  return Math.max(40, Math.min(98, Math.round(score)));
}

/** 마이페이지 PAGE 01 상단 카드 4종 (A4 집계와 동일 기준) */
export function buildMyPageSummaryCards(context: AiReportContext): MyPageSummaryCard[] {
  const collaborationTotal =
    context.totalFeedbacksSubmitted +
    context.totalRetrospectivesSubmitted +
    context.totalPeerReviewsSubmitted;

  return [
    {
      label: "참여 팀 프로젝트",
      value: `${context.teams.length}건`,
      note: "Supabase 팀 멤버십 기준",
    },
    {
      label: "평균 진행률",
      value: `${averageTeamProgress(context)}%`,
      note: "팀 progress 평균",
    },
    {
      label: "트러블슈팅",
      value: `${context.totalTroubleshootingLogs}건`,
      note: `산출물 ${context.totalDeliverables}건`,
    },
    {
      label: "협업 제출",
      value: `${collaborationTotal}건`,
      note: `교수평가 ${context.totalProfessorStudentEvalsReceived}/${context.totalProfessorProjectEvalsReceived}팀`,
    },
  ];
}

/** 마이페이지 PAGE 03 소개 문단 */
export function buildMyPagePage3Intro(context: AiReportContext): string {
  if (context.troubleshootingCases.length === 0) {
    return `${context.userName}님의 문제해결 경험은 단순 오류 수정이 아니라, 원인 파악·구조 재정리·재발 방지까지 이어지는 방식으로 기록됩니다. (DB 트러블슈팅 로그가 없어 예시 사례를 표시합니다.)`;
  }

  const resolvedCount = context.troubleshootingCases.filter(
    (c) => c.status === "resolved"
  ).length;

  return `${context.userName}님의 트러블슈팅 ${context.troubleshootingCases.length}건(해결 ${resolvedCount}건)이 팀 워크스페이스에 기록되어 있습니다. 아래는 실제 problem · plan · solution 필드입니다.`;
}

/** 마이페이지 PAGE 01 핵심 역량 진단 (DB 활동 기반 추정 점수) */
export function buildMyPageCompetencyItems(context: AiReportContext): MyPageCompetencyItem[] {
  const teamCount = Math.max(context.teams.length, 1);
  const avgProgress = averageTeamProgress(context);
  const deliverablePerTeam = context.totalDeliverables / teamCount;
  const collaborationTotal =
    context.totalFeedbacksSubmitted +
    context.totalRetrospectivesSubmitted +
    context.totalPeerReviewsSubmitted;
  const collaborationDenom = Math.max(teamCount * 3, 1);
  const resolvedCount = context.troubleshootingCases.filter((c) => c.status === "resolved").length;
  const resolvedRate =
    context.troubleshootingCases.length > 0
      ? resolvedCount / context.troubleshootingCases.length
      : 0;

  const executionScore = clampCompetencyScore(avgProgress * 0.75 + deliverablePerTeam * 8);
  const collaborationScore = clampCompetencyScore(48 + (collaborationTotal / collaborationDenom) * 48);
  const techScore = clampCompetencyScore(
    45 + context.skills.length * 5 + deliverablePerTeam * 10
  );
  const problemSolvingScore = clampCompetencyScore(
    42 + context.totalTroubleshootingLogs * 6 + resolvedRate * 35
  );

  return [
    {
      label: "프로젝트 실행력",
      value: executionScore,
      desc: `팀 평균 진행률 ${avgProgress}% · 산출물 ${context.totalDeliverables}건 (DB 추정)`,
    },
    {
      label: "협업 신뢰도",
      value: collaborationScore,
      desc: `피드백·회고·동료평가 제출 ${collaborationTotal}건 (DB 추정)`,
    },
    {
      label: "기술·산출물",
      value: techScore,
      desc: `프로필 스택 ${context.skills.length}개 · 팀당 산출물 ${deliverablePerTeam.toFixed(1)}건`,
    },
    {
      label: "문제 해결/회고",
      value: problemSolvingScore,
      desc: `트러블슈팅 ${context.totalTroubleshootingLogs}건 · 해결 ${resolvedCount}건 (DB 추정)`,
    },
  ];
}

/** 마이페이지 PAGE 01 간략 활동 요약 3줄 */
export function buildMyPageActivityBullets(context: AiReportContext): MyPageActivityBullet[] {
  const avgProgress = averageTeamProgress(context);
  return [
    {
      title: "프로젝트",
      body: `${context.teams.length}개 팀 참여 · 평균 진행률 ${avgProgress}%`,
    },
    {
      title: "기록",
      body: `트러블슈팅 ${context.totalTroubleshootingLogs}건 · 산출물 ${context.totalDeliverables}건`,
    },
    {
      title: "협업",
      body: `피드백 ${context.totalFeedbacksSubmitted} · 회고 ${context.totalRetrospectivesSubmitted} · 동료평가 ${context.totalPeerReviewsSubmitted} · 교수평가 ${context.totalProfessorStudentEvalsReceived}/${context.totalProfessorProjectEvalsReceived}팀`,
    },
  ];
}

/** A4·마이페이지 공통 요약 문장 (LLM 없음) */
export function buildReportSummaryDraft(context: AiReportContext): string {
  return context.teams.length > 0
    ? `${context.userName}님은 ${context.teams.length}개 팀 프로젝트에 참여했습니다. 트러블슈팅 ${context.totalTroubleshootingLogs}건, 산출물 ${context.totalDeliverables}건, 팀 피드백 ${context.totalFeedbacksSubmitted}건, 회고록 ${context.totalRetrospectivesSubmitted}건, 동료평가 ${context.totalPeerReviewsSubmitted}건, 교수 평가(학생 ${context.totalProfessorStudentEvalsReceived}팀·프로젝트 ${context.totalProfessorProjectEvalsReceived}팀)가 기록되어 있습니다.`
    : `${context.userName}님의 팀 활동 기록이 아직 없습니다. 팀에 배정된 뒤 다시 생성해 보세요.`;
}

/** 리포트 집계 → 마이페이지 프로젝트 카드 (PAGE 02·getProjectsForUser) */
export function mapReportContextToMyPageProjects(context: AiReportContext): MyPageProject[] {
  return context.teams.map((team) => {
    const contributions = [
      `트러블슈팅 ${team.troubleshootingCount}건`,
      `산출물 ${team.deliverableCount}건`,
      ...team.deliverableFileNames.slice(0, 2).map((name) => `파일: ${name}`),
      ...(team.feedbackSubmitted ? ["팀 피드백 완료"] : []),
      ...(team.retrospectiveSubmitted ? ["회고록 완료"] : []),
      ...(team.peerReviewsSubmitted > 0 ? [`동료평가 ${team.peerReviewsSubmitted}건`] : []),
      ...team.sampleProblems.slice(0, 2),
    ];

    return {
      title: team.projectTitle,
      subtitle: `${team.courseName} · ${team.teamName}`,
      tags: [team.memberRole, "Supabase 집계"],
      period: `진행률 ${team.progress}%`,
      role: team.memberRole,
      completionRate: Math.min(100, Math.max(0, team.progress)),
      contributions,
      problemCase: {
        problem: team.sampleProblems[0] ?? "등록된 트러블슈팅 없음",
        solution: team.sampleProblems[1] ?? "—",
        result: team.professorFeedbackSnippet
          ? `교수 피드백: ${team.professorFeedbackSnippet}`
          : "팀 워크스페이스 DB 기록",
      },
      techStack:
        context.skills.length > 0
          ? context.skills
          : team.deliverableFileNames.length > 0
            ? ["산출물 업로드"]
            : [],
      insights:
        team.peerReviewReceivedSnippet
          ? `동료평가 수신: ${team.peerReviewReceivedSnippet}`
          : "참여 팀·트러블슈팅·산출물·협업 제출 메타를 자동 집계한 카드입니다.",
      peerReviews:
        team.peerReviewsReceived.length > 0
          ? team.peerReviewsReceived
          : team.peerReviewSnippet
            ? [{ text: team.peerReviewSnippet, count: 1 }]
            : [],
      professorReview: team.professorFeedbackSnippet ?? "",
    };
  });
}

/** 마이페이지 PAGE 01 요약 문단 (A4 summary + 평균 진행률) */
export function buildMyPageSummaryParagraph(context: AiReportContext): string {
  const base = buildReportSummaryDraft(context);
  if (context.teams.length === 0) return base;
  return `${base} 평균 진행률은 ${averageTeamProgress(context)}%입니다.`;
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

  return {
    summary: buildReportSummaryDraft(context),
    problems_solved: buildProblemsSolvedDraft(context),
    technologies: buildTechnologiesDraft(context),
    role_description:
      teamLines.length > 0
        ? teamLines.join("\n")
        : "참여한 팀 프로젝트가 없습니다.",
    growth_reflection: buildGrowthReflectionDraft(context),
    sections: context.teams.map((t) => ({
      title: `${t.projectTitle}`,
      body: buildTeamSectionBody(t, context.troubleshootingCases),
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
