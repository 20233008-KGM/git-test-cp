import { expect, type Page } from "@playwright/test";

export const e2eEmail = process.env.E2E_TEST_EMAIL ?? "";
export const e2ePassword = process.env.E2E_TEST_PASSWORD ?? "";
export const hasE2ECredentials = Boolean(e2eEmail && e2ePassword);

export const e2eProfessorEmail = process.env.E2E_PROFESSOR_EMAIL ?? "";
export const e2eProfessorPassword = process.env.E2E_PROFESSOR_PASSWORD ?? "";
export const hasProfessorE2ECredentials = Boolean(e2eProfessorEmail && e2eProfessorPassword);

export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/");
  await page.getByTestId("landing-login-form").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("landing-email-input").fill(email);
  await page.getByTestId("landing-password-input").fill(password);
  await page.getByTestId("landing-login-submit").click();
  await expect(page).toHaveURL(/\/app\/courses/, { timeout: 20_000 });
}

export async function loginProfessorViaLanding(page: Page) {
  await loginWithCredentials(page, e2eProfessorEmail, e2eProfessorPassword);
}

export async function loginViaLanding(page: Page) {
  await loginWithCredentials(page, e2eEmail, e2ePassword);
  await expect(
    page.getByRole("heading", { name: /현재 진행 수업|종료된 수업/ })
  ).toBeVisible({ timeout: 15_000 });
}

export async function openFirstCourse(page: Page) {
  const courseLink = page.locator('a[href^="/app/courses/"]').filter({
    has: page.locator("h2"),
  }).first();
  await expect(courseLink).toBeVisible({ timeout: 15_000 });
  await courseLink.click();
  await expect(page).toHaveURL(/\/app\/courses\/[^/]+/);
}

/** vision #35·#44 — 종료(archived) 시드 수업이 있으면 우선 진입 */
export async function openFirstArchivedCourse(page: Page) {
  const archivedLink = page
    .locator(
      'a[href*="/app/courses/course-swe-2025-archived"], a[href*="/app/courses/course-oop-2025-archived"]'
    )
    .filter({ has: page.locator("h2") })
    .first();
  if (await archivedLink.isVisible().catch(() => false)) {
    await archivedLink.click();
  } else {
    await openFirstCourse(page);
  }
  await expect(page).toHaveURL(/\/app\/courses\/[^/]+/);
}

export async function openTeamDeliverableModal(page: Page) {
  await page.getByTestId("team-deliverable-upload-button").click();
  await expect(page.getByTestId("team-deliverable-modal")).toBeVisible();
}

export async function openTeamTroubleshootingModal(page: Page) {
  await page.getByTestId("team-trouble-register-open").click();
  await expect(page.getByTestId("team-trouble-write-form")).toBeVisible();
}
