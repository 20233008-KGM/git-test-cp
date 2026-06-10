import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import { E2EFixtureRegistry } from "./helpers/e2e-fixture-registry";
import {
  archiveCourseViaUI,
  buildProfessorFixture,
  buildStudentFixture,
  createCourseViaUI,
  createTeamViaUI,
  joinCourseViaCode,
  loginViaUI,
  logoutViaUI,
  openStudentProfileFromNetwork,
  signupViaUI,
  submitPeerReviewsForAllTeammates,
  uniqueRunId,
} from "./helpers/multi-user-flow";

test.describe.configure({ mode: "serial" });

let registry: E2EFixtureRegistry | null = null;

test.afterAll(async () => {
  if (!registry) return;
  await registry.flush();
  try {
    execFileSync("node", ["scripts/e2e-cleanup-fixtures.mjs", `--runId=${registry.runId}`], {
      stdio: "inherit",
      env: process.env,
    });
  } catch (error) {
    console.warn("[peer-network-e2e] cleanup failed", error);
  }
});

test("다중 사용자: 조원평가가 수강생 프로필에 반영된다", async ({ page }) => {
  test.setTimeout(600_000);

  const serviceKeyReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const firebaseCleanupReady = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  );
  test.skip(!serviceKeyReady || !firebaseCleanupReady, "cleanup env가 없어 안전하게 실행할 수 없습니다.");

  const runId = uniqueRunId();
  registry = new E2EFixtureRegistry(runId);

  const professor = buildProfessorFixture(runId);
  await signupViaUI(page, { ...professor, role: "professor" });
  registry.registerEmail(professor.email);
  await registry.flush();

  const { courseId, courseCode } = await createCourseViaUI(page, `E2E-동료평가-${runId}`);
  registry.setCourseId(courseId);
  await registry.flush();
  await logoutViaUI(page);

  const students = Array.from({ length: 10 }, (_, i) => buildStudentFixture(runId, i));
  for (const student of students) {
    await signupViaUI(page, {
      ...student,
      role: "student",
    });
    await joinCourseViaCode(page, courseCode);
    registry.registerEmail(student.email);
    await registry.flush();
    await logoutViaUI(page);
  }

  await loginViaUI(page, professor.email, professor.password);
  await createTeamViaUI(page, courseId, "E2E-A팀", 4);
  await createTeamViaUI(page, courseId, "E2E-B팀", 3);
  await createTeamViaUI(page, courseId, "E2E-C팀", 3);
  await archiveCourseViaUI(page, courseId);
  await logoutViaUI(page);

  for (const student of students) {
    await loginViaUI(page, student.email, student.password);
    await submitPeerReviewsForAllTeammates(page, courseId);
    await logoutViaUI(page);
  }

  await loginViaUI(page, students[0].email, students[0].password);
  await openStudentProfileFromNetwork(page, courseId);

  await expect(page.getByTestId("student-profile-peer-banner")).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText("팀 활동 후 동료 평가가 쌓이면 표시됩니다.")).toHaveCount(0);
  await expect(page.locator("div").filter({ has: page.getByText("동료 키워드") }).first()).toBeVisible();

  const tier = await page.getByTestId("student-profile-peer-banner").getAttribute("data-peer-tier");
  expect(["emerging", "developing", "distinct"]).toContain(tier);
});
