import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = path.join(ROOT, "tests/e2e/.e2e-fixtures");
const EMAIL_PATTERN = /^e2e-peer-[a-z0-9-]+-(prof|stu-\d+)@test\.local$/;

function parseArgs(argv) {
  const parsed = {};
  for (const token of argv) {
    const [k, v] = token.split("=");
    if (!k?.startsWith("--")) continue;
    parsed[k.slice(2)] = v ?? "true";
  }
  return parsed;
}

function readServiceAccount() {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonRaw) return JSON.parse(jsonRaw);
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!filePath) return null;
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function getSupabaseClient() {
  const url = (process.env.VITE_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function deleteCourseCascade(supabase, courseId) {
  if (!courseId) return;
  const { data: teams } = await supabase.from("ai_teams").select("id").eq("course_id", courseId);
  const teamIds = (teams ?? []).map((team) => team.id).filter(Boolean);
  if (teamIds.length > 0) {
    const detailTables = [
      "ai_team_detail_chat_messages",
      "ai_team_detail_feedbacks",
      "ai_team_detail_peer_reviews",
      "ai_team_detail_retrospectives",
      "ai_team_detail_professor_student_evals",
      "ai_team_detail_professor_project_evals",
      "ai_team_detail_troubleshooting_logs",
      "ai_team_detail_config",
      "ai_team_detail_peer_review_students",
      "ai_team_detail_teammates",
      "ai_team_deliverables",
      "ai_team_activities",
      "ai_team_members",
    ];
    for (const table of detailTables) {
      await supabase.from(table).delete().in("team_id", teamIds);
    }
    await supabase.from("ai_teams").delete().eq("course_id", courseId);
  }

  const courseTables = [
    "ai_direct_messages",
    "ai_announcements",
    "ai_course_stages",
    "ai_course_materials",
    "ai_course_memberships",
    "ai_projects",
    "ai_questions",
  ];
  for (const table of courseTables) {
    await supabase.from(table).delete().eq("course_id", courseId);
  }
  await supabase.from("ai_courses").delete().eq("id", courseId);
}

async function deleteUsersFromSupabase(supabase, emails) {
  const firebaseUids = [];
  for (const email of emails) {
    if (!EMAIL_PATTERN.test(email)) continue;
    const { data: user } = await supabase
      .from("ai_users")
      .select("id, firebase_uid")
      .eq("email", email)
      .maybeSingle();
    if (!user) continue;
    if (user.firebase_uid) firebaseUids.push(user.firebase_uid);
    await supabase.from("ai_user_learning_profiles").delete().eq("user_id", user.id);
    await supabase.from("ai_course_memberships").delete().eq("user_id", user.id);
    await supabase.from("ai_team_members").delete().eq("user_id", user.id);
    await supabase.from("ai_users").delete().eq("id", user.id);
  }
  return firebaseUids;
}

async function deleteUsersFromFirebase(firebaseUids, emails) {
  const serviceAccount = readServiceAccount();
  if (!serviceAccount) return;

  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  const auth = getAuth();

  for (const uid of firebaseUids) {
    try {
      await auth.deleteUser(uid);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") {
        console.warn(`[cleanup] firebase deleteUser(${uid}) failed`, error);
      }
    }
  }

  for (const email of emails) {
    if (!EMAIL_PATTERN.test(email)) continue;
    try {
      const user = await auth.getUserByEmail(email);
      await auth.deleteUser(user.uid);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") {
        console.warn(`[cleanup] firebase delete by email(${email}) failed`, error);
      }
    }
  }
}

async function getFixtureFiles(runId) {
  if (!existsSync(FIXTURE_DIR)) return [];
  const names = await readdir(FIXTURE_DIR);
  return names
    .filter((name) => name.endsWith(".json"))
    .filter((name) => (runId ? name === `${runId}.json` : true))
    .map((name) => path.join(FIXTURE_DIR, name));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = await getFixtureFiles(args.runId);
  if (files.length === 0) return;

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("[cleanup] Supabase service role env missing. skipping cleanup.");
    return;
  }

  for (const filePath of files) {
    const payload = await readJson(filePath);
    if (!payload) continue;
    const emails = Array.isArray(payload.emails)
      ? payload.emails.map((email) => String(email).trim().toLowerCase()).filter(Boolean)
      : [];
    const safeEmails = emails.filter((email) => EMAIL_PATTERN.test(email));

    await deleteCourseCascade(supabase, payload.courseId);
    const firebaseUids = await deleteUsersFromSupabase(supabase, safeEmails);
    await deleteUsersFromFirebase(firebaseUids, safeEmails);

    await rm(filePath, { force: true });
    console.log(`[cleanup] removed fixtures for runId=${payload.runId}`);
  }
}

await main();
