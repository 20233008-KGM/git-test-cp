import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const header = [
  "-- CampusConnect 원격 Supabase 일괄 적용 (vision #35·#46)",
  "-- SQL Editor에 이 파일 전체를 붙여넣고 Run (한 번에 실행 가능).",
  "-- 구성: bundle v2 + 김학생 시드(평가·회고·피드백) + 조회 인덱스",
  "",
].join("\n");

const bundleV2 = fs.readFileSync(
  path.join(root, "supabase/migrations/20260520102000_team_detail_writes_bundle_v2.sql"),
  "utf8"
);
const seedBundle = fs.readFileSync(
  path.join(root, "supabase/seed/archived_kim_student_bundle.sql"),
  "utf8"
);
const hotPathIndexes = fs.readFileSync(
  path.join(root, "supabase/migrations/20260521061800_hot_path_membership_indexes.sql"),
  "utf8"
);

const out =
  header +
  "\n-- ========== 1. 평가·회고·피드백 테이블 (bundle v2) ==========\n\n" +
  bundleV2 +
  "\n\n-- ========== 2. 김학생 아카이브 수업·시드 ==========\n\n" +
  seedBundle +
  "\n\n-- ========== 3. 조회 인덱스 (멤버십·팀·수업) ==========\n\n" +
  hotPathIndexes;

fs.writeFileSync(path.join(root, "supabase/apply_remote_full.sql"), out, "utf8");
console.log("Wrote supabase/apply_remote_full.sql");
