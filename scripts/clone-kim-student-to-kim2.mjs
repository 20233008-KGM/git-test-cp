/**
 * 김학생 → 김학생2 DB 이전 (supabase/seed/clone_kim_student_to_kim_student2.sql)
 * 읽기: .env VITE_SUPABASE_URL + service role 없으면 SQL Editor에서 수동 실행 안내
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sqlPath = path.join(root, "supabase/seed/clone_kim_student_to_kim_student2.sql");
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

const KIM1 = "673b60f9-3c6c-4ed4-847a-e24536c472a5";
const KIM2 = "c9b6a5ca-110d-40d7-851d-703f077deb81";
const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.VITE_SUPABASE_ANON_KEY;

const sql = readFileSync(sqlPath, "utf8");

async function rest(table, query) {
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${table}: ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : [];
}

async function verify() {
  const [k1Teams, k2Teams, k1Members, k2Members] = await Promise.all([
    rest("ai_team_members", `user_id=eq.${KIM1}&select=team_id`),
    rest("ai_team_members", `user_id=eq.${KIM2}&select=team_id`),
    rest("ai_course_memberships", `user_id=eq.${KIM1}&select=course_id`),
    rest("ai_course_memberships", `user_id=eq.${KIM2}&select=course_id`),
  ]);
  return {
    kim1_team_count: k1Teams.length,
    kim2_team_count: k2Teams.length,
    kim1_course_count: k1Members.length,
    kim2_course_count: k2Members.length,
    kim2_has_archived:
      k2Members.some((m) =>
        ["course-swe-2025-archived", "course-oop-2025-archived"].includes(m.course_id)
      ),
  };
}

async function main() {
  console.log("김학생 → 김학생2 이전\n");
  console.log("SQL 파일:", sqlPath);
  console.log("\n이 스크립트는 RPC 없이 anon 키로는 DDL/대량 UPDATE를 실행할 수 없습니다.");
  console.log("Supabase SQL Editor에서 아래 파일을 실행하세요.\n");
  console.log("또는 Cursor Supabase MCP execute_sql 로 동일 내용 실행.\n");

  if (url && key) {
    const before = await verify();
    console.log("실행 전 상태:", JSON.stringify(before, null, 2));
  }

  console.log("\n--- SQL (BEGIN…COMMIT) ---\n");
  console.log(sql);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
