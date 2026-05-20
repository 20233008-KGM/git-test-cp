import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function runStep(name, command, args) {
  console.log(`[pipeline] ${name} 시작`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });
  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    console.error(`[pipeline] ${name} 실패 (exit=${exitCode})`);
    process.exit(exitCode);
  }
  console.log(`[pipeline] ${name} 완료`);
}

function main() {
  runStep("preflight-selftest", "npm", ["run", "verify:bundle:preflight:selftest"]);
  runStep("bundle-save-archive-env", "npm", ["run", "verify:bundle:save:archive:env"]);
  console.log("[pipeline] 전체 완료");
}

main();
