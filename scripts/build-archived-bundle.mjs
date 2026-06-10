import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const stripLeadingComments = (sql) => sql.replace(/^--[^\n]*\n/gm, "").trim();

const header = [
  "-- 통합 시드: 김학생 아카이브 수업 + 평가 (vision #35·#36)",
  "-- Supabase SQL Editor에서 이 파일만 실행해도 됩니다 (번들 v2 선행).",
  "-- 개별 실행: archived_courses_kim_student.sql → archived_evals_kim_student.sql",
  "",
].join("\n");

const courses = stripLeadingComments(
  fs.readFileSync(path.join(root, "supabase/seed/archived_courses_kim_student.sql"), "utf8")
);
const evals = stripLeadingComments(
  fs.readFileSync(path.join(root, "supabase/seed/archived_evals_kim_student.sql"), "utf8")
);
const retrospectives = stripLeadingComments(
  fs.readFileSync(path.join(root, "supabase/seed/archived_retrospectives_kim_student.sql"), "utf8")
);
const feedbacks = stripLeadingComments(
  fs.readFileSync(path.join(root, "supabase/seed/archived_feedbacks_kim_student.sql"), "utf8")
);
const mypageReport = stripLeadingComments(
  fs.readFileSync(path.join(root, "supabase/seed/archived_mypage_report_kim_student.sql"), "utf8")
);

const out =
  header +
  courses +
  "\n\n-- ========== 평가 시드 ==========\n\n" +
  evals +
  "\n\n-- ========== 회고록 시드 ==========\n\n" +
  retrospectives +
  "\n\n-- ========== 피드백 시드 ==========\n\n" +
  feedbacks +
  "\n\n-- ========== 마이페이지 프로필·AI 컨텍스트 ==========\n\n" +
  mypageReport +
  "\n";

fs.writeFileSync(path.join(root, "supabase/seed/archived_kim_student_bundle.sql"), out, "utf8");
console.log("Wrote supabase/seed/archived_kim_student_bundle.sql");
