/**
 * =============================================================================
 * generate-report — 마이페이지 "AI 리포트 생성" 서버 프로그램
 * =============================================================================
 *
 * [이 파일이 하는 일]
 *   웹앱(마이페이지)에서 "AI 리포트 생성" 버튼을 누르면, 이 코드가 Supabase
 *   클라우드에서 실행됩니다. 학생 한 명(userId)의 DB 기록을 모아서
 *   포트폴리오용 리포트 JSON을 만들어 돌려줍니다.
 *
 * [실행 흐름 — 큰 그림]
 *   1) 요청 받기 (POST, body에 userId)
 *   2) DB에서 팀·트러블슈팅·피드백·회고 등 수집 (gatherContext)
 *   3) AI API 키가 있으면 → Gemini 또는 OpenAI로 문단 생성
 *      키가 없으면 → DB 숫자만으로 초안 문장 조립 (draft-db-only)
 *   4) JSON 응답 반환
 *
 * [배포]
 *   터미널: supabase functions deploy generate-report
 *   Secret: GEMINI_API_KEY (우선) 또는 OPENAI_API_KEY (예전 방식)
 */

// Supabase DB에 접속하는 라이브러리 (인터넷에서 불러옴 — Deno Edge 환경 방식)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * CORS: 브라우저가 "다른 도메인 API"를 호출할 때 허용 헤더.
 * 웹앱(Vercel 등) → Supabase Edge URL 호출 시 필요합니다.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** 클라이언트(마이페이지)가 보내는 요청 body 형태 */
type GenerateRequest = {
  userId?: string; // ai_users 테이블의 학생 UUID
  locale?: "ko" | "en"; // 리포트 문장 언어
};

/** 리포트 한 섹션 (프로젝트별 제목 + 본문) */
type ReportSection = { title: string; body: string };

/** AI가 생성한 프로젝트별 상세 분석 */
type PerProject = {
  team_id?: string;
  project_title: string;
  overview: string;
  core_value: string;
  my_experience: string;
  eval_summary: string;
};

/** 최종적으로 웹앱에 돌려주는 리포트 JSON 구조 */
type ReportResponse = {
  summary: string;
  problems_solved: string[];
  technologies: string[];
  role_description: string;
  growth_reflection: string;
  sections?: ReportSection[];
  per_project?: PerProject[];
  problem_discovery_pattern?: string;
  resolution_style?: string;
  generated_at: string;
  model?: string;
};

/** JSON 응답을 브라우저에 보내기 위한 공통 포맷 (상태 코드 + CORS 헤더) */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** DB에 배열이 아닌 값이 들어와도, 문자열 배열만 안전하게 꺼냄 */
function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * "테이블이 아직 없음" 오류인지 확인.
 * 마이그레이션 전 환경에서는 피드백·회고 테이블이 없을 수 있어, 그때는 빈 배열로 넘깁니다.
 */
function isMissingRelationError(error: { code?: string; message?: string }) {
  return error?.code === "42P01" || (error?.message?.includes("does not exist") ?? false);
}

/** 긴 텍스트를 max 글자로 자르고 끝에 … 붙임 (AI·초안에 넣기 전 정리용) */
function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** 팀 피드백 한 건 → 한 줄 요약 문자열 */
function flattenFeedbackSnippet(row: {
  selected_options?: unknown;
  custom_text?: string | null;
}): string {
  const options = asStringArray(row.selected_options);
  const custom = row.custom_text?.trim() ?? "";
  return truncateText([...options, custom].filter(Boolean).join(", "), 120);
}

/** 동료평가 여러 건 → "강점:… · 보완:…" 형태 한 줄 */
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

/** 회고록 JSON 안의 섹션 이름 (역할, 강점, 아쉬운 점, 성장) */
const RETROSPECTIVE_SECTION_KEYS = ["role", "strengths", "regrets", "growth"] as const;

/** 회고록 sections 객체 → 한 줄 요약 */
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
    const text = custom || auto; // 직접 쓴 글 우선, 없으면 자동 생성 문장
    if (text) parts.push(text);
  }
  const joined = parts.join(" · ");
  return joined.length > 200 ? `${joined.slice(0, 200)}…` : joined;
}

