import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function runCase(name, args, expectedExitCode, expectWarnings) {
  const result = spawnSync("node", ["scripts/collect-verification-report.mjs", ...args], {
    cwd: rootDir,
    encoding: "utf8",
    shell: true,
  });

  const stdout = (result.stdout ?? "").trim();
  let parsed = null;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return {
      ok: false,
      name,
      message: "JSON 파싱 실패",
      exitCode: result.status ?? 1,
      stdout,
      stderr: (result.stderr ?? "").trim(),
    };
  }

  const actualExitCode = result.status ?? 1;
  const warningsLength = Array.isArray(parsed.warnings) ? parsed.warnings.length : -1;
  const warningsMatch = expectWarnings ? warningsLength > 0 : warningsLength === 0;
  const exitCodeMatch = actualExitCode === expectedExitCode;

  return {
    ok: exitCodeMatch && warningsMatch,
    name,
    message: `exit=${actualExitCode}, warnings=${warningsLength}`,
    exitCode: actualExitCode,
    stdout,
    stderr: (result.stderr ?? "").trim(),
  };
}

function main() {
  const passCase = runCase(
    "strict-pass",
    ["--preflight", "--strict", "--archive-dir", "doc/for_agent/verification_reports", "--keep-latest", "2"],
    0,
    false
  );
  const failCase = runCase("strict-fail", ["--preflight", "--strict"], 1, true);

  const all = [passCase, failCase];
  for (const item of all) {
    console.log(`${item.ok ? "OK" : "FAIL"} ${item.name} (${item.message})`);
  }

  const failed = all.filter((item) => !item.ok);
  if (failed.length > 0) {
    for (const item of failed) {
      console.log("--- stdout ---");
      console.log(item.stdout);
      if (item.stderr) {
        console.log("--- stderr ---");
        console.log(item.stderr);
      }
    }
    process.exit(1);
  }
}

main();
