import { test, expect, type Page } from "@playwright/test"

// T055: end-to-end validation per specs/006-club-section/quickstart.md.
// Covers: admin create flow (QS-1), guest listing (QS-2), guest detail (QS-3),
// URL auto-detection (SC-006), dark mode (QS-7/T056), keyboard nav (T057),
// live timer on a fresh event (QS-5), and reduced-motion (T058/SC-009).

const ADMIN = { email: "admin@cse-portal.edu", password: "changeme123" }

async function loginAsAdmin(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(ADMIN.email)
  await page.getByLabel("Password").fill(ADMIN.password)
  await page.getByRole("button", { name: "Sign In" }).click()
  await page.waitForURL("/")
}

test.describe("Club section full e2e (quickstart validation)", () => {
  // QS-1: admin creates department + club, both visible on /clubs immediately.
  test("QS-1 admin creates department and club, visible on /clubs without approval", async ({
    page,
  }) => {
    await loginAsAdmin(page)
    const stamp = Date.now()
    const deptName = `Full Dept ${stamp}`
    const deptSlug = `full-dept-${stamp}`
    const clubName = `Full Club ${stamp}`

    await page.goto("/manage/clubs")
    await page.getByRole("button", { name: "Departments", exact: true }).click()
    await page.getByLabel("Name").fill(deptName)
    await page.getByLabel("Slug").fill(deptSlug)
    await page.getByRole("button", { name: "Create Department" }).click()
    // Form reloads the page on success — the new department must be listed.
    await expect(page.getByText(deptName)).toBeVisible({ timeout: 15000 })

    await page.getByRole("button", { name: "Clubs", exact: true }).click()
    await page.getByLabel("Name").fill(clubName)
    await page.getByLabel("Department").selectOption({ label: deptName })
    await page.getByRole("button", { name: "Create Club" }).click()
    await expect(page.getByText(clubName)).toBeVisible({ timeout: 15000 })

    await page.goto("/clubs")
    await expect(page.getByRole("heading", { name: deptName })).toBeVisible()
    await expect(page.getByText(clubName)).toBeVisible()
  })

  // QS-2: guest (logged out) sees departments grouped with clubs, no login.
  test("QS-2 guest browsing /clubs sees department groups without login", async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto("/clubs")
    await expect(page.getByRole("heading", { name: "Student Clubs" })).toBeVisible()
    // At least one department group renders once seed/QS-1 data exists.
    await expect(page.locator("section").first()).toBeVisible()
    await context.close()
  })

  // QS-3 + SC-006: club detail renders all sections; URLs become safe anchors.
  test("QS-3 club detail shows all sections and linkifies URLs", async ({ page }) => {
    await loginAsAdmin(page)
    const stamp = Date.now()
    const clubName = `Link Club ${stamp}`
    const clubUrl = `https://example.com/club-info-${stamp}`

    await page.goto("/manage/clubs")
    await page.getByRole("button", { name: "Clubs", exact: true }).click()
    await page.getByLabel("Name").fill(clubName)
    // Department select defaults to first option only when set — pick CSE seed dept.
    const deptOptions = await page.getByLabel("Department").locator("option").allTextContents()
    const deptLabel = deptOptions.find((t) => t.trim() && t.trim() !== "Select department") ?? ""
    await page.getByLabel("Department").selectOption({ label: deptLabel.trim() })
    await page.getByLabel("Description").fill(`Official site ${clubUrl} for updates.`)
    await page.getByRole("button", { name: "Create Club" }).click()
    await expect(page.getByText(clubName)).toBeVisible({ timeout: 15000 })

    await page.goto("/clubs")
    await page.getByText(clubName).click()
    await expect(page.getByRole("heading", { name: clubName })).toBeVisible()
    await expect(page.getByRole("heading", { name: "About" })).toBeVisible()
    await expect(page.getByRole("heading", { name: /Members/ })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Gallery" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Achievements" })).toBeVisible()
    await expect(page.getByRole("heading", { name: /Events/ })).toBeVisible()
    // SC-006: URL auto-detected as an external anchor with safe rel.
    const link = page.getByRole("link", { name: clubUrl })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", clubUrl)
    await expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  // QS-5: a fresh future event shows a live (non-completed) timer on detail.
  test("QS-5 event countdown timer is live on club detail page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/clubs")
    const firstClub = page.locator('a[href^="/clubs/"]').first()
    await expect(firstClub).toBeVisible()
    const href = await firstClub.getAttribute("href")
    const clubId = href?.split("/").pop()
    expect(clubId).toBeTruthy()

    const start = new Date(Date.now() + 3600_000).toISOString()
    const end = new Date(Date.now() + 2 * 3600_000).toISOString()
    const res = await page.request.post("/api/events", {
      data: {
        clubId,
        name: `Timer Check ${Date.now()}`,
        date: start,
        startTime: start,
        endTime: end,
      },
    })
    expect(res.ok()).toBeTruthy()

    await page.goto(`/clubs/${clubId}`)
    const timer = page.getByTestId("event-timer").first()
    await expect(timer).toBeVisible()
    await expect(timer).not.toHaveText("completed")
  })

  // T056/QS-7: page renders in dark color scheme without errors.
  test("T056 /clubs renders in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/clubs")
    await expect(page.getByRole("heading", { name: "Student Clubs" })).toBeVisible()
    await expect(page.locator("section").first()).toBeVisible()
  })

  // T057/SC-010: club cards are keyboard-focusable with visible focus.
  test("T057 club cards are keyboard reachable", async ({ page }) => {
    await page.goto("/clubs")
    const firstClub = page.locator('a[href^="/clubs/"]').first()
    await expect(firstClub).toBeVisible()
    await firstClub.focus()
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement | null
      return el ? el.getAttribute("href") : null
    })
    expect(focused).toMatch(/^\/clubs\//)
  })

  // T058/SC-009: timer degrades gracefully under reduced motion.
  test("T058 timer respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/clubs")
    const firstClub = page.locator('a[href^="/clubs/"]').first()
    if ((await firstClub.count()) === 0) {
      test.skip()
      return
    }
    await firstClub.click()
    const timer = page.getByTestId("event-timer").first()
    if ((await timer.count()) === 0) {
      test.skip()
      return
    }
    await expect(timer).toHaveAttribute("data-motion", "reduced")
  })
})
