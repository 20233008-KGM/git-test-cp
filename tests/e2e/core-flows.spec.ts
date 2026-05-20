import { test, expect } from "@playwright/test";
import {
  hasE2ECredentials,
  hasProfessorE2ECredentials,
  loginProfessorViaLanding,
  loginViaLanding,
  openFirstCourse,
} from "./helpers/auth";

test.describe("CampusConnect — 핵심 E2E (T-040)", () => {
  test.beforeEach(() => {
    test.skip(!hasE2ECredentials, "E2E_TEST_EMAIL · E2E_TEST_PASSWORD 를 .env 에 설정하세요.");
  });

  test("1. 랜딩 로그인 → 수업 목록", async ({ page }) => {
    await loginViaLanding(page);
  });

  test("2. 과목 상세 → 수강생 네트워크", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "수강자들", exact: true }).click();
    await expect(page).toHaveURL(/\/students/);
    await expect(page.getByRole("heading", { name: "수강자들 네트워크" })).toBeVisible();
  });

  test("3. 팀 목록 → 팀 상세", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await expect(page).toHaveURL(/\/teams/);
    await page.getByRole("button", { name: "입장하기" }).first().click();
    await expect(page).toHaveURL(/\/teams\//);
    await expect(page.getByText("프로젝트 산출물 & 공간")).toBeVisible();
  });

  test("4. 마이페이지 프로필 조회", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await expect(page.getByRole("heading", { name: "마이페이지" })).toBeVisible();
  });

  test("6. 마이페이지 DB 리포트 미리보기", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await page.getByRole("button", { name: "DB 활동 미리보기 (A4)" }).click();
    await expect(
      page.getByText("CampusConnect · 팀 프로젝트 역량 리포트")
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("report-activity-summary")).toContainText("집계:", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("report-activity-summary")).toContainText("트러블슈팅");
    await expect(page.getByTestId("report-activity-summary")).toContainText("교수평가");
  });

  test("12. 교수 팀 제출 현황·프로젝트 평가", async ({ page }) => {
    test.skip(!hasProfessorE2ECredentials, "E2E_PROFESSOR_EMAIL · E2E_PROFESSOR_PASSWORD 를 .env 에 설정하세요.");

    await loginProfessorViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    await expect(page.getByTestId("professor-team-submissions")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "프로젝트 평가" }).click();
    await page.getByTestId("professor-eval-holistic").fill(`e2e-prof-${Date.now()}`);
    await page.getByTestId("professor-project-eval-submit").click();
    await expect(page.getByRole("button", { name: "프로젝트 평가" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("11. 팀 상세 회고록 저장", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    const retroBtn = page.getByRole("button", { name: /회고록/ });
    const canRetro = await retroBtn.isVisible().catch(() => false);
    test.skip(!canRetro, "학생 계정·진행 중 수업에서만 회고록 버튼이 보입니다.");

    await retroBtn.click();
    await expect(page.getByRole("heading", { name: "회고록" })).toBeVisible();

    await page.getByTestId("retrospective-custom-role").fill(`e2e-retro-${Date.now()}`);
    await page.getByTestId("retrospective-submit").click();

    await expect(page.getByRole("button", { name: "회고록 수정" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("10. 팀 상세 동료평가 제출", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    const peerReviewBtn = page.getByRole("button", { name: "조원 평가" });
    const canPeerReview = await peerReviewBtn.isVisible().catch(() => false);
    test.skip(!canPeerReview, "학생 계정·진행 중 수업에서만 조원 평가 버튼이 보입니다.");

    await peerReviewBtn.click();
    await expect(page.getByRole("heading", { name: "동료평가" })).toBeVisible();

    const submitBtn = page.locator('[data-testid^="peer-review-submit-"]').first();
    const alreadySubmitted = await submitBtn.getByText("✓ 등록됨").isVisible().catch(() => false);
    if (!alreadySubmitted) {
      await page.getByText("키워드 등록").first().locator("..").getByRole("button").first().click();
      await submitBtn.click();
      await expect(submitBtn.getByText("✓ 등록됨")).toBeVisible({ timeout: 15_000 });
    }
  });

  test("9. 팀 상세 피드백 제출", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();
    await page
      .getByRole("heading", { name: "이 팀의 웹 서비스, 어떻게 생각하시나요?" })
      .scrollIntoViewIfNeeded();

    const alreadyDone = page.getByText("피드백이 완료되었습니다!");
    if (await alreadyDone.isVisible().catch(() => false)) {
      return;
    }

    const feedbackSection = page.locator("div").filter({
      has: page.getByRole("heading", { name: "이 팀의 웹 서비스, 어떻게 생각하시나요?" }),
    });
    await feedbackSection.getByRole("button").first().click();
    await page.getByTestId("team-feedback-submit").click();
    await expect(page.getByText("피드백이 완료되었습니다!")).toBeVisible({ timeout: 15_000 });
  });

  test("8. 팀 상세 채팅 메시지 전송", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();
    await page.getByRole("button", { name: "채팅방 이동" }).first().click();
    const unique = `e2e-chat-${Date.now()}`;
    await page.getByPlaceholder("메시지를 입력하세요.").fill(unique);
    await page.getByRole("button", { name: "전송" }).click();
    await expect(page.getByText(unique)).toBeVisible({ timeout: 15_000 });
  });

  test("7. 마이페이지 리포트 페이지 전환", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await page.getByRole("button", { name: "다음 페이지" }).click();
    await expect(page.getByText("PAGE 02 PROJECT DETAIL")).toBeVisible();
    await page.getByRole("button", { name: "다음 페이지" }).click();
    await expect(page.getByText("PAGE 03 PROBLEM SOLVING")).toBeVisible();
  });

  test("5. 로그아웃 → 랜딩", async ({ page }) => {
    await loginViaLanding(page);
    await page.getByTestId("logout-button").click();
    await expect(page).toHaveURL("/");
    await page.goto("/app/courses");
    await expect(page).toHaveURL("/");
  });
});

test.describe("인증 가드 (자격 증명 불필요)", () => {
  test("미로그인 시 /app/courses 는 랜딩으로 리다이렉트", async ({ page }) => {
    await page.goto("/app/courses");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });
});
