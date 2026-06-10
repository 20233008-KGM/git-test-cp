/**
 * vision #35·#46 — 김학생 아카이브 시드·리포트·평가 테이블 점검 (읽기 전용)
 * .env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 필요
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv(envFile);

/** 기본 검증 대상: 마이페이지 시연 김학생 (673b60f9-…) */
const KIM_STUDENT_ID =
  process.env.KIM_STUDENT_VERIFY_ID ?? "673b60f9-3c6c-4ed4-847a-e24536c472a5";
const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "missing_env",
      message: "VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY 가 .env 에 필요합니다.",
    })
  );
  process.exit(1);
}

async function rest(table, query) {
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${table}: HTTP ${res.status} ${text.slice(0, 240)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return text ? JSON.parse(text) : [];
}

function isMissingTableError(err) {
  const msg = err.message ?? "";
  return (
    err.status === 404 ||
    msg.includes("PGRST205") ||
    msg.includes("Could not find the table") ||
    msg.includes("does not exist")
  );
}

async function tryCount(table, query) {
  try {
    const rows = await rest(table, query);
    return { ok: true, count: rows.length };
  } catch (err) {
    if (isMissingTableError(err)) {
      return { ok: false, missing: true, error: err.message };
    }
    return { ok: false, missing: false, error: err.message };
  }
}

try {
  const memberships = await rest(
    "ai_team_members",
    `user_id=eq.${KIM_STUDENT_ID}&select=team_id`
  );
  const teamIds = [...new Set(memberships.map((m) => m.team_id).filter(Boolean))];

  let archivedTeamCount = 0;
  let courseNames = [];
  if (teamIds.length > 0) {
    const teams = await rest(
      "ai_teams",
      `id=in.(${teamIds.join(",")})&select=id,course_id,name`
    );
    const courseIds = [...new Set(teams.map((t) => t.course_id).filter(Boolean))];
    if (courseIds.length > 0) {
      const courses = await rest(
        "ai_courses",
        `id=in.(${courseIds.join(",")})&select=id,name,status`
      );
      const archivedIds = new Set(
        courses.filter((c) => c.status === "archived").map((c) => c.id)
      );
      archivedTeamCount = teams.filter((t) => archivedIds.has(t.course_id)).length;
      courseNames = courses
        .filter((c) => c.status === "archived")
        .map((c) => c.name);
    }
  }

  const tableChecks = {
    ai_team_detail_peer_reviews: { ok: false, count: 0 },
    ai_team_detail_professor_student_evals: { ok: false, count: 0 },
    ai_team_detail_professor_project_evals: { ok: false, count: 0 },
  };

  const evalByArchivedTeam = {};

  if (teamIds.length > 0) {
    const teams = await rest(
      "ai_teams",
      `id=in.(${teamIds.join(",")})&select=id,name,course_id`
    );
    const courseIds = [...new Set(teams.map((t) => t.course_id).filter(Boolean))];
    const courses =
      courseIds.length > 0
        ? await rest(
            "ai_courses",
            `id=in.(${courseIds.join(",")})&select=id,status`
          )
        : [];
    const archivedCourseIds = new Set(
      courses.filter((c) => c.status === "archived").map((c) => c.id)
    );
    const archivedTeams = teams.filter((t) => archivedCourseIds.has(t.course_id));

    const inTeams = `team_id=in.(${teamIds.join(",")})`;
    tableChecks.ai_team_detail_peer_reviews = await tryCount(
      "ai_team_detail_peer_reviews",
      `${inTeams}&reviewer_user_id=eq.${KIM_STUDENT_ID}&select=id`
    );
    tableChecks.ai_team_detail_professor_student_evals = await tryCount(
      "ai_team_detail_professor_student_evals",
      `${inTeams}&student_row_id=eq.${KIM_STUDENT_ID}&select=id`
    );
    tableChecks.ai_team_detail_professor_project_evals = await tryCount(
      "ai_team_detail_professor_project_evals",
      `${inTeams}&select=id`
    );

    for (const team of archivedTeams) {
      const tid = team.id;
      const peer = await tryCount(
        "ai_team_detail_peer_reviews",
        `team_id=eq.${tid}&reviewer_user_id=eq.${KIM_STUDENT_ID}&select=id`
      );
      const profStudent = await tryCount(
        "ai_team_detail_professor_student_evals",
        `team_id=eq.${tid}&student_row_id=eq.${KIM_STUDENT_ID}&select=id`
      );
      const profProject = await tryCount(
        "ai_team_detail_professor_project_evals",
        `team_id=eq.${tid}&select=id`
      );
      const retro = await tryCount(
        "ai_team_detail_retrospectives",
        `team_id=eq.${tid}&author_user_id=eq.${KIM_STUDENT_ID}&select=id`
      );
      evalByArchivedTeam[tid] = {
        teamName: team.name,
        peerReviewsGiven: peer.count ?? 0,
        professorStudentEval: (profStudent.count ?? 0) > 0,
        professorProjectEval: (profProject.count ?? 0) > 0,
        retrospectiveSubmitted: (retro.count ?? 0) > 0,
        ready:
          (peer.count ?? 0) > 0 &&
          (profStudent.count ?? 0) > 0 &&
          (profProject.count ?? 0) > 0,
      };
    }
  }

  const allArchivedTeamsHaveEval =
    Object.keys(evalByArchivedTeam).length === 0 ||
    Object.values(evalByArchivedTeam).every((v) => v.ready);

  let teammateDisplayResolvable = true;
  const teammateDisplayChecks = [];
  if (teamIds.length > 0) {
    const userRows = await rest(`ai_users`, `id=eq.${KIM_STUDENT_ID}&select=name`);
    const kimName = (userRows[0]?.name ?? "김학생").trim();

    for (const tid of teamIds) {
      const inMembers = await tryCount(
        "ai_team_members",
        `team_id=eq.${tid}&user_id=eq.${KIM_STUDENT_ID}&select=user_id`
      );
      const inDetail = await tryCount(
        "ai_team_detail_teammates",
        `team_id=eq.${tid}&name=eq.${encodeURIComponent(kimName)}&select=id`
      );
      const ok = (inMembers.count ?? 0) > 0 && (inDetail.count ?? 0) > 0;
      teammateDisplayChecks.push({
        teamId: tid,
        ok,
        inMembers: (inMembers.count ?? 0) > 0,
        inDetailTeammates: (inDetail.count ?? 0) > 0,
      });
      if (!ok) teammateDisplayResolvable = false;
    }
  }

  const missingTables = Object.entries(tableChecks)
    .filter(([, v]) => v.missing)
    .map(([name]) => name);

  const evalReady =
    missingTables.length === 0 && allArchivedTeamsHaveEval && teammateDisplayResolvable;
  const reportOk = archivedTeamCount > 0;

  let kimTroubleshootingCount = 0;
  let campusConnectDeliverableCount = 0;
  let hasCampusConnectCourse = courseNames.some((n) => n.includes("웹프로그래밍"));
  if (teamIds.length > 0) {
    const ts = await tryCount(
      "ai_team_detail_troubleshooting_logs",
      `team_id=in.(${teamIds.join(",")})&author_user_id=eq.${KIM_STUDENT_ID}&select=id`
    );
    kimTroubleshootingCount = ts.count ?? 0;
    const ccTeam = teamIds.includes("team-swe-schedule") ? "team-swe-schedule" : null;
    if (ccTeam) {
      const dels = await tryCount(
        "ai_team_deliverables",
        `team_id=eq.${ccTeam}&select=id`
      );
      campusConnectDeliverableCount = dels.count ?? 0;
    }
  }

  const demoDataOk =
    archivedTeamCount >= 3 &&
    kimTroubleshootingCount >= 5 &&
    campusConnectDeliverableCount >= 6 &&
    hasCampusConnectCourse;

  const report = {
    ok: reportOk && evalReady && demoDataOk,
    reportOk,
    evalReady,
    demoDataOk,
    kimTroubleshootingCount,
    campusConnectDeliverableCount,
    hasCampusConnectCourse,
    kimStudentId: KIM_STUDENT_ID,
    teamMemberships: teamIds.length,
    archivedTeamsForReport: archivedTeamCount,
    archivedCourses: courseNames,
    tableChecks,
    missingTables,
    evalCounts: {
      peerReviewsGiven: tableChecks.ai_team_detail_peer_reviews.count ?? 0,
      professorStudentEvals: tableChecks.ai_team_detail_professor_student_evals.count ?? 0,
      professorProjectEvals: tableChecks.ai_team_detail_professor_project_evals.count ?? 0,
    },
    evalByArchivedTeam,
    teammateDisplayResolvable,
    teammateDisplayChecks,
    retrospectiveCount: Object.values(evalByArchivedTeam).filter(
      (v) => v.retrospectiveSubmitted
    ).length,
    feedbackCount: await (async () => {
      if (teamIds.length === 0) return 0;
      const fb = await tryCount(
        "ai_team_detail_feedbacks",
        `team_id=in.(${teamIds.join(",")})&author_user_id=eq.${KIM_STUDENT_ID}&select=id`
      );
      return fb.count ?? 0;
    })(),
    hints: [
      ...(missingTables.length > 0
        ? [
            "1) npm run supabase:apply-remote-full",
            "2) Supabase SQL Editor에서 supabase/apply_remote_full.sql 실행",
            "3) npm run verify:archived-kim 재실행",
          ]
        : []),
      ...(!allArchivedTeamsHaveEval
        ? ["archived_evals_kim_student.sql — 종료 팀마다 peer·교수 평가 시드 확인"]
        : []),
      ...(!teammateDisplayResolvable
        ? [
            "김학생 팀: ai_team_members + ai_team_detail_teammates(이름 일치) 확인 — vision #53 트러블슈팅 UI",
          ]
        : []),
      ...(!demoDataOk
        ? [
            "마이페이지 시연 시드: 웹프로그래밍 실습·캠퍼스 커넥트·트러블슈팅 author_user_id·산출물 6건+ 확인",
          ]
        : []),
      ...(reportOk
        ? [
            "마이페이지 「집계 새로고침」 후 PAGE 02 → 캠퍼스 커넥트 모달 확인",
            "팀 워크스페이스: 트러블슈팅·산출물 탭 게시물 확인",
          ]
        : ["archived_kim_student_bundle.sql 로 종료 수업·팀 멤버십 시드"]),
    ],
  };

  const jsonOut = process.argv.includes("--json");
  console.log(JSON.stringify(report, jsonOut ? undefined : 2));
  process.exit(report.ok ? 0 : evalReady ? 2 : 3);
} catch (err) {
  console.error(
    JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  );
  process.exit(1);
}
