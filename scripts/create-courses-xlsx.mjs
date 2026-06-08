import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { utils, writeFile } from "xlsx";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "course-catalog-data");
const JSON_FILE = path.join(OUT_DIR, "courses.json");
const OUT_FILE = path.join(OUT_DIR, "courses.xlsx");

const courses = JSON.parse(readFileSync(JSON_FILE, "utf8"));

const rows = courses.map((course) => ({
  강의명: course.courseName,
  학수번호: course.courseCode,
  개설학과: course.department ?? "",
  학기: course.semester ?? "2026-1",
  교수명: course.professor ?? "",
  강의시간: course.schedule ?? "",
  강의실: course.room ?? "",
  학년: course.grade ?? "",
  학점: course.credit ?? "",
  설명: course.description ?? "",
}));

mkdirSync(OUT_DIR, { recursive: true });

const worksheet = utils.json_to_sheet(rows);
const workbook = utils.book_new();
utils.book_append_sheet(workbook, worksheet, "강의목록");
writeFile(workbook, OUT_FILE);

console.log(`Created ${OUT_FILE} (${rows.length} rows)`);
