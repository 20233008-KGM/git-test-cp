import { test, expect } from "@playwright/test";
import {
  hasE2ECredentials,
  hasProfessorE2ECredentials,
  loginProfessorViaLanding,
  loginViaLanding,
  openFirstCourse,
} from "./helpers/auth";

/**
 * 실사용 관점 보완 E2E — core-flows.spec.ts 에 없는 핵심 여정
 * (수업 참여·팀 참여·공지·Q&A 등)
 */
test.describe("CampusConnect — 사용자 여정 보완", () => {
  test.beforeEach(() => {
    test.skip(!hasE2ECredentials, "E2E_TEST_EMAIL · E2E_TEST_PASSWORD 를 .env 에 설정하세요.");
  });

  test("U1. 수업 목록 → 강의 개요(과목 상세) 진입", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await expect(page.getByText("수업 메뉴")).toBeVisible();
  });

  test("U2. 팀 목록 — 내 팀 배지 또는 참여 버튼 중 하나 노출", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await expect(page).toHaveURL(/\/teams/);
    const myBadge = page.getByTestId("team-card-my-team-badge");
    const joinBtn = page.locator('[data-testid^="team-join-"]');
    await expect(myBadge.first().or(joinBtn.first())).toBeVisible({ timeout: 15_000 });
  });

  test("U3. 공지 게시판 페이지 진입 (학생)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    const annLink = page.getByRole("link", { name: /공지/ });
    test.skip(!(await annLink.isVisible().catch(() => false)), "공지 메뉴 없음");
    await annLink.click();
    await expect(page).toHaveURL(/\/announcements/);
  });

  test("U4. Q&A 목록 진입 (글로벌)", async ({ page }) => {
    await loginViaLanding(page);
    const qnaLink = page.locator('a[href="/app/qna"]').first();
    test.skip(!(await qnaLink.isVisible().catch(() => false)), "Q&A 네비 없음");
    await qnaLink.click();
    await expect(page).toHaveURL("/app/qna");
  });
});

test.describe("CampusConnect — 교수 여정 보완", () => {
  test.beforeEach(() => {
    test.skip(
      !hasProfessorE2ECredentials,
      "E2E_PROFESSOR_EMAIL · E2E_PROFESSOR_PASSWORD 를 .env 에 설정하세요."
    );
  });

  test("U5. 교수 — 공지 게시판 작성 UI 노출", async ({ page }) => {
    await loginProfessorViaLanding(page);
    await openFirstCourse(page);
    const annLink = page.getByRole("link", { name: /공지/ });
    test.skip(!(await annLink.isVisible().catch(() => false)), "공지 메뉴 없음");
    await annLink.click();
    await expect(page).toHaveURL(/\/announcements/);
    await expect(
      page.getByRole("button", { name: /글쓰기|새 공지|등록/ }).or(page.getByPlaceholder(/제목|공지/))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("U6. 교수 — 팀 생성 폼 열기 (수작업 팀)", async ({ page }) => {
    await loginProfessorViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    const createOpen = page.getByTestId("teams-create-open");
    test.skip(!(await createOpen.isVisible().catch(() => false)), "팀 생성 버튼 없음");
    await createOpen.click();
    await expect(page.getByTestId("teams-create-name")).toBeVisible();
    await expect(page.getByTestId("teams-create-submit")).toBeVisible();
  });
});
