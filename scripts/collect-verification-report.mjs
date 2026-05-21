import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
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

function getPositiveIntEnv(key) {
  const raw = process.env[key]?.trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${key} 는 1 이상의 정수여야 합니다.`);
  }
  return parsed;
}

function parseArgs(args) {
  const outIdx = args.findIndex((arg) => arg === "--out");
  const outPath =
    outIdx >= 0 && args[outIdx + 1] ? path.resolve(rootDir, args[outIdx + 1]) : null;
  const archiveDirIdx = args.findIndex((arg) => arg === "--archive-dir");
  const archiveDir =
    archiveDirIdx >= 0 && args[archiveDirIdx + 1]
      ? path.resolve(rootDir, args[archiveDirIdx + 1])
      : null;
  const keepLatestIdx = args.findIndex((arg) => arg === "--keep-latest");
  const keepLatestRaw = keepLatestIdx >= 0 ? args[keepLatestIdx + 1] : null;
  const keepLatest = keepLatestRaw ? Number.parseInt(keepLatestRaw, 10) : null;
  if (keepLatestRaw && (!Number.isFinite(keepLatest) || keepLatest < 1)) {
    throw new Error("--keep-latest 는 1 이상의 정수여야 합니다.");
  }
  const keepDaysIdx = args.findIndex((arg) => arg === "--keep-days");
  const keepDaysRaw = keepDaysIdx >= 0 ? args[keepDaysIdx + 1] : null;
  const keepDays = keepDaysRaw ? Number.parseInt(keepDaysRaw, 10) : null;
  if (keepDaysRaw && (!Number.isFinite(keepDays) || keepDays < 1)) {
    throw new Error("--keep-days 는 1 이상의 정수여야 합니다.");
  }
  const preflight = args.includes("--preflight");
  const strict = args.includes("--strict");
  return { outPath, archiveDir, keepLatest, keepDays, preflight, strict };
}

function formatArchiveTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function runAndParse(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: rootDir,
    encoding: "utf8",
    shell: true,
  });
  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();
  let parsed = null;
  let parseError = null;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    parseError = String(error?.message ?? error);
  }
  return {
    command: `${command} ${commandArgs.join(" ")}`.trim(),
    exitCode: result.status ?? 1,
    stdout,
    stderr,
    parsed,
    parseError,
  };
}

function main() {
  loadDotEnv(envFile);
  const { outPath, archiveDir, keepLatest, keepDays, preflight, strict } = parseArgs(
    process.argv.slice(2)
  );
  const envKeepLatest = getPositiveIntEnv("VERIFY_BUNDLE_KEEP_LATEST");
  const envKeepDays = getPositiveIntEnv("VERIFY_BUNDLE_KEEP_DAYS");
  const resolvedKeepLatest = keepLatest ?? envKeepLatest;
  const resolvedKeepDays = keepDays ?? envKeepDays;

  if (preflight) {
    const warnings = [
      ...(archiveDir ? [] : ["archiveDir 미지정: 아카이브 파일은 생성되지 않습니다."]),
      ...(!resolvedKeepLatest && !resolvedKeepDays
        ? ["보관 정책 미지정: 정리(prune)는 수행되지 않습니다."]
        : []),
    ];
    const report = {
      timestamp: new Date().toISOString(),
      mode: "preflight",
      strict,
      ok: warnings.length === 0,
      paths: {
        outPath: outPath ?? null,
        archiveDir: archiveDir ?? null,
      },
      retentionPolicy: {
        keepLatest: resolvedKeepLatest ?? null,
        keepDays: resolvedKeepDays ?? null,
        source: {
          keepLatest: keepLatest ? "arg" : envKeepLatest ? "env" : null,
          keepDays: keepDays ? "arg" : envKeepDays ? "env" : null,
        },
      },
      warnings,
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(strict && warnings.length > 0 ? 1 : 0);
  }

  const humanVerify = runAndParse("node", ["scripts/verify-human-actions.mjs", "--json"]);
  const smokePlan = runAndParse("node", ["scripts/run-e2e-smoke.mjs", "--dry-run", "--json"]);
  const humanSyncPreview = runAndParse("node", ["scripts/sync-human-actions.mjs", "--json"]);
  const archivedKim = runAndParse("node", ["scripts/verify-archived-kim-setup.mjs", "--json"]);

  const parseFailed = Boolean(
    humanVerify.parseError ||
      smokePlan.parseError ||
      humanSyncPreview.parseError ||
      archivedKim.parseError
  );
  const syncHasReverted = (humanSyncPreview.parsed?.revertedCount ?? 0) > 0;
  const report = {
    timestamp: new Date().toISOString(),
    parseFailed,
    overallOk:
      !parseFailed &&
      humanVerify.exitCode === 0 &&
      smokePlan.exitCode === 0 &&
      humanSyncPreview.exitCode === 0 &&
      archivedKim.exitCode === 0 &&
      (archivedKim.parsed?.ok ?? false) &&
      !(humanVerify.parsed?.shouldFail ?? false) &&
      !syncHasReverted,
    humanVerify: {
      exitCode: humanVerify.exitCode,
      shouldFail: humanVerify.parsed?.shouldFail ?? null,
      checkedCount: humanVerify.parsed?.checkedCount ?? null,
      passCount: humanVerify.parsed?.passCount ?? null,
      failCount: humanVerify.parsed?.failCount ?? null,
      manualCount: humanVerify.parsed?.manualCount ?? null,
      parseError: humanVerify.parseError,
    },
    smokePlan: {
      exitCode: smokePlan.exitCode,
      mode: smokePlan.parsed?.mode ?? null,
      scriptName: smokePlan.parsed?.scriptName ?? null,
      hasStudentCreds: smokePlan.parsed?.hasStudentCreds ?? null,
      hasProfessorCreds: smokePlan.parsed?.hasProfessorCreds ?? null,
      parseError: smokePlan.parseError,
    },
    humanSyncPreview: {
      exitCode: humanSyncPreview.exitCode,
      movedCount: humanSyncPreview.parsed?.movedCount ?? null,
      revertedCount: humanSyncPreview.parsed?.revertedCount ?? null,
      manualCount: humanSyncPreview.parsed?.manualCount ?? null,
      memoAddedCount: humanSyncPreview.parsed?.memoAddedCount ?? null,
      parseError: humanSyncPreview.parseError,
    },
    archivedKim: {
      exitCode: archivedKim.exitCode,
      ok: archivedKim.parsed?.ok ?? null,
      evalReady: archivedKim.parsed?.evalReady ?? null,
      feedbackCount: archivedKim.parsed?.feedbackCount ?? null,
      retrospectiveCount: archivedKim.parsed?.retrospectiveCount ?? null,
      parseError: archivedKim.parseError,
    },
  };

  const savedFiles = [];
  const prunedFiles = [];
  let archiveFile = null;
  if (outPath) savedFiles.push(outPath);
  if (archiveDir) {
    mkdirSync(archiveDir, { recursive: true });
    archiveFile = path.join(
      archiveDir,
      `verification_report_${formatArchiveTimestamp()}.json`
    );
    savedFiles.push(archiveFile);
  }
  report.savedFiles = savedFiles;
  report.prunedFiles = prunedFiles;
  report.retentionPolicy = {
    keepLatest: resolvedKeepLatest ?? null,
    keepDays: resolvedKeepDays ?? null,
    source: {
      keepLatest: keepLatest ? "arg" : envKeepLatest ? "env" : null,
      keepDays: keepDays ? "arg" : envKeepDays ? "env" : null,
    },
  };
  const reportJson = `${JSON.stringify(report, null, 2)}\n`;

  for (const filePath of savedFiles) {
    writeFileSync(filePath, reportJson, "utf8");
  }

  if (archiveDir && (resolvedKeepLatest || resolvedKeepDays)) {
    const archiveFiles = readdirSync(archiveDir)
      .filter((name) => /^verification_report_\d{8}-\d{6}\.json$/.test(name))
      .sort()
      .reverse();
    const cutoffMs = resolvedKeepDays ? resolvedKeepDays * 24 * 60 * 60 * 1000 : null;
    const now = Date.now();
    for (let index = 0; index < archiveFiles.length; index += 1) {
      const fileName = archiveFiles[index];
      const targetPath = path.join(archiveDir, fileName);
      const overLatestLimit = resolvedKeepLatest ? index >= resolvedKeepLatest : false;
      const overDaysLimit = cutoffMs ? now - statSync(targetPath).mtimeMs > cutoffMs : false;
      if (!overLatestLimit && !overDaysLimit) continue;
      unlinkSync(targetPath);
      prunedFiles.push(targetPath);
    }
    if (archiveFile && prunedFiles.length > 0) {
      report.savedFiles = savedFiles;
      report.prunedFiles = prunedFiles;
      const refreshedJson = `${JSON.stringify(report, null, 2)}\n`;
      for (const filePath of savedFiles) {
        writeFileSync(filePath, refreshedJson, "utf8");
      }
      console.log(refreshedJson.trimEnd());
      process.exit(report.overallOk ? 0 : 1);
    }
  }

  console.log(reportJson.trimEnd());
  process.exit(report.overallOk ? 0 : 1);
}

main();
