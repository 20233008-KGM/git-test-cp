/**
 * 강의 카탈로그 import — JSON 또는 Excel(.xlsx) → ai_course_catalog
 *
 * 사용법:
 *   node scripts/import-course-catalog.mjs
 *   node scripts/import-course-catalog.mjs --file course-catalog-data/courses.xlsx
 *   node scripts/import-course-catalog.mjs --file course-catalog-data/courses.json
 *
 * 환경변수: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (또는 VITE_SUPABASE_ANON_KEY)
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_JSON = path.join(ROOT, "course-catalog-data", "courses.json");

const COLUMN_MAP = {
  courseName: ["courseName", "course_name", "강의명", "수업명", "과목명"],
  courseCode: ["courseCode", "course_code", "학수번호", "강의코드", "수업코드"],
  department: ["department", "학과", "개설학과", "소속"],
  semester: ["semester", "학기"],
  professor: ["professor", "담당교수", "교수", "교수명"],
  schedule: ["schedule", "시간", "강의시간"],
  room: ["room", "강의실", "호실"],
  grade: ["grade", "학년", "대상학년"],
  credit: ["credit", "학점"],
  description: ["description", "설명", "비고"],
};

function parseArgs(argv) {
  const args = { file: DEFAULT_JSON };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--file" && argv[i + 1]) {
      args.file = path.resolve(ROOT, argv[i + 1]);
      i += 1;
    }
  }
  return args;
}

function pickField(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function normalizeRow(raw, index) {
  const courseName = pickField(raw, COLUMN_MAP.courseName);
  const courseCode = pickField(raw, COLUMN_MAP.courseCode);
  const semester = pickField(raw, COLUMN_MAP.semester) || "2026-1";

  if (!courseName || !courseCode) {
    throw new Error(`행 ${index + 1}: 강의명·학수번호는 필수입니다.`);
  }

  const slugCode = courseCode.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slugSemester = semester.replace(/[^a-zA-Z0-9]+/g, "-");

  return {
    id: `catalog-${slugCode}-${slugSemester}`,
    course_name: courseName,
    course_code: courseCode,
    department: pickField(raw, COLUMN_MAP.department) || null,
    semester,
    professor: pickField(raw, COLUMN_MAP.professor) || null,
    schedule: pickField(raw, COLUMN_MAP.schedule) || null,
    room: pickField(raw, COLUMN_MAP.room) || null,
    grade: pickField(raw, COLUMN_MAP.grade) || null,
    credit: pickField(raw, COLUMN_MAP.credit) || null,
    description: pickField(raw, COLUMN_MAP.description) || null,
    sort_order: index + 1,
  };
}

async function readRows(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
  }

  if (filePath.endsWith(".json")) {
    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("JSON은 배열이어야 합니다.");
    return parsed;
  }

  if (filePath.endsWith(".xlsx") || filePath.endsWith(".xls")) {
    const { readFile: readXlsx, utils } = await import("xlsx");
    const workbook = readXlsx(filePath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("엑셀 시트가 비어 있습니다.");
    return utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  }

  throw new Error("지원 형식: .json, .xlsx, .xls");
}

async function main() {
  const { file } = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("VITE_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY(또는 ANON_KEY)가 필요합니다.");
  }

  const rawRows = await readRows(file);
  const rows = rawRows.map((row, index) => normalizeRow(row, index));

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase.from("ai_course_catalog").upsert(rows, { onConflict: "id" });

  if (error) throw error;

  console.log(`✓ ${rows.length}개 강의 카탈로그를 import 했습니다. (${path.basename(file)})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
