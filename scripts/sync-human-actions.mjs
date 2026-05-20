import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const defaultFile = path.join(rootDir, "doc", "for_human", "28_human_action_items.md");
const envFile = path.join(rootDir, ".env");

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

function nowKstString() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return formatter.format(new Date()).replace(" ", " ");
}

function findLineIndex(lines, prefix, from = 0) {
  for (let i = from; i < lines.length; i += 1) {
    if (lines[i].startsWith(prefix)) return i;
  }
  return -1;
}

function findTableRange(lines, sectionIdx) {
  const start = findLineIndex(lines, "|", sectionIdx + 1);
  if (start === -1) return null;
  let end = start;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (!lines[i].startsWith("|")) break;
    end = i;
  }
  return { start, end };
}

function getMemoResultLabel(status) {
  if (status === "pass") return "pass";
  if (status === "fail") return "fail";
  return "manual";
}

function parseRow(line) {
  return line
    .split("|")
    .map((col) => col.trim())
    .filter(Boolean);
}

function verifyAuto(id) {
  if (id === "H-003") {
    const hasEmail = Boolean(process.env.E2E_TEST_EMAIL?.trim());
    const hasPassword = Boolean(process.env.E2E_TEST_PASSWORD?.trim());
    return hasEmail && hasPassword
      ? { status: "pass", reason: "E2E 테스트 계정 env 존재" }
      : { status: "fail", reason: "E2E 테스트 계정 env 누락" };
  }
  return { status: "manual", reason: "자동 검증 핸들러 없음" };
}

function main() {
  loadDotEnv(envFile);
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const json = args.includes("--json");
  const fileArg = args.find((arg) => !arg.startsWith("--"));
  const targetFile = fileArg ? path.resolve(rootDir, fileArg) : defaultFile;

  const original = readFileSync(targetFile, "utf8");
  const lines = original.split(/\r?\n/);

  const blockedSectionIdx = findLineIndex(lines, "## 지금 막혀 있는 일 (미완료)");
  const doneSectionIdx = findLineIndex(lines, "## 완료한 일");
  const memoSectionIdx = findLineIndex(lines, "## 자동 검증 메모 (최신 20건)");
  if (blockedSectionIdx === -1 || doneSectionIdx === -1 || memoSectionIdx === -1) {
    throw new Error("필수 섹션(미완료/완료/자동 검증 메모)을 찾지 못했습니다.");
  }

  const blockedTable = findTableRange(lines, blockedSectionIdx);
  const doneTable = findTableRange(lines, doneSectionIdx);
  const memoTable = findTableRange(lines, memoSectionIdx);
  if (!blockedTable || !doneTable || !memoTable) {
    throw new Error("표 범위를 파싱하지 못했습니다.");
  }

  const blockedHeader = lines.slice(blockedTable.start, blockedTable.start + 2);
  const blockedData = lines.slice(blockedTable.start + 2, blockedTable.end + 1);
  const doneHeader = lines.slice(doneTable.start, doneTable.start + 2);
  const doneData = lines.slice(doneTable.start + 2, doneTable.end + 1);
  const memoHeader = lines.slice(memoTable.start, memoTable.start + 2);
  const memoData = lines.slice(memoTable.start + 2, memoTable.end + 1);

  const existingDoneIds = new Set(
    doneData
      .map((line) => parseRow(line))
      .filter((cols) => cols.length >= 1)
      .map((cols) => cols[0])
  );

  const nextBlocked = [];
  const moved = [];
  const reverted = [];
  const keptManual = [];
  const completedRows = [];
  const newMemoRows = [];
  const timestamp = nowKstString();

  for (const rowLine of blockedData) {
    const cols = parseRow(rowLine);
    if (cols.length < 6) {
      nextBlocked.push(rowLine);
      continue;
    }

    const [check, id, priority, task, reason, verify] = cols;
    if (check !== "[o]") {
      nextBlocked.push(rowLine);
      continue;
    }

    const result = verifyAuto(id);
    if (result.status === "pass") {
      moved.push({ id, priority, task, reason, verify, detail: result.reason });
      newMemoRows.push(
        `| ${timestamp} | ${id} | ${getMemoResultLabel(result.status)} | ${result.reason} |`
      );
      if (!existingDoneIds.has(id)) {
        completedRows.push(`| ${id} | ${timestamp} | ${task} |`);
      }
      continue;
    }

    if (result.status === "fail") {
      reverted.push({ id, priority, task, reason, verify, detail: result.reason });
      newMemoRows.push(
        `| ${timestamp} | ${id} | ${getMemoResultLabel(result.status)} | ${result.reason} |`
      );
      nextBlocked.push(`| [ ] | ${id} | ${priority} | ${task} | ${reason} | ${verify} |`);
      continue;
    }

    keptManual.push({ id, priority, task, reason, verify, detail: result.reason });
    newMemoRows.push(
      `| ${timestamp} | ${id} | ${getMemoResultLabel(result.status)} | ${result.reason} |`
    );
    nextBlocked.push(rowLine);
  }

  const updatedLines = [...lines];
  const replacementBlocked = [...blockedHeader, ...nextBlocked];
  updatedLines.splice(
    blockedTable.start,
    blockedTable.end - blockedTable.start + 1,
    ...replacementBlocked
  );

  const doneSectionIdx2 = findLineIndex(updatedLines, "## 완료한 일");
  const doneTable2 = findTableRange(updatedLines, doneSectionIdx2);
  const nextDoneData = [...completedRows, ...doneData];
  const replacementDone = [...doneHeader, ...nextDoneData];
  updatedLines.splice(
    doneTable2.start,
    doneTable2.end - doneTable2.start + 1,
    ...replacementDone
  );

  const memoSectionIdx2 = findLineIndex(updatedLines, "## 자동 검증 메모 (최신 20건)");
  const memoTable2 = findTableRange(updatedLines, memoSectionIdx2);
  const nextMemoData = [...newMemoRows, ...memoData].slice(0, 20);
  const replacementMemo = [...memoHeader, ...nextMemoData];
  updatedLines.splice(
    memoTable2.start,
    memoTable2.end - memoTable2.start + 1,
    ...replacementMemo
  );

  const summary = {
    file: targetFile,
    apply,
    movedCount: moved.length,
    revertedCount: reverted.length,
    manualCount: keptManual.length,
    memoAddedCount: newMemoRows.length,
    moved,
    reverted,
    manual: keptManual,
  };

  if (apply) {
    writeFileSync(targetFile, `${updatedLines.join("\n")}\n`, "utf8");
  }

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`파일: ${targetFile}`);
  console.log(`모드: ${apply ? "apply" : "preview"}`);
  console.log(
    `요약: moved=${moved.length}, reverted=${reverted.length}, manual=${keptManual.length}, memoAdded=${newMemoRows.length}`
  );
  if (moved.length > 0) {
    console.log("완료표 이동:");
    for (const item of moved) console.log(`- ${item.id}: ${item.detail}`);
  }
  if (reverted.length > 0) {
    console.log("체크 복귀([ ]):");
    for (const item of reverted) console.log(`- ${item.id}: ${item.detail}`);
  }
  if (keptManual.length > 0) {
    console.log("수동 확인 필요:");
    for (const item of keptManual) console.log(`- ${item.id}: ${item.detail}`);
  }
}

main();
