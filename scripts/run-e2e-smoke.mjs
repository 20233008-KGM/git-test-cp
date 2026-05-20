import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const envFile = path.join(rootDir, ".env");

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function hasValue(key) {
  return Boolean(process.env[key]?.trim());
}

function main() {
  loadDotEnv(envFile);
  const args = process.argv.slice(2);
  const forceFull = args.includes("--full");
  const forcePublic = args.includes("--public");
  const dryRun = args.includes("--dry-run");
  const asJson = args.includes("--json");
  if (forceFull && forcePublic) {
    console.error("[smoke] --full 과 --public 을 동시에 사용할 수 없습니다.");
    process.exit(1);
  }

  const hasStudentCreds = hasValue("E2E_TEST_EMAIL") && hasValue("E2E_TEST_PASSWORD");
  const hasProfessorCreds = hasValue("E2E_PROFESSOR_EMAIL") && hasValue("E2E_PROFESSOR_PASSWORD");
  const shouldRunFull = forceFull ? true : forcePublic ? false : hasStudentCreds;
  const mode = shouldRunFull ? "full" : "public-only";
  const scriptName = shouldRunFull ? "test:e2e:smoke:full" : "test:e2e:smoke:public";
  const summary = {
    mode,
    scriptName,
    forceFull,
    forcePublic,
    dryRun,
    hasStudentCreds,
    hasProfessorCreds,
  };

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`[smoke] mode=${mode}`);
  }

  if (!asJson && forceFull) {
    console.log("[smoke] override: --full");
  }
  if (!asJson && forcePublic) {
    console.log("[smoke] override: --public");
  }
  if (!asJson && !shouldRunFull) {
    console.log("[smoke] E2E 자격증명이 없어 인증 가드만 실행합니다.");
  }
  if (!asJson && !shouldRunFull && hasProfessorCreds) {
    console.log("[smoke] 교수 계정 자격증명만 있어 full 실행 조건(학생 계정)이 충족되지 않았습니다.");
  }
  if (dryRun) {
    if (!asJson) console.log("[smoke] dry-run: 실제 테스트를 실행하지 않았습니다.");
    process.exit(0);
  }

  const result = spawnSync("npm", ["run", scriptName], {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });

  process.exit(result.status ?? 1);
}

main();
