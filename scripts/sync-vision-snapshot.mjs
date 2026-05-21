import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const vision = fs.readFileSync(path.join(root, "vision.md"), "utf8");
const snapshotPath = path.join(root, "doc/for_agent/vision_snapshot.md");

const startMarker = "추가요청사항";
const endMarker = "# 프로젝트 목적 및 철학";
const startIdx = vision.indexOf(startMarker);
const endIdx = vision.indexOf(endMarker);
if (startIdx < 0 || endIdx < 0) {
  console.error("vision.md markers not found");
  process.exit(1);
}
const requestsBlock = vision.slice(startIdx, endIdx).trimEnd();

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

const out = `# vision.md 사본 (비교용)

> 원본: \`../../vision.md\`
> 목적: 매 작업 시작 시 원본과 대조해 신규 "추가요청사항"을 탐지
> 갱신 시각: ${ts}
> 규칙: 원본 \`vision.md\`는 인간만 수정, 이 사본은 AI가 동기화

---

## 원본 내용 복사본

이 문서는 오직 인간사용자만 수정할 수 있으며 ai는 읽기만 가능하다.

${requestsBlock}

${vision.slice(endIdx)}
`;

fs.writeFileSync(snapshotPath, out, "utf8");
console.log("Synced vision_snapshot.md");
