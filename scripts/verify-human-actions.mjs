import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const defaultFile = path.join(rootDir, "doc", "for_human", "28_human_action_items.md");
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

function parseCheckedRows(markdown) {
  const rows = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    if (!line.includes("[o]")) continue;
    const cols = line
      .split("|")
      .map((col) => col.trim())
      .filter(Boolean);
    if (cols.length < 6) continue;
    if (cols[0] !== "[o]") continue;
    if (!/^H-\d+$/.test(cols[1])) continue;
    rows.push({
      id: cols[1],
      priority: cols[2],
      task: cols[3],
      verify: cols[5],
    });
  }
  return rows;
}

function runSmokeTest() {
  const result = spawnSync("npm", ["run", "test:e2e:smoke"], {
    cwd: rootDir,
    encoding: "utf8",
    shell: true,
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return {
    ok: result.status === 0,
    detail: result.status === 0 ? "스모크 테스트 통과" : "스모크 테스트 실패",
    output,
  };
}

function verifyItem(item, options) {
  switch (item.id) {
    case "H-003": {
      const hasEmail = Boolean(process.env.E2E_TEST_EMAIL?.trim());
      const hasPassword = Boolean(process.env.E2E_TEST_PASSWORD?.trim());
      if (!hasEmail || !hasPassword) {
        return { status: "fail", detail: "E2E_TEST_EMAIL 또는 E2E_TEST_PASSWORD 누락" };
      }
      if (!options.strict) {
        return { status: "pass", detail: "E2E_TEST_EMAIL / E2E_TEST_PASSWORD 존재 (기본 검증)" };
      }
      const smoke = runSmokeTest();
      return smoke.ok
        ? { status: "pass", detail: `${smoke.detail} (엄격 검증)` }
        : {
            status: "fail",
            detail: `${smoke.detail} (엄격 검증)`,
            extra: smoke.output.trim(),
          };
    }
    case "H-004": {
      return { status: "manual", detail: "GitHub Secrets는 로컬에서 자동 검증 불가" };
    }
    default: {
      return { status: "manual", detail: "현재 자동 검증 핸들러 없음 (문서 기준 수동 확인 필요)" };
    }
  }
}

function main() {
  loadDotEnv(envFile);
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const json = args.includes("--json");
  const failOnManual = args.includes("--fail-on-manual");
  const fileArg = args.find((arg) => !arg.startsWith("--"));
  const targetFile = fileArg ? path.resolve(rootDir, fileArg) : defaultFile;
  const markdown = readFileSync(targetFile, "utf8");
  const checked = parseCheckedRows(markdown);

  if (!json) {
    console.log(`파일: ${targetFile}`);
    console.log(`모드: ${strict ? "strict" : "basic"}`);
  }
  if (checked.length === 0) {
    if (json) {
      console.log(
        JSON.stringify(
          {
            file: targetFile,
            mode: strict ? "strict" : "basic",
            failOnManual,
            checkedCount: 0,
            passCount: 0,
            failCount: 0,
            manualCount: 0,
            results: [],
          },
          null,
          2
        )
      );
    } else {
      console.log("검증 대상([o]) H-항목이 없습니다.");
    }
    process.exit(0);
  }

  let failCount = 0;
  let passCount = 0;
  let manualCount = 0;
  let smokeTriggered = false;
  const results = [];

  for (const item of checked) {
    const result = verifyItem(item, { strict });
    if (item.id === "H-003" && strict) smokeTriggered = true;
    if (result.status === "pass") passCount += 1;
    if (result.status === "fail") failCount += 1;
    if (result.status === "manual") manualCount += 1;
    results.push({
      id: item.id,
      priority: item.priority,
      task: item.task,
      verify: item.verify,
      status: result.status,
      detail: result.detail,
    });
    if (!json) {
      console.log(`- ${item.id} [${item.priority}] => ${result.status.toUpperCase()}`);
      console.log(`  할 일: ${item.task}`);
      console.log(`  문서 기준: ${item.verify}`);
      console.log(`  검증 결과: ${result.detail}`);
      if (result.extra) {
        console.log("  --- 검증 로그 ---");
        console.log(result.extra);
        console.log("  --- 끝 ---");
      }
    }
  }

  if (!json && strict && !smokeTriggered) {
    console.log("참고: strict 모드지만 H-003 체크 항목이 없어 스모크 테스트는 실행되지 않았습니다.");
  }

  const shouldFail = failCount > 0 || (failOnManual && manualCount > 0);
  if (json) {
    console.log(
      JSON.stringify(
        {
          file: targetFile,
          mode: strict ? "strict" : "basic",
          failOnManual,
          checkedCount: checked.length,
          passCount,
          failCount,
          manualCount,
          shouldFail,
          results,
        },
        null,
        2
      )
    );
  } else {
    console.log(`요약: pass=${passCount}, fail=${failCount}, manual=${manualCount}`);
    if (failOnManual && manualCount > 0) {
      console.log("옵션: fail-on-manual 활성화로 manual 항목도 실패로 처리합니다.");
    }
  }
  process.exit(shouldFail ? 1 : 0);
}

main();
