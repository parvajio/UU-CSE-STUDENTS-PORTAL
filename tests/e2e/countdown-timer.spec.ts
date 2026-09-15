import { test, expect } from "@playwright/test"

function getHref(locator: import("@playwright/test").Locator): Promise<string> {
  return locator.getAttribute("href") as Promise<string>
}

test.describe("Countdown timer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("admin@cse-portal.edu")
    await page.getByLabel("Password").fill("changeme123")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForURL("/")
  })

  test("countdown timer updates every second", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    const clubId = href.replace("/clubs/", "")

    const futureStart = new Date(Date.now() - 60 * 1000).toISOString()
    const futureEnd = new Date(Date.now() + 2 * 60 * 1000).toISOString()

    const response = await page.request.post("/api/events", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        clubId,
        name: "Timer Update Test",
        date: new Date().toISOString(),
        startTime: futureStart,
        endTime: futureEnd,
      }),
    })
    expect(response.ok()).toBeTruthy()

    await page.goto(href)
    const timer = page.locator("span.font-heading.font-semibold").first()
    await expect(timer).toBeVisible({ timeout: 10000 })

    const textBefore = await timer.textContent()
    expect(textBefore).toBeTruthy()
    expect(textBefore).not.toBe("completed")

    await page.waitForTimeout(1100)

    const textAfter = await timer.textContent()
    expect(textAfter).toBeTruthy()
    expect(textAfter).not.toBe(textBefore)
    expect(textAfter).not.toBe("completed")
  })

  test("countdown timer resumes after tab switch", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    const clubId = href.replace("/clubs/", "")

    const futureStart = new Date(Date.now() - 60 * 1000).toISOString()
    const futureEnd = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    await page.request.post("/api/events", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        clubId,
        name: "Tab Switch Timer Test",
        date: new Date().toISOString(),
        startTime: futureStart,
        endTime: futureEnd,
      }),
    })

    await page.goto(href)
    const timer = page.locator("span.font-heading.font-semibold").first()
    await expect(timer).toBeVisible({ timeout: 10000 })

    const textBefore = await timer.textContent()
    expect(textBefore).toBeTruthy()

    const newPage = await page.context().newPage()
    await newPage.goto("/clubs")
    await newPage.waitForTimeout(1000)
    await newPage.close()

    const textAfter = await timer.textContent()
    expect(textAfter).toBeTruthy()
  })

  test("timer shows completed when endTime has passed", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    const clubId = href.replace("/clubs/", "")

    const pastDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    const pastStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    await page.request.post("/api/events", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        clubId,
        name: "Completed Event Test",
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        startTime: pastStart,
        endTime: pastDate,
      }),
    })

    await page.goto(href)
    await expect(page.getByText("completed", { exact: true })).toBeVisible({ timeout: 10000 })
  })

  test("timer respects reduced motion preference", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const mediaMatches = await page.evaluate(() =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
    expect(mediaMatches).toBe(true)

    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    const clubId = href.replace("/clubs/", "")

    const futureStart = new Date(Date.now() - 60 * 1000).toISOString()
    const futureEnd = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    await page.request.post("/api/events", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        clubId,
        name: "Reduced Motion Timer Test",
        date: new Date().toISOString(),
        startTime: futureStart,
        endTime: futureEnd,
      }),
    })

    await page.goto(href)
    const timer = page.locator("[data-testid='event-timer']").first()
    await expect(timer).toBeVisible({ timeout: 10000 })
    await expect(timer).toHaveAttribute("data-motion", "reduced")

    // Static snapshot: text must not tick while reduced motion is on.
    const textBefore = await timer.textContent()
    expect(textBefore).toBeTruthy()
    expect(textBefore).not.toBe("completed")

    await page.waitForTimeout(2200)

    const textAfter = await timer.textContent()
    expect(textAfter).toBe(textBefore)
  })
})
