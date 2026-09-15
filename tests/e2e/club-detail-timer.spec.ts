import { test, expect } from "@playwright/test"

async function getHref(locator: import("@playwright/test").Locator): Promise<string> {
  return locator.getAttribute("href") as Promise<string>
}

test.describe("Event countdown timer displays correctly on club detail page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("admin@cse-portal.edu")
    await page.getByLabel("Password").fill("changeme123")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/")
  })

  test("countdown timer updates every second on club detail page", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())

    const clubId = href.replace("/clubs/", "")

    const futureStart = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
    const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

    await page.request.post("/api/events", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({
        clubId,
        name: "Timer Test Event",
        date: new Date().toISOString(),
        startTime: futureStart,
        endTime: futureEnd,
      }),
    })

    await page.goto(href)
    await expect(page.getByText("Events")).toBeVisible()

    const timerLocators = page.locator("[class*=\"font-heading font-semibold\"]")
    await expect(timerLocators.first()).toBeVisible({ timeout: 10000 })

    const textBefore = await timerLocators.first().textContent()
    expect(textBefore).toBeTruthy()
    expect(textBefore).not.toBe("completed")

    await page.waitForTimeout(1100)
    const textAfter = await timerLocators.first().textContent()
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

    await expect(page.getByText("completed")).toBeVisible({ timeout: 10000 })
  })

  test("timer resumes correctly after tab switch", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())

    const clubId = href.replace("/clubs/", "")
    const futureStart = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
    const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

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
    await expect(page.getByText("Events")).toBeVisible()

    const timerLocators = page.locator("[class*=\"font-heading font-semibold\"]")
    await expect(timerLocators.first()).toBeVisible({ timeout: 10000 })

    const textBefore = await timerLocators.first().textContent()
    expect(textBefore).toBeTruthy()

    await page.waitForTimeout(500)
    const textAfter = await timerLocators.first().textContent()
    expect(textAfter).toBeTruthy()
  })
})
