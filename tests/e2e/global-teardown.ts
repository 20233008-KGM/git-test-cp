import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function globalTeardown() {
  try {
    await execFileAsync("node", ["scripts/e2e-cleanup-fixtures.mjs"], {
      env: process.env,
      cwd: process.cwd(),
    });
  } catch (error) {
    console.warn("[global-teardown] fixture cleanup failed:", error);
  }
}

export default globalTeardown;
