/**
 * 인간 없이 실행 가능한 런칭 전 점검 (빌드 + 아카이브 시드 + verify preflight)
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

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

function runStep(name, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: true,
    env: process.env,
  });
  return {
    name,
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    stderr: (result.stderr ?? "").trim().slice(0, 400),
  };
}

loadDotEnv(envFile);

const steps = [];
steps.push(runStep("build", "npm", ["run", "build"]));

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL?.trim()) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY?.trim());

if (hasSupabase) {
  const archived = spawnSync("node", ["scripts/verify-archived-kim-setup.mjs", "--json"], {
    cwd: root,
    encoding: "utf8",
    shell: true,
    env: process.env,
  });
  let archivedOk = false;
  let archivedParsed = null;
  try {
    archivedParsed = JSON.parse((archived.stdout ?? "").trim());
    archivedOk = Boolean(archivedParsed?.ok);
  } catch {
    archivedOk = false;
  }
  steps.push({
    name: "verify:archived-kim",
    ok: archivedOk && archived.status === 0,
    exitCode: archived.status ?? 1,
    stderr: archivedOk ? "" : (archived.stderr ?? archived.stdout ?? "").trim().slice(0, 400),
    detail: archivedParsed
      ? { evalReady: archivedParsed.evalReady, feedbackCount: archivedParsed.feedbackCount }
      : null,
  });
} else {
  steps.push({
    name: "verify:archived-kim",
    ok: true,
    skipped: true,
    detail: "VITE_SUPABASE_* 없음 — 건너뜀",
  });
}

const preflight = runStep("verify:bundle:preflight", "npm", [
  "run",
  "verify:bundle:preflight",
]);
steps.push(preflight);

const report = {
  ok: steps.every((s) => s.ok),
  timestamp: new Date().toISOString(),
  hasSupabase,
  steps,
  hints: [
    ...(hasSupabase ? [] : [".env 에 VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY 설정"]),
    "인간 항목: npm run human:verify (H-007~011 [o] 후)",
    "Edge AI: doc/for_human/30_edge_ai_report.md (H-002)",
  ],
};

const asJson = process.argv.includes("--json");
console.log(JSON.stringify(report, asJson ? undefined : 2));
process.exit(report.ok ? 0 : 1);
