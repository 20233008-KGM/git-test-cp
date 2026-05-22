import { test, expect } from "@playwright/test";
import {
  hasE2ECredentials,
  hasProfessorE2ECredentials,
  loginProfessorViaLanding,
  loginViaLanding,
  openFirstCourse,
  openFirstArchivedCourse,
  openTeamDeliverableModal,
  openTeamTroubleshootingModal,
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
    await expect(page.getByText("1조 - FIGMA")).toHaveCount(0);
    await expect(page.getByText("1조 - 중간발표")).toHaveCount(0);
    await expect(page.getByText("1조 - 기말발표")).toHaveCount(0);
  });

  test("47. 팀 워크스페이스 더미 스크린샷 칸 없음 (vision #54)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();
    await expect(page.getByText("프로젝트 산출물 & 공간")).toBeVisible();
    await expect(page.getByText(/1조 - FIGMA|1조 - 중간발표|1조 - 기말발표/)).toHaveCount(0);
  });

  test("4. 마이페이지 프로필 조회", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await expect(page.getByTestId("mypage-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "마이페이지" })).toBeVisible();
  });

  test("35. 마이페이지 진입 렌더 회귀 (vision #47)", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await expect(page.getByTestId("mypage-page")).toBeVisible();
    await expect(page.getByText("마이페이지 메뉴")).toBeVisible();
  });

  test("37. 마이페이지 과거 수업 전용 페이지 (vision #48)", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page.getByTestId("mypage-archived-courses-nav")).toBeVisible();
    await expect(page.locator('a[href*="/evals/my-peer-reviews"]')).toHaveCount(0);
    await page.getByTestId("mypage-archived-courses-nav").click();
    await expect(page).toHaveURL("/app/mypage/archived-courses");
    await expect(page.getByTestId("mypage-archived-courses-page")).toBeVisible();
    const cards = page.getByTestId("mypage-archived-course-card");
    if ((await cards.count()) > 0) {
      await expect(page.getByTestId("mypage-archived-my-peer-reviews").first()).toBeVisible();
    }
  });

  test("46. 내 팀 상세에서 트러블슈팅 작성 폼 노출 (vision #53)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();

    const myTeamCard = page
      .locator('[data-testid="teams-card-grid"] > div')
      .filter({ has: page.getByTestId("team-card-my-team-badge") })
      .first();
    test.skip(!(await myTeamCard.isVisible().catch(() => false)), "내 팀 카드 없음");
    await myTeamCard.getByRole("button", { name: "입장하기" }).click();

    await expect(page.getByTestId("team-trouble-register-open")).toBeVisible({ timeout: 10_000 });
    await openTeamTroubleshootingModal(page);
    await expect(page.getByTestId("team-trouble-problem-input")).toBeVisible();
    await expect(page.getByTestId("team-trouble-readonly-notice")).toHaveCount(0);
  });

  test("42. 다른 팀 상세에서 트러블슈팅 작성 폼 비노출 (vision #49)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();

    const otherTeamCard = page
      .locator('[data-testid="teams-card-grid"] > div')
      .filter({ hasNot: page.getByTestId("team-card-my-team-badge") })
      .first();
    test.skip(!(await otherTeamCard.isVisible().catch(() => false)), "다른 팀 카드 없음");
    await otherTeamCard.getByRole("button", { name: "입장하기" }).click();

    await expect(page.getByTestId("team-trouble-register-open")).toHaveCount(0);
    await expect(page.getByTestId("team-trouble-readonly-notice")).toBeVisible();
    await expect(page.getByTestId("team-trouble-problem-input")).toHaveCount(0);
  });

  test("41. 과거 수업 페이지 → 교수 평가 (vision #48)", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await page.getByTestId("mypage-archived-courses-nav").click();
    const profLink = page.getByTestId("mypage-archived-professor-evals").first();
    test.skip(!(await profLink.isVisible().catch(() => false)), "아카이브 수업 카드 없음");
    await profLink.click();
    await expect(page).toHaveURL(/\/evals\/professor/);
    await expect(page.getByTestId("course-professor-evals-student")).toBeVisible();
  });

  test("6. 마이페이지 A4 리포트 (용지·인쇄 버튼)", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await expect(page.getByTestId("mypage-a4-report-sheet")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("mypage-a4-print-button")).toBeVisible();
    await expect(page.getByTestId("report-activity-summary")).toContainText("집계:", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("mypage-summary-paragraph")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("mypage-refresh-report")).toHaveCount(0);
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
    const evalOverlay = page.getByTestId("professor-project-eval-modal-overlay");
    await expect(evalOverlay).toBeVisible({ timeout: 15_000 });
    expect(await evalOverlay.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
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

    const retroBtn = page.getByTestId("team-retrospective-page-link");
    const canRetro = await retroBtn.isVisible().catch(() => false);
    test.skip(!canRetro, "학생 계정·진행 중 수업에서만 회고록 버튼이 보입니다.");

    await retroBtn.click();
    await expect(page.getByTestId("team-retrospective-page-title")).toBeVisible();

    await page.getByTestId("retrospective-custom-role").fill(`e2e-retro-${Date.now()}`);
    await page.getByTestId("retrospective-submit").click();

    await expect(page.getByTestId("retrospective-submit")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("10. 수업 상세 사이드바 조원평가 제출", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);

    const peerReviewBtn = page.getByTestId("course-detail-side-peer-review");
    const canPeerReview = await peerReviewBtn.isVisible().catch(() => false);
    test.skip(!canPeerReview, "학생 계정·팀 배정 상태에서만 조원평가 버튼이 보입니다.");

    await peerReviewBtn.click();
    await expect(page.getByTestId("team-peer-review-page-title")).toBeVisible();

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

  test("15. 팀 상세 배포 링크 등록", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    const uniqueUrl = `https://example.com/e2e-${Date.now()}`;
    await openTeamDeliverableModal(page);
    await page.getByTestId("team-deliverable-link-url-input").fill(uniqueUrl);
    await page.getByTestId("team-deliverable-link-submit").click();
    await expect(page.getByRole("link", { name: "열기" }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(`a[href="${uniqueUrl}"]`).first()).toBeVisible();
  });

  test("16. 팀 상세 파일 업로드", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    const uniqueName = `e2e-upload-${Date.now()}.txt`;
    await openTeamDeliverableModal(page);
    await page.getByTestId("team-deliverable-file-input").setInputFiles({
      name: uniqueName,
      mimeType: "text/plain",
      buffer: Buffer.from("campusconnect e2e upload"),
    });
    await page.getByTestId("team-deliverable-link-submit").click();

    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15_000 });
  });

  test("17. 팀 상세 배포 링크 삭제", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());

    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    const uniqueUrl = `https://example.com/e2e-delete-${Date.now()}`;
    await openTeamDeliverableModal(page);
    await page.getByTestId("team-deliverable-link-url-input").fill(uniqueUrl);
    await page.getByTestId("team-deliverable-link-title-input").fill("e2e-link-delete");
    await page.getByTestId("team-deliverable-link-submit").click();

    const row = page.locator('[data-testid^="team-deliverable-item-"]', {
      has: page.getByText("e2e-link-delete"),
    }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.locator('[data-testid^="team-deliverable-delete-"]').click();
    await expect(row).toHaveCount(0);
  });

  test("18. 팀 상세 잘못된 링크 입력 검증", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    await openTeamDeliverableModal(page);
    await page.getByTestId("team-deliverable-link-url-input").fill("not valid url ###");
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByTestId("team-deliverable-link-submit").click();
    const dialog = await dialogPromise;
    await expect(dialog.message()).toContain("올바른 링크 형식");
    await dialog.accept();
  });

  test("19. 팀 상세 링크 프로토콜 자동보정", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    const rawUrl = `example.com/e2e-protocol-${Date.now()}`;
    const expectedUrl = `https://${rawUrl}`;
    await openTeamDeliverableModal(page);
    await page.getByTestId("team-deliverable-link-url-input").fill(rawUrl);
    await page.getByTestId("team-deliverable-link-title-input").fill("e2e-link-protocol");
    await page.getByTestId("team-deliverable-link-submit").click();
    await expect(page.locator(`a[href="${expectedUrl}"]`).first()).toBeVisible({ timeout: 15_000 });
  });

  test("20. 팀 상세 소스코드 파일 업로드", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    const uniqueName = `e2e-source-${Date.now()}.ts`;
    await openTeamDeliverableModal(page);
    await page.getByTestId("team-deliverable-file-input").setInputFiles({
      name: uniqueName,
      mimeType: "text/plain",
      buffer: Buffer.from("export const e2e = true;"),
    });
    await page.getByTestId("team-deliverable-link-submit").click();

    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15_000 });
  });

  test("21. 팀 상세 금지 확장자 업로드 차단", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    await openTeamDeliverableModal(page);
    await page.getByTestId("team-deliverable-file-input").setInputFiles({
      name: `e2e-blocked-${Date.now()}.exe`,
      mimeType: "application/octet-stream",
      buffer: Buffer.from("blocked"),
    });
    const dialogPromise = page.waitForEvent("dialog");
    await page.getByTestId("team-deliverable-link-submit").click();

    const dialog = await dialogPromise;
    await expect(dialog.message()).toContain("지원하지 않는 파일 형식");
    await dialog.accept();
  });

  test("22. 팀 상세 업로드 가이드 노출", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();
    await openTeamDeliverableModal(page);
    await expect(page.getByTestId("team-deliverable-upload-guide")).toContainText("node_modules");
    await expect(page.getByTestId("team-deliverable-upload-guide")).toContainText("ZIP");
    await expect(page.getByTestId("team-deliverable-upload-guide")).toContainText("500MB");
    await expect(page.getByTestId("team-deliverable-project-folder-picker")).toBeVisible();
  });

  test("23. 팀 상세 링크 제목 fallback", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    const rawUrl = `example.com/e2e-fallback-${Date.now()}/path`;
    const expectedUrl = `https://${rawUrl}`;
    await openTeamDeliverableModal(page);
    await page.getByTestId("team-deliverable-link-url-input").fill(rawUrl);
    await page.getByTestId("team-deliverable-link-submit").click();

    const row = page.locator('[data-testid^="team-deliverable-item-"]', {
      has: page.locator(`a[href="${expectedUrl}"]`),
    }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText("example.com/path");
  });

  test("24. 팀 상세 트러블슈팅 새로고침 유지", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();

    const myTeamCard = page
      .locator('[data-testid="teams-card-grid"] > div')
      .filter({ has: page.getByTestId("team-card-my-team-badge") })
      .first();
    test.skip(!(await myTeamCard.isVisible().catch(() => false)), "내 팀 카드 없음");
    await myTeamCard.getByRole("button", { name: "입장하기" }).click();

    const uniqueProblem = `e2e-trouble-persist-${Date.now()}`;
    await openTeamTroubleshootingModal(page);
    await page.getByTestId("team-trouble-problem-input").fill(uniqueProblem);
    await page.getByTestId("team-trouble-plan-input").fill("persist-check-plan");
    await page.getByTestId("team-trouble-submit").click();

    await expect(page.getByText(uniqueProblem).first()).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.getByText(uniqueProblem).first()).toBeVisible({ timeout: 15_000 });
  });

  test("25. 수업 상세 사이드바 조원평가 페이지 이동", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);

    await page.getByTestId("course-detail-side-peer-review").click();
    await expect(page).toHaveURL(/\/app\/courses\/.+\/teams\/.+\/peer-review$/);
    await expect(page.getByTestId("team-peer-review-page-title")).toBeVisible();
  });

  test("26. 팀 상세 회고록 전용 페이지 이동", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "입장하기" }).first().click();

    await page.getByTestId("team-retrospective-page-link").click();
    await expect(page).toHaveURL(/\/app\/courses\/.+\/teams\/.+\/retrospective$/);
    await expect(page.getByTestId("team-retrospective-page-title")).toBeVisible();
  });

  test("27. 수업 상세 나의팀멤버 탭 조회", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByTestId("course-detail-side-my-team-members").click();
    await expect(page.getByTestId("course-detail-my-team-members-title")).toBeVisible();
  });

  test("45. 나의팀멤버 클릭 시 프로필 fixed 모달", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByTestId("course-detail-side-my-team-members").click();

    const memberBtn = page
      .locator('[data-testid^="course-detail-my-team-member-"]')
      .filter({ hasNot: page.locator("text=(나)") })
      .first();
    test.skip(!(await memberBtn.isVisible().catch(() => false)), "다른 조원 없음");

    await memberBtn.click();
    const overlay = page.getByTestId("student-quick-profile-overlay");
    await expect(overlay).toBeVisible({ timeout: 15_000 });
    expect(await overlay.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
    await expect(page.getByTestId("student-quick-profile-modal")).toBeVisible();
    await overlay.click({ position: { x: 8, y: 8 } });
  });

  test("28. 수강생 카드 클릭 상세 프로필 모달 조회", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "수강자들", exact: true }).click();
    await expect(page).toHaveURL(/\/students/);

    await page.locator('[data-testid^="student-network-card-"]').first().click();
    await expect(page.getByTestId("student-profile-modal")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("student-profile-modal-detailed-bio")).not.toBeEmpty();
    const overlayPosition = await page
      .getByTestId("student-profile-modal-overlay")
      .evaluate((el) => getComputedStyle(el).position);
    expect(overlayPosition).toBe("fixed");
    await page.getByTestId("student-profile-modal-overlay").click({ position: { x: 8, y: 8 } });
    await expect(page.getByTestId("student-profile-modal")).toHaveCount(0);
  });

  test("44. 팀 탈퇴는 워크스페이스 안에서만 (vision #51)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();

    const myTeamCard = page
      .locator('[data-testid="teams-card-grid"] > div')
      .filter({ has: page.getByTestId("team-card-my-team-badge") })
      .first();
    test.skip(!(await myTeamCard.isVisible().catch(() => false)), "내 팀 카드 없음");

    await expect(myTeamCard.getByTestId(/^team-leave-/)).toHaveCount(0);
    await expect(myTeamCard.getByTestId(/^team-leave-hint-/)).toBeVisible();
    await expect(page.locator('[data-testid^="team-join-"]')).toHaveCount(0);

    await myTeamCard.getByRole("button", { name: "입장하기" }).click();
    await expect(page.getByTestId("team-workspace-leave-wrap")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("team-workspace-leave")).toBeVisible();
  });

  test("43. 수강생 프로필 모달이 뷰포트 중앙 fixed (vision #50)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "수강자들", exact: true }).click();

    const grid = page.locator(".grid").filter({ has: page.locator('[data-testid^="student-network-card-"]') }).first();
    await grid.evaluate((el) => el.scrollIntoView({ block: "end" }));
    await page.locator('[data-testid^="student-network-card-"]').first().click();

    const overlay = page.getByTestId("student-profile-modal-overlay");
    await expect(overlay).toBeVisible({ timeout: 15_000 });
    const box = await overlay.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const viewport = page.viewportSize();
      expect(viewport).not.toBeNull();
      if (viewport) {
        expect(box.width).toBeGreaterThan(viewport.width * 0.9);
        expect(box.height).toBeGreaterThan(viewport.height * 0.9);
      }
    }
    await overlay.click({ position: { x: 8, y: 8 } });
  });

  test("29. 팀 목록에서 내가 속한 팀 강조 UI 노출", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await page.getByRole("link", { name: "팀", exact: true }).click();
    await expect(page).toHaveURL(/\/teams/);
    await expect(page.getByTestId("team-card-my-team-badge").first()).toBeVisible({ timeout: 15_000 });
  });

  test("30. 수업 상세 네비 중복 제거 확인", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstCourse(page);
    await expect(page.getByText("수업 메뉴")).toHaveCount(1);
    await page.getByTestId("course-detail-side-my-team-members").click();
    await expect(page.getByTestId("course-detail-my-team-members-title")).toBeVisible();
  });

  test("31. 마이페이지 PAGE02 실데이터 카드 기준 확인", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");

    await page.getByTestId("mypage-report-next").click();
    await expect(page.getByText("PAGE 02 PROJECT DETAIL")).toBeVisible();

    const dbCards = page.getByTestId("mypage-team-card-db");
    const hasDbCard = (await dbCards.count()) > 0;
    test.skip(!hasDbCard, "종료 팀플 실데이터가 없는 계정에서는 DB 카드가 없습니다.");

    await expect(page.getByText("Supabase 팀 멤버십 기준 카드입니다.")).toBeVisible();
    await expect(page.getByText("각 카드를 클릭하면 상세 리포트를 확인할 수 있습니다.")).toHaveCount(0);
  });

  test("7. 마이페이지 리포트 페이지 전환", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await expect(page.getByTestId("mypage-summary-paragraph")).toContainText("트러블슈팅", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("mypage-summary-cards")).toBeVisible();
    await expect(page.getByTestId("mypage-competency-db")).toBeVisible();
    await expect(page.getByTestId("mypage-competency-db")).toContainText("DB 추정");
    await expect(page.getByTestId("mypage-activity-bullets")).toContainText("협업");
    await page.getByTestId("mypage-report-next").click();
    await expect(page.getByText("PAGE 02 PROJECT DETAIL")).toBeVisible();
    await expect(page.getByTestId("mypage-team-card-db")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("mypage-report-next").click();
    await expect(page.getByText("PAGE 03 PROBLEM SOLVING")).toBeVisible();
    await expect(page.getByTestId("mypage-page3-intro")).toContainText("트러블슈팅", {
      timeout: 15_000,
    });
  });

  test("34. 마이페이지 학생 프로필 수정", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await page.goto("/app/mypage/profile");
    const form = page.getByTestId("mypage-profile-edit-form");
    await expect(form).toBeVisible();

    const uniqueMajor = `E2E전공-${Date.now()}`;
    await page.getByTestId("mypage-profile-major").fill(uniqueMajor);
    await page.getByTestId("mypage-profile-save").click();
    await expect(page.getByText("프로필이 저장되었습니다.")).toBeVisible({ timeout: 10_000 });
  });

  test("32. 마이페이지 동적 리포트 네비 라벨", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page.getByTestId("mypage-report-next")).toContainText("주요 팀플 상세");
    await page.getByTestId("mypage-report-next").click();
    await expect(page.getByTestId("mypage-report-next")).toContainText("문제해결 경험");
    await expect(page.getByTestId("mypage-report-prev")).toContainText("역량 및 활동 요약");
  });

  test("36. 아카이브 평가 페이지 렌더 (schema 배너 허용)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstArchivedCourse(page);

    const myPeerNav = page.getByTestId("course-detail-side-my-peer-reviews");
    const hasArchivedNav = await myPeerNav.isVisible().catch(() => false);
    test.skip(!hasArchivedNav, "아카이브(종료) 수업에서만 사이드 네비가 표시됩니다.");

    await myPeerNav.click();
    await expect(page.getByTestId("course-my-peer-reviews-given")).toBeVisible();
    await expect(
      page
        .getByTestId("eval-schema-missing-banner")
        .or(page.getByText("제출한 조원평가가 없습니다."))
        .or(page.getByRole("heading", { level: 2 }))
    ).toBeVisible();

    await page.getByRole("link", { name: "← 수업으로" }).click();
    await page.getByTestId("course-detail-side-professor-evals").click();
    await expect(page.getByTestId("course-professor-evals-student")).toBeVisible();
  });

  test("33. 종료 수업 조원평가·교수 평가 조회 페이지", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstArchivedCourse(page);

    const myPeerNav = page.getByTestId("course-detail-side-my-peer-reviews");
    const hasArchivedNav = await myPeerNav.isVisible().catch(() => false);
    test.skip(!hasArchivedNav, "아카이브(종료) 수업에서만 사이드 네비가 표시됩니다.");

    await myPeerNav.click();
    await expect(page).toHaveURL(/\/evals\/my-peer-reviews/);
    await expect(page.getByTestId("course-my-peer-reviews-given")).toBeVisible();

    await page.getByRole("link", { name: "← 수업으로" }).click();
    await page.getByTestId("course-detail-side-professor-evals").click();
    await expect(page).toHaveURL(/\/evals\/professor/);
    await expect(page.getByTestId("course-professor-evals-student")).toBeVisible();
    const studentEval = page.getByTestId("course-professor-eval-student");
    const emptyEval = page.getByText("아직 교수 평가가 등록되지 않았습니다.");
    await expect(studentEval.or(emptyEval)).toBeVisible({ timeout: 10_000 });
    if (await studentEval.isVisible().catch(() => false)) {
      await expect(studentEval).toContainText(/평가|리드|패턴|도메인/);
      await expect(page.getByTestId("course-professor-eval-project")).toBeVisible();
    }
  });

  test("39. 종료 수업 내 조원평가 DB 카드 (vision #46)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstArchivedCourse(page);
    const myPeerNav = page.getByTestId("course-detail-side-my-peer-reviews");
    test.skip(!(await myPeerNav.isVisible().catch(() => false)), "아카이브 수업이 없습니다.");
    await myPeerNav.click();
    const card = page.getByTestId("course-my-peer-review-card");
    await expect(card.first()).toBeVisible({ timeout: 12_000 });
    await expect(card.first()).toContainText(/리더십|협업|도메인|기술/);
  });

  test("38. 종료 수업 교수 평가 DB 내용 (vision #46)", async ({ page }) => {
    await loginViaLanding(page);
    await openFirstArchivedCourse(page);
    const profNav = page.getByTestId("course-detail-side-professor-evals");
    test.skip(!(await profNav.isVisible().catch(() => false)), "아카이브 수업이 없습니다.");
    await profNav.click();
    await expect(page.getByTestId("course-professor-evals-student")).toBeVisible();
    await expect(page.getByTestId("course-professor-eval-student")).toBeVisible({
      timeout: 12_000,
    });
    await expect(page.getByTestId("course-professor-eval-project")).toBeVisible();
  });

  test("13. 마이페이지 AI 리포트 자동 채움", async ({ page }) => {
    await loginViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await expect(page.getByTestId("mypage-summary-paragraph")).toBeVisible({ timeout: 25_000 });
    const status = page.getByTestId("ai-report-message").or(page.getByTestId("ai-report-loading"));
    await expect(status.first()).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("ai-report-generate-button")).toHaveCount(0);
  });

  test("14. 교수 마이페이지 학생 리포트 비노출", async ({ page }) => {
    test.skip(!hasProfessorE2ECredentials, "E2E_PROFESSOR_EMAIL · E2E_PROFESSOR_PASSWORD 를 .env 에 설정하세요.");

    await loginProfessorViaLanding(page);
    await page.locator('a[href="/app/mypage"]').click();
    await expect(page).toHaveURL("/app/mypage");
    await expect(page.getByTestId("mypage-professor-dashboard")).toBeVisible();
    await expect(page.getByTestId("ai-report-generate-button")).toHaveCount(0);
    await expect(page.getByTestId("mypage-a4-print-button")).toHaveCount(0);
  });

  test("40. 교수 아카이브 동료평가 전체 조회 (vision #45)", async ({ page }) => {
    test.skip(!hasProfessorE2ECredentials, "E2E_PROFESSOR_EMAIL · E2E_PROFESSOR_PASSWORD 를 .env 에 설정하세요.");

    await loginProfessorViaLanding(page);
    await page.goto("/app/courses/course-swe-2025-archived/peer-reviews");
    await expect(page.getByTestId("course-peer-reviews-overview")).toBeVisible({
      timeout: 15_000,
    });
    const teamBlock = page.getByTestId("peer-reviews-team-team-swe-schedule");
    const emptyMsg = page.getByText("아직 제출된 동료평가가 없습니다.");
    await expect(teamBlock.or(emptyMsg)).toBeVisible({ timeout: 12_000 });
    if (await teamBlock.isVisible().catch(() => false)) {
      await expect(teamBlock).toContainText(/리더십|기술|일정/);
    }
  });

  test("48. vision #55 빈 수업 목록 시 수업코드 등록 UI 이중 표시 없음", async ({ page }) => {
    await loginViaLanding(page);
    await page.goto("/app/courses");
    await expect(page).toHaveURL("/app/courses");
    const empty = page.getByTestId("courses-empty-state");
    test.skip(!(await empty.isVisible().catch(() => false)), "등록된 수업이 있어 빈 목록 시나리오 생략");
    await expect(page.getByTestId("courses-join-by-code-banner")).toHaveCount(0);
    await expect(page.getByTestId("courses-join-by-code-empty")).toBeVisible();
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
