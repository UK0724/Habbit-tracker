import { test, expect } from "@playwright/test";

test.describe("Habit Tracker & Expenses E2E", () => {
  const testUser = {
    email: `playwright_${Date.now()}@example.com`,
    password: "Password123!"
  };

  test.beforeEach(async ({ page }, testInfo) => {
    // The first-run walkthrough only opens for accounts without habits; test 1
    // walks through it explicitly. Anywhere else, skip it if it ever appears.
    if (!testInfo.title.startsWith("1."))
      await page.addLocatorHandler(
        page.locator("[data-onboarding-dialog]"),
        async (dialog) => {
          await dialog.getByRole("button", { name: "Skip" }).click();
        },
        { noWaitAfter: true }
      );
    // Reward celebrations (badges, level-ups, Legendary Day) are modal by design.
    // Dismiss them whenever they appear so each test exercises its own flow.
    await page.addLocatorHandler(
      page.locator("[data-achievement-dialog], [data-level-up-dialog], [data-legendary-dialog]"),
      async (dialog) => {
        await dialog.getByRole("button", { name: "Continue" }).click();
      },
      // Several can queue (badges, then level-up, then Legendary Day).
      { noWaitAfter: true }
    );
  });

  test.beforeEach(async ({ request }, testInfo) => {
    testUser.email = `playwright_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
    if (testInfo.title.startsWith("1.")) return;
    const response = await request.post("/api/auth/register", {
      data: testUser
    });
    const account = await response.json();
    if (response.ok())
      await request.post("/api/habits", {
        headers: { Authorization: "Bearer " + account.data.token },
        data: { title: "Morning Meditation", type: "action", color: "violet" }
      });
  });

  test("1. User registration, login, and redirection to Today page", async ({
    page
  }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Character|Habit/i);

    // Register with password confirmation
    await page.fill("input#email", testUser.email);
    await page.fill("input#password", testUser.password);
    await page.fill("input#confirm", testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to Today dashboard "/"
    await page.waitForURL("**/habits", { timeout: 15000 });
    await expect(page.locator("text=Today").first()).toBeVisible({
      timeout: 10000
    });

    // A brand-new account gets the walkthrough; a starter habit starts Day 1.
    const walkthrough = page.getByRole("dialog", { name: "Welcome to Pulse" });
    await expect(walkthrough).toBeVisible();
    for (let step = 0; step < 3; step++)
      await walkthrough.getByRole("button", { name: "Next" }).click();
    await walkthrough.getByRole("button", { name: /Drink water/ }).click();
    await expect(walkthrough).toHaveCount(0);
    await expect(page.getByText("your streak has started")).toBeVisible();
    await expect(page.getByText("Drink water").first()).toBeVisible();
  });

  test("2. Simple habit creation without multi-checkbox clutter", async ({
    page
  }) => {
    // Login with registered user
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("input#email", testUser.email);
    await page.fill("input#password", testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/habits", { timeout: 15000 });

    // Navigate to Create Habit
    await page.goto("/habits/new");
    await expect(page.locator("text=New habit").first()).toBeVisible({
      timeout: 10000
    });

    // Verify removed clutter: no complex linking checkboxes
    await expect(page.locator("text=Link to Job Search Tracker")).toHaveCount(
      0
    );
    await expect(page.locator("text=Link to DSA Prep Tracker")).toHaveCount(0);

    // Fill simple habit details
    await page.fill("input#title", "Evening Stretch");
    await page.fill("textarea#description", "10 minutes of mindfulness");
    await page.click('button[type="submit"]:has-text("Create habit")');

    // /habits/new opens the create dialog over the list; saving closes it.
    await expect(
      page.getByRole("dialog", { name: "Create New Habit" })
    ).toHaveCount(0, { timeout: 15000 });
    await page.reload();
    await expect(page.getByText("Evening Stretch").first()).toBeVisible({
      timeout: 10000
    });
  });

  test("3. Daily check-in tracking and streak progression", async ({
    page
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("input#email", testUser.email);
    await page.fill("input#password", testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/habits", { timeout: 15000 });

    // Today page should list the created habit
    await expect(page.locator("text=Morning Meditation").first()).toBeVisible({
      timeout: 10000
    });

    // Mark habit as done
    await page
      .getByRole("button", { name: /^Mark habit done/ })
      .first()
      .click();
    await expect(
      page
        .getByRole("button", { name: /^Mark habit incomplete/ })
        .first()
    ).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole("button", { name: /^Mark habit incomplete/ })
        .first()
    ).toBeVisible();
  });

  test("4. Expenses workspace navigation, layout, and Add Expense modal popup", async ({
    page
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("input#email")).toBeVisible({ timeout: 10000 });
    await page.fill("input#email", testUser.email);
    await page.fill("input#password", testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000
    });

    // Close any celebration overlay if visible
    const closeCelebration = page.locator(
      'button:has-text("Close & Continue"), button:has-text("Continue")'
    );
    if (await closeCelebration.isVisible()) {
      await closeCelebration.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Expenses (sidebar or bottom dock)
    await page.locator('a[href="/expenses"]:visible').first().click();
    await page.waitForURL("**/expenses", { timeout: 15000 });
    await expect(page.locator("text=Spending Dashboard").first()).toBeVisible({
      timeout: 10000
    });

    // Open and verify Add Expense modal popup
    await page.locator('button:has-text("Add Expense")').first().click();
    await expect(page.locator("text=Log New Expense")).toBeVisible({
      timeout: 5000
    });
    await page.locator('button:has-text("Cancel")').first().click();
  });

  test("5. Top-right profile dropdown menu, 1-tap quick tick, and Add Habit modal popup", async ({
    page
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("input#email")).toBeVisible({ timeout: 10000 });
    await page.fill("input#email", testUser.email);
    await page.fill("input#password", testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000
    });

    // Click profile dropdown trigger in header
    const profileTrigger = page
      .locator('header button[aria-label*="Account menu"]:visible')
      .first();
    await expect(profileTrigger).toBeVisible({ timeout: 10000 });
    await profileTrigger.click();

    // Verify dropdown menu items (Profile, Settings, Badges)
    await expect(
      page.locator('a[href="/profile"]:visible').first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('a[href="/settings"]:visible').first()
    ).toBeVisible({ timeout: 5000 });

    // Navigate to Profile via dropdown
    await page.locator('a[href="/profile"]:visible').first().click();
    await page.waitForURL("**/profile", { timeout: 15000 });

    // Return to Habits/Today page
    await page.goto("/habits");
    await page.waitForURL("**/habits**", { timeout: 15000 });

    // Verify 1-tap tick button is present on the habit card
    const tickBtn = page.locator('button[aria-label*="Mark habit"]').first();
    await expect(tickBtn).toBeVisible({ timeout: 10000 });

    // Verify Add Habit popup modal opens from Habits page
    const newHabitBtn = page.locator('button:has-text("New habit")').first();
    await expect(newHabitBtn).toBeVisible({ timeout: 5000 });
    await newHabitBtn.click();
    await expect(page.locator("text=Create New Habit")).toBeVisible({
      timeout: 5000
    });
    await page.locator('button:has-text("Cancel")').first().click();
  });

  test("6. Streamlined 3-item navigation, unified Habits tabs, and rich Insights", async ({
    page
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("input#email")).toBeVisible({ timeout: 10000 });
    await page.fill("input#email", testUser.email);
    await page.fill("input#password", testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000
    });

    // Verify sidebar primary navigation only contains 3 items (Habits, Insights, Expenses)
    const sidebarNavLinks = page.locator(
      "aside#primary-navigation a, aside nav a"
    );
    await expect(sidebarNavLinks).toHaveCount(3);

    // Verify "Pulse Tracker" text is completely removed from top navigation
    await expect(page.locator('header:has-text("Pulse Tracker")')).toHaveCount(
      0
    );

    // Verify Habits segmented tabs are present
    const todayTab = page.locator('button:has-text("Today")').first();
    const allHabitsTab = page.locator('button:has-text("All Habits")').first();
    await expect(todayTab).toBeVisible({ timeout: 5000 });
    await expect(allHabitsTab).toBeVisible({ timeout: 5000 });

    // Switch to All Habits tab
    await allHabitsTab.click();
    await expect(page.locator("text=Active Habits").first()).toBeVisible({
      timeout: 5000
    });

    // Navigate to Insights and verify new Day-of-the-Week chart and KPI metrics
    await page.locator('a[href="/insights"]').first().click();
    await page.waitForURL("**/insights", { timeout: 15000 });
    await expect(page.locator("text=Day-of-the-Week Adherence")).toBeVisible({
      timeout: 5000
    });
    await expect(page.locator("text=Adherence Rate")).toBeVisible({
      timeout: 5000
    });
  });
  test("7. Modal controls stay pinned and hidden fields cannot block saving", async ({
    page
  }) => {
    await page.goto("/login");
    await page.locator("#email").fill(testUser.email);
    await page.locator("#password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/habits");
    await page.getByRole("button", { name: "New habit", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Create New Habit" });
    const save = dialog.getByRole("button", {
      name: "Create habit",
      exact: true
    });
    const close = dialog.getByRole("button", { name: "Close dialog" });
    await expect(close).toBeFocused();
    await dialog.evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map((animation) => animation.finished)
      );
    });
    const positions = {
      close: await close.boundingBox(),
      save: await save.boundingBox()
    };
    await dialog
      .getByRole("button", { name: "Slate", exact: true })
      .scrollIntoViewIfNeeded();
    expect((await close.boundingBox())!.y).toBeCloseTo(positions.close!.y, 0);
    expect((await save.boundingBox())!.y).toBeCloseTo(positions.save!.y, 0);
    expect(positions.save!.y + positions.save!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height
    );
    await dialog
      .getByLabel("Title", { exact: true })
      .fill("Schedule switch regression");
    await dialog.getByRole("button", { name: /Measurable Track/ }).click();
    await dialog.getByRole("button", { name: /Within a range/ }).click();
    await dialog.getByRole("button", { name: /Action Done/ }).click();
    await dialog.getByLabel("Repeat frequency").selectOption("weekly");
    await dialog.getByLabel("Target completions per week").fill("0");
    await dialog.getByLabel("Repeat frequency").selectOption("weekdays");
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"])
      await dialog.getByRole("button", { name: day, exact: true }).click();
    await dialog.getByLabel("Repeat frequency").selectOption("daily");
    await save.click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText("Schedule switch regression", { exact: true })
    ).toBeVisible();
  });

  test.describe("Network failure recovery", () => {
    // Service-worker-controlled requests can bypass Playwright routing in WebKit.
    // This test must intercept the POST to simulate a pending request and outage.
    test.use({ serviceWorkers: "block" });
    test("8. Failed saves preserve input and allow retry without duplicate requests", async ({
      page
    }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.goto("/login");
      await page.locator("#email").fill(testUser.email);
      await page.locator("#password").fill(testUser.password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL("**/habits");
      await page
        .getByRole("button", { name: "New habit", exact: true })
        .click();
      const dialog = page.getByRole("dialog", { name: "Create New Habit" });
      await dialog
        .getByLabel("Title", { exact: true })
        .fill("Recoverable save");
      let posts = 0;
      let release: (() => void) | undefined;
      await page.route("**/api/habits", async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        posts++;
        if (posts === 1) {
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          return route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ message: "Temporary outage. Try again." })
          });
        }
        return route.continue();
      });
      await dialog
        .getByRole("button", { name: "Create habit", exact: true })
        .click({ noWaitAfter: true });
      await expect(
        dialog.getByRole("button", { name: "Saving...", exact: true })
      ).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "Close dialog" })
      ).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeVisible();
      await expect.poll(() => Boolean(release)).toBeTruthy();
      release!();
      await expect(dialog.getByRole("alert")).toContainText("Temporary outage");
      await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
        "Recoverable save"
      );
      await dialog
        .getByRole("button", { name: "Create habit", exact: true })
        .click();
      await expect(dialog).toBeHidden();
      expect(posts).toBe(2);
      expect(pageErrors).toEqual([]);
    });
  });

  test("9. Skipped habits are excused from today's progress", async ({
    page,
    request
  }) => {
    await page.goto("/login");
    await page.locator("#email").fill(testUser.email);
    await page.locator("#password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/habits");

    const login = await request.post("/api/auth/login", { data: testUser });
    const token = (await login.json()).data.token as string;
    const headers = { Authorization: `Bearer ${token}` };
    const profile = await request.get("/api/gamification/profile", { headers });
    const today = (await profile.json()).data.today as string;
    const habits = await request.get("/api/habits", { headers });
    const skippedId = (await habits.json()).data[0].id as string;
    const skip = await request.post(`/api/habits/${skippedId}/logs`, {
      headers,
      data: { date: today, status: "skipped" }
    });
    expect(skip.ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByText("No quests due today")).toBeVisible();
    await expect(
      page.getByText("Morning Meditation", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("All Done!")).toHaveCount(0);

    const created = await request.post("/api/habits", {
      headers,
      data: { title: "Reading", type: "action", color: "violet" }
    });
    expect(created.ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByText("of 1 due quest")).toBeVisible();
    await page
      .getByRole("article")
      .filter({ hasText: "Reading" })
      .getByRole("button", { name: /^Mark habit done/ })
      .click();
    await expect(page.getByText("All Done!")).toBeVisible();
  });
});
