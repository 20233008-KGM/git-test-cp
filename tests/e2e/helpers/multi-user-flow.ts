import { expect, type Page } from "@playwright/test";

export function uniqueRunId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildProfessorFixture(runId: string) {
  return {
    name: `교수-${runId}`,
    email: `e2e-peer-${runId}-prof@test.local`,
    password: `E2e!${runId.slice(-6)}aa`,
  };
}

export function buildStudentFixture(runId: string, index: number) {
  const n = String(index + 1).padStart(2, "0");
  return {
    name: `학생${n}-${runId}`,
    email: `e2e-peer-${runId}-stu-${n}@test.local`,
    password: `E2e!${runId.slice(-4)}${n}`,
  };
}

export async function gotoSignup(page: Page) {
  await page.goto("/");
  const signLink = page.getByTestId("landing-signup-link");
  if (await signLink.isVisible().catch(() => false)) {
    await signLink.click();
  } else {
    await page.goto("/signin");
  }
  await expect(page.getByTestId("signup-submit")).toBeVisible({ timeout: 15_000 });
}

export async function signupViaUI(
  page: Page,
  input: {
    name: string;
    email: string;
    password: string;
    role: "student" | "professor";
    courseCode?: string;
  }
) {
  await gotoSignup(page);
  await page.getByTestId("signup-name").fill(input.name);
  await page.getByTestId("signup-email").fill(input.email);
  await page.getByTestId("signup-password").fill(input.password);
  await page.getByTestId("signup-role").selectOption(input.role);
  await page.getByTestId("signup-submit").click();
  await expect(page).toHaveURL(/\/app\/courses/, { timeout: 30_000 });
}

export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByTestId("landing-email-input").fill(email);
  await page.getByTestId("landing-password-input").fill(password);
  await page.getByTestId("landing-login-submit").click();
  await expect(page).toHaveURL(/\/app\/courses/, { timeout: 30_000 });
}

export async function logoutViaUI(page: Page) {
  const logout = page.getByTestId("logout-button");
  if (await logout.isVisible().catch(() => false)) {
    await logout.click();
    await expect(page).toHaveURL("/", { timeout: 15_000 });
  }
}

export async function createCourseViaUI(page: Page, courseName: string) {
  await page.goto("/app/courses");
  await page.getByTestId("course-create-open").click();
  await page.getByTestId("course-create-name").fill(courseName);
  await page.getByTestId("course-create-submit").click();
  const card = page
    .locator('a[href^="/app/courses/"]')
    .filter({ has: page.getByRole("heading", { name: courseName }) })
    .first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  await expect(page).toHaveURL(/\/app\/courses\/[^/]+$/, { timeout: 20_000 });
  const courseId = page.url().split("/app/courses/")[1]?.split(/[?#]/)[0] ?? "";
  const courseCode = (await page.locator(".cc-course-code--badge").first().innerText()).trim();
  return { courseId, courseCode };
}

export async function joinCourseViaCode(page: Page, courseCode: string) {
  await page.goto("/app/courses");
  const input = page.getByTestId("courses-join-code-input").first();
  await expect(input).toBeVisible({ timeout: 20_000 });
  await input.fill(courseCode);
  await page.getByTestId("courses-join-submit").first().click();
}

export async function createTeamViaUI(page: Page, courseId: string, teamName: string, memberCount: number) {
  await page.goto(`/app/courses/${courseId}/teams`);
  await page.getByTestId("teams-create-open").click();
  await page.getByTestId("teams-create-name").fill(teamName);
  await page.getByTestId("teams-create-project").fill(`${teamName}-프로젝트`);

  const memberButtons = page.locator('[data-testid^="teams-create-member-"]');
  const total = await memberButtons.count();
  const picks = Math.min(memberCount, total);
  for (let i = 0; i < picks; i += 1) {
    await memberButtons.nth(i).click();
  }
  await page.getByTestId("teams-create-submit").click();
  await expect(page).toHaveURL(new RegExp(`/app/courses/${courseId}/teams/`), { timeout: 20_000 });
}

export async function archiveCourseViaUI(page: Page, courseId: string) {
  await page.goto(`/app/courses/${courseId}`);
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByTestId("course-archive-button").click();
  await expect(page.getByText("종료된 수업입니다.")).toBeVisible({ timeout: 20_000 });
}

export async function submitPeerReviewsForAllTeammates(page: Page, courseId: string) {
  await page.goto(`/app/courses/${courseId}`);
  const peerReviewBtn = page.getByTestId("course-detail-side-peer-review");
  if (!(await peerReviewBtn.isVisible().catch(() => false))) return;
  await peerReviewBtn.click();
  await expect(page.getByTestId("team-peer-review-page-title")).toBeVisible({ timeout: 20_000 });

  const submitButtons = page.locator('[data-testid^="peer-review-submit-"]');
  const count = await submitButtons.count();
  for (let i = 0; i < count; i += 1) {
    const submitBtn = submitButtons.nth(i);
    const alreadySubmitted = await submitBtn.getByText("✓ 등록됨").isVisible().catch(() => false);
    if (alreadySubmitted) continue;
    const block = submitBtn.locator("xpath=ancestor::div[contains(@class,'rounded-[10px]')][1]");
    await block.getByRole("button").first().click();
    page.once("dialog", (dialog) => void dialog.accept());
    await submitBtn.click();
    await expect(submitBtn.getByText("✓ 등록됨")).toBeVisible({ timeout: 20_000 });
  }
}

export async function openStudentProfileFromNetwork(page: Page, courseId: string) {
  await page.goto(`/app/courses/${courseId}/students`);
  const card = page.locator('[data-testid^="student-network-card-"]').first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  await expect(page.getByTestId("student-profile-modal")).toBeVisible({ timeout: 20_000 });
}
