import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const defaultFile = path.join(rootDir, "doc", "for_human", "28_human_action_items.md");

function parseCheckedRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const rows = [];

  for (const line of lines) {
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
      reason: cols[4],
      verify: cols[5],
    });
  }

  return rows;
}

function main() {
  const fileArg = process.argv[2];
  const targetFile = fileArg ? path.resolve(rootDir, fileArg) : defaultFile;
  const markdown = readFileSync(targetFile, "utf8");
  const checked = parseCheckedRows(markdown);

  console.log(`파일: ${targetFile}`);
  if (checked.length === 0) {
    console.log("체크된([o]) H-항목이 없습니다.");
    process.exit(0);
  }

  console.log(`체크된([o]) H-항목 ${checked.length}건`);
  for (const item of checked) {
    console.log(`- ${item.id} [${item.priority}]`);
    console.log(`  할 일: ${item.task}`);
    console.log(`  검증: ${item.verify}`);
  }
}

main();