/** 교수 프로젝트 평가에 실제 코멘트가 하나라도 있는지 */
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

/**
 * gatherContext — 리포트의 재료가 되는 모든 DB 데이터를 한 번에 모음
 *
 * @param supabase - DB 클라이언트 (서비스 역할 키로 RLS 우회 가능)
 * @param userId   - 리포트 대상 학생 ID
 * @returns user 정보, 팀별 스냅샷, 트러블슈팅 로그, 각종 건수
 */
async function gatherContext(supabase: ReturnType<typeof createClient>, userId: string) {
  // ① 학생 기본 프로필
  const { data: user, error: userError } = await supabase
    .from("ai_users")
    .select("id, name, email, major, skills")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) throw new Error("사용자를 찾을 수 없습니다.");

  // ② 이 학생이 속한 팀 목록 (team_id, 역할)
  const { data: memberships, error: memError } = await supabase
    .from("ai_team_members")
    .select("team_id, role")
    .eq("user_id", userId);

  if (memError) throw memError;

  const teamIds = Array.from(
    new Set((memberships ?? []).map((m) => m.team_id).filter(Boolean))
  ) as string[];

  // 팀이 하나도 없으면 빈 컨텍스트 반환 (아래 AI/초안은 "활동 없음" 문구 사용)
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

  // ③ 여러 테이블을 동시에 조회 (Promise.all = 병렬 → 빠름)
  const [
    teamsResult,
    logsResult,
    deliverablesResult,
    feedbacksResult,
    retrosResult,
    peerResult,
    profStudentResult,
    profProjectResult,
    aiMemoryResult,
  ] = await Promise.all([
    supabase
      .from("ai_teams")
      .select("id, name, project_title, progress, course_id")
      .in("id", teamIds),
    supabase
      .from("ai_team_detail_troubleshooting_logs")
      .select("id, team_id, problem, plan, solution, status")
      .in("team_id", teamIds)
      .eq("author_user_id", userId)
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
    supabase
      .from("ai_team_detail_ai_memory")
      .select("team_id, memory_markdown")
      .in("team_id", teamIds),
  ]);

  // 치명적 오류는 throw; "테이블 없음"은 해당 항목만 0건 처리
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

  // ③-b AI 메모리에서 project_content / project_value 추출
  const aiMemoryRows = (aiMemoryResult.error ? [] : (aiMemoryResult.data ?? []));
  const projectContentByTeam = new Map<string, string>();
  const projectValueByTeam = new Map<string, string>();
  for (const row of aiMemoryRows) {
    const tid = row.team_id as string;
    const md = (row.memory_markdown as string) ?? "";
    const contentMatch = md.match(/##\s*프로젝트 내용\s*\n([\s\S]*?)(?=\n##|\s*$)/);
    const valueMatch = md.match(/##\s*프로젝트 핵심 가치\s*\n([\s\S]*?)(?=\n##|\s*$)/);
    if (contentMatch?.[1]?.trim()) projectContentByTeam.set(tid, contentMatch[1].trim());
    if (valueMatch?.[1]?.trim()) projectValueByTeam.set(tid, valueMatch[1].trim());
  }

  // ④ 팀별로 피드백·회고·동료평가를 Map에 정리 (team_id → 요약 문자열)
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

  // ⑤ 수업 이름 조회 (course_id → ai_courses.name)
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

  // ⑥ 팀 하나당 리포트에 쓸 객체로 합치기 (AI·초안 공통 형식)
  const teams = (teamsResult.data ?? []).map((team) => {
    const profEvalRow = profProjectRows.find((r) => r.team_id === team.id);
    const studentComment = profStudentCommentByTeam.get(team.id);
    const holistic = profEvalRow?.holistic_comment?.trim();
    const completion = profEvalRow?.completion_comment?.trim();
    const problemSolving = profEvalRow?.problem_solving_comment?.trim();

    // 교수 피드백 — 디스플레이용 (짧게) vs LLM용 (더 길게)
    const profSnippetParts = [studentComment, holistic].filter(Boolean) as string[];
    const profFullParts = [
      studentComment ? `학생 평가: ${studentComment}` : "",
      completion ? `완성도: ${completion}` : "",
      problemSolving ? `문제해결: ${problemSolving}` : "",
      holistic ? `종합: ${holistic}` : "",
    ].filter(Boolean) as string[];

    return {
      teamId: team.id,
      teamName: team.name,
      projectTitle: team.project_title ?? team.name,
      courseName: courseNameById.get(team.course_id) ?? "수업",
      memberRole: roleByTeam.get(team.id) ?? "팀원",
      progress: team.progress ?? 0,
      troubleshootingCount: (logsResult.data ?? []).filter((l) => l.team_id === team.id).length,
      deliverableCount: (deliverablesResult.data ?? []).filter((d) => d.team_id === team.id).length,
      feedbackSubmitted: feedbackTeamIds.has(team.id),
      feedbackSnippet: feedbackSnippetByTeam.get(team.id),
      retrospectiveSubmitted: retroTeamIds.has(team.id),
      retrospectiveSnippet: retroSnippetByTeam.get(team.id),
      /** LLM용 회고록 원문 (잘리지 않음) */
      retrospectiveFull: retroSnippetByTeam.get(team.id),
      peerReviewsSubmitted: peerCountByTeam.get(team.id) ?? 0,
      peerReviewSnippet: peerSnippetByTeam.get(team.id),
      professorStudentEvalReceived: profStudentCommentByTeam.has(team.id),
      professorProjectEvalReceived: profProjectTeamIds.has(team.id),
      professorFeedbackSnippet: (() => {
        if (profSnippetParts.length === 0) return undefined;
        const joined = profSnippetParts.join(" · ");
        return joined.length > 120 ? `${joined.slice(0, 120)}…` : joined;
      })(),
      /** LLM용 교수 피드백 원문 (항목 구분) */
      professorFeedbackFull: profFullParts.length > 0 ? profFullParts.join(" / ") : undefined,
      /** recommend-troubleshooting 메모리에서 추출한 프로젝트 설명 */
      projectContent: projectContentByTeam.get(team.id),
      projectValue: projectValueByTeam.get(team.id),
    };
  });

  // 트러블슈팅은 최대 12건만, problem이 비어 있지 않은 것만
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

/** gatherContext가 돌려주는 객체의 타입 (TypeScript 자동 추론) */
type EdgeGatherContext = Awaited<ReturnType<typeof gatherContext>>;

/** teams 배열 원소 타입 (buildDraftReportFromEdgeContext 내 캐스팅용) */
type TeamShape = {
  teamId: string;
  teamName: string;
  projectTitle: string;
  courseName: string;
  memberRole: string;
  progress: number;
  troubleshootingCount: number;
  deliverableCount: number;
  feedbackSnippet?: string;
  retrospectiveSnippet?: string;
  peerReviewSnippet?: string;
  peerReviewsReceived?: { text: string; count: number }[];
  professorFeedbackSnippet?: string;
};

/**
 * buildDraftReportFromEdgeContext — AI API 키가 없을 때 쓰는 "DB만" 초안
 *
 * OpenAI/Gemini를 호출하지 않고, 건수·스니펫을 템플릿 문장으로 이어 붙입니다.
 * 웹앱 마이페이지의 로컬 미리보기와 같은 목적입니다.
 * model 필드는 "draft-db-only" 로 표시됩니다.
 */
function buildDraftReportFromEdgeContext(ctx: EdgeGatherContext): ReportResponse {
  const userName = String(ctx.user.name ?? "학생");
  const skills = asStringArray(ctx.user.skills);
  const teamCount = ctx.teams.length;
  const logCount = ctx.logs.length;

  const summary =
    teamCount > 0
      ? `${userName}님은 ${teamCount}개 팀 프로젝트에 참여했습니다. 트러블슈팅 ${logCount}건, 산출물 ${ctx.deliverableCount}건, 팀 피드백 ${ctx.feedbackCount}건, 회고록 ${ctx.retrospectiveCount}건, 동료평가 ${ctx.peerReviewCount}건, 교수 평가(학생 ${ctx.professorStudentEvalCount}팀·프로젝트 ${ctx.professorProjectEvalCount}팀)가 기록되어 있습니다.`
      : `${userName}님의 팀 활동 기록이 아직 없습니다. 팀에 배정된 뒤 다시 생성해 보세요.`;

  const problems_solved =
    logCount > 0
      ? ctx.logs.map((log) => {
          const problem = String(log.problem ?? "").trim();
          const plan = String(log.plan ?? "").trim();
          const solution = String(log.solution ?? "").trim();
          const parts = [problem];
          if (plan) parts.push(`대응: ${truncateText(plan, 80)}`);
          if (solution) parts.push(`결과: ${truncateText(solution, 80)}`);
          return parts.join(" — ");
        })
      : ["등록된 트러블슈팅 로그가 없습니다."];

  const technologies =
    skills.length > 0
      ? skills
      : ctx.deliverableCount > 0
        ? [`팀 산출물 ${ctx.deliverableCount}건`]
        : ["(프로필에 기술 스택을 추가해 주세요)"];

  const role_description =
    teamCount > 0
      ? ctx.teams
          .map((t) => {
            const team = t as TeamShape;
            return `${team.courseName} · ${team.projectTitle} (${team.memberRole}, 진행 ${team.progress}%, 트러블슈팅 ${team.troubleshootingCount}건, 산출물 ${team.deliverableCount}건)`;
          })
          .join("\n")
      : "참여한 팀 프로젝트가 없습니다.";

  const growthLines: string[] = [];
  for (const t of ctx.teams) {
    const team = t as TeamShape;
    const parts: string[] = [];
    if (team.retrospectiveSnippet) parts.push(`회고 — ${team.retrospectiveSnippet}`);
    if (team.professorFeedbackSnippet) parts.push(`교수 평가 — ${team.professorFeedbackSnippet}`);
    if (team.feedbackSnippet) parts.push(`팀 피드백 — ${team.feedbackSnippet}`);
    if (team.peerReviewSnippet) parts.push(`동료평가 — ${team.peerReviewSnippet}`);
    if (parts.length > 0) growthLines.push(`[${team.projectTitle}] ${parts.join(" / ")}`);
  }

  const growth_reflection =
    growthLines.length > 0
      ? `${growthLines.join("\n")}\n\n(DB 활동 기반 초안입니다. GEMINI_API_KEY 등록 후 AI가 문단을 다듬습니다.)`
      : logCount > 0
        ? `트러블슈팅 ${logCount}건이 기록되어 있습니다. (GEMINI_API_KEY 등록 후 AI 문단 생성)`
        : "팀 활동·회고·평가 기록을 쌓으면 성장 회고 초안이 채워집니다.";

  const sections = ctx.teams.map((t) => {
    const team = t as TeamShape;
    return {
      title: String(team.projectTitle),
      body: [
        `수업: ${team.courseName}`,
        `역할: ${team.memberRole}`,
        `트러블슈팅 ${team.troubleshootingCount}건 · 산출물 ${team.deliverableCount}건`,
        team.feedbackSnippet ? `팀 피드백: ${team.feedbackSnippet}` : "",
        team.retrospectiveSnippet ? `회고 요약: ${team.retrospectiveSnippet}` : "",
        team.professorFeedbackSnippet ? `교수 피드백: ${team.professorFeedbackSnippet}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  });

  // per_project 드래프트 (AI 없이 DB 데이터로 구성)
  const per_project: PerProject[] = ctx.teams.map((t) => {
    const team = t as TeamShape;
    const peerKeywords = (team.peerReviewsReceived ?? []) as { text: string; count: number }[];
    const evalParts: string[] = [];
    if (team.professorFeedbackSnippet) evalParts.push(`교수: ${team.professorFeedbackSnippet}`);
    if (peerKeywords.length > 0) {
      evalParts.push(`동료 키워드: ${peerKeywords.map((k) => `${k.text}(${k.count})`).join(", ")}`);
    } else if (team.peerReviewSnippet) {
      evalParts.push(`동료평가: ${team.peerReviewSnippet}`);
    }

    return {
      team_id: String(team.teamId ?? ""),
      project_title: String(team.projectTitle),
      overview: `${team.courseName}에서 진행한 ${team.projectTitle}. 진행률 ${team.progress}%, 산출물 ${team.deliverableCount}건.`,
      core_value: (team as TeamShape & { projectValue?: string }).projectValue?.trim()
        ? String((team as TeamShape & { projectValue?: string }).projectValue).trim()
        : team.retrospectiveSnippet
          ? team.retrospectiveSnippet
          : `트러블슈팅 ${team.troubleshootingCount}건 해결을 통한 실전 경험 축적.`,
      my_experience: `역할: ${team.memberRole}. 트러블슈팅 ${team.troubleshootingCount}건, 산출물 ${team.deliverableCount}건 기여.${team.feedbackSnippet ? ` 팀 피드백: ${team.feedbackSnippet}` : ""}`,
      eval_summary: evalParts.length > 0 ? evalParts.join(" / ") : "평가 기록 없음.",
    };
  });

  // problem_discovery_pattern 드래프트
  const resolvedLogs = ctx.logs.filter((l) => String(l.status) === "resolved");
  const problem_discovery_pattern =
    logCount > 0
      ? `총 ${logCount}건의 문제를 발굴·기록했습니다. 주요 문제: ${ctx.logs.slice(0, 3).map((l) => truncateText(String(l.problem ?? ""), 50)).join(" / ")}.`
      : "트러블슈팅 로그가 없습니다.";

  // resolution_style 드래프트
  const resolution_style =
    resolvedLogs.length > 0
      ? `${logCount}건 중 ${resolvedLogs.length}건 해결(${Math.round((resolvedLogs.length / logCount) * 100)}%). problem → plan → solution 구조로 접근.`
      : logCount > 0
        ? `${logCount}건 진행 중. (GEMINI_API_KEY 등록 후 AI가 해결 패턴을 분석합니다.)`
        : "해결 이력이 없습니다.";

  return {
    summary,
    problems_solved,
    technologies,
    role_description,
    growth_reflection,
    sections: sections.length > 0 ? sections : undefined,
    per_project: per_project.length > 0 ? per_project : undefined,
    problem_discovery_pattern,
    resolution_style,
    generated_at: new Date().toISOString(),
    model: "draft-db-only",
  };
}

/** Gemini 기본 모델 이름 (Secret GEMINI_MODEL 없을 때) */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** AI에게 넘길 JSON payload (학생 + 팀 + 로그 + 건수) */
function buildLlmReportPayload(context: EdgeGatherContext) {
  return {
    student: {
      name: context.user.name,
      email: context.user.email,
      major: context.user.major,
      skills: asStringArray(context.user.skills),
    },
    teams: context.teams.map((t) => ({
      ...t,
      project_content: (t as Record<string, unknown>).projectContent ?? null,
      project_value: (t as Record<string, unknown>).projectValue ?? null,
    })),
    troubleshooting_logs: context.logs,
    deliverable_count: context.deliverableCount,
    feedback_count: context.feedbackCount,
    retrospective_count: context.retrospectiveCount,
    peer_review_count: context.peerReviewCount,
    professor_student_eval_count: context.professorStudentEvalCount,
    professor_project_eval_count: context.professorProjectEvalCount,
  };
}

/** AI에게 주는 "시스템 지시" — JSON만, 사실만, 키 이름 고정 */
function buildReportSystemPrompt(locale: "ko" | "en"): string {
  const lang = locale === "en" ? "English" : "Korean";
  return `You are an expert at writing university student portfolio reports. Respond in ${lang}. Return ONLY valid JSON with exactly these keys:

{
  "summary": string,                  // 2-3 sentences: overall participation and highlights
  "problems_solved": string[],        // each item: "[ProjectTitle] problem — action — result"
  "technologies": string[],           // tech stack and tools used
  "role_description": string,         // one line per team: "CourseName · ProjectTitle (role, progress%, X troubleshootings, Y deliverables)"
  "growth_reflection": string,        // 2-3 sentences synthesizing retrospectives, feedback, and peer reviews
  "sections": [{"title": string, "body": string}],  // one section per team
  "per_project": [                    // one object per team — MUST echo team_id from input
    {
      "team_id": string,
      "project_title": string,
      "overview": "2 sentences describing the project context, goal, and outcome",
      "core_value": "1-2 sentences: what key value or learning this project provided",
      "my_experience": "2-3 sentences: the student's specific role, contributions, and what they personally did",
      "eval_summary": "1-2 sentences synthesizing peer review keywords + professor feedback for this project"
    }
  ],
  "problem_discovery_pattern": string,  // 2-3 sentences: what types of problems this student tends to identify and tackle
  "resolution_style": string            // 2-3 sentences: how this student characteristically solves problems (methodology, thoroughness, speed)
}

Rules:
- Use ONLY data provided. Do not invent facts.
- per_project must have one entry per team in the input teams array.
- team_id in per_project must exactly match the teamId field from the input teams array.
- If retrospectiveFull or professorFeedbackFull fields exist in a team, prefer those over snippet fields for richer analysis.
- If a team has project_content or project_value fields, use them as primary sources for the per_project.overview and per_project.core_value fields. These were extracted from actual uploaded documents (PDFs, slides, docs).
- problem_discovery_pattern and resolution_style must be based on the troubleshooting_logs array.
- If troubleshooting_logs is empty, say so honestly.`;
}

/** AI가 준 JSON을 ReportResponse 형태로 정리 (빈 필드는 기본값) */
function mapParsedReport(
  parsed: Partial<ReportResponse>,
  context: EdgeGatherContext,
  model: string
): ReportResponse {
  const validPerProject = Array.isArray(parsed.per_project)
    ? (parsed.per_project as unknown[]).filter(
        (p): p is PerProject =>
          Boolean(p) &&
          typeof p === "object" &&
          typeof (p as PerProject).project_title === "string" &&
          typeof (p as PerProject).overview === "string"
      )
    : undefined;

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
    per_project: validPerProject && validPerProject.length > 0 ? validPerProject : undefined,
    problem_discovery_pattern:
      typeof parsed.problem_discovery_pattern === "string"
        ? parsed.problem_discovery_pattern
        : undefined,
    resolution_style:
      typeof parsed.resolution_style === "string" ? parsed.resolution_style : undefined,
    generated_at: new Date().toISOString(),
    model,
  };
}

/** Google Gemini API 호출 → 리포트 JSON */
async function callGemini(
  apiKey: string,
  modelId: string,
  locale: "ko" | "en",
  context: EdgeGatherContext
): Promise<ReportResponse> {
  const payload = buildLlmReportPayload(context);
  const systemPrompt = buildReportSystemPrompt(locale);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
      generationConfig: {
        temperature: 0.4, // 낮을수록 일관된 문장
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

  const parsed = JSON.parse(content) as Partial<ReportResponse>;
  return mapParsedReport(parsed, context, modelId);
}

/** 레거시: OPENAI_API_KEY만 있는 환경용 (gpt-4o-mini) */
async function callOpenAi(
  apiKey: string,
  locale: "ko" | "en",
  context: EdgeGatherContext
): Promise<ReportResponse> {
  const payload = buildLlmReportPayload(context);
  const systemPrompt = buildReportSystemPrompt(locale);

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
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload) },
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
  return mapParsedReport(parsed, context, "gpt-4o-mini");
}

/**
 * Deno.serve — 이 파일의 "진입점" (웹 서버처럼 요청을 받음)
 *
 * 우선순위:
 *   1) GEMINI_API_KEY 있음 → Gemini
 *   2) 없고 OPENAI_API_KEY 있음 → OpenAI
 *   3) 둘 다 없음 → buildDraftReportFromEdgeContext (DB 초안)
 */
Deno.serve(async (req: Request) => {
  // 브라우저 사전 요청 (OPTIONS) — CORS만 응답
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Supabase가 Edge에 자동으로 넣어 주는 환경 변수
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

    const geminiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
    if (geminiKey) {
      const modelId = Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_GEMINI_MODEL;
      const report = await callGemini(geminiKey, modelId, locale, context);
      return jsonResponse(report);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
    if (openaiKey) {
      const report = await callOpenAi(openaiKey, locale, context);
      return jsonResponse(report);
    }

    return jsonResponse(buildDraftReportFromEdgeContext(context));
  } catch (error) {
    console.error("[generate-report]", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "AI 리포트 생성에 실패했습니다." },
      500
    );
  }
});
