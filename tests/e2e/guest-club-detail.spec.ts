import { test, expect } from "@playwright/test"

test.describe("Guest views club detail", () => {
  test("guest visits club detail page", async ({ page }) => {
    await page.goto("/clubs")
    const firstClub = page.locator("a").first()
    const href = await firstClub.getAttribute("href")
    if (href && href.startsWith("/clubs/")) {
      await page.goto(href)
      await expect(page.getByRole("heading")).toBeVisible()
    }
  })
})
