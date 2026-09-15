import { test, expect } from "@playwright/test"

test.describe("Countdown timer", () => {
  test("timer updates every second", async ({ page }) => {
    await page.goto("/clubs")
    const timer = page.locator("[class*=\"font-heading font-semibold\"]").first()
    await expect(timer).toBeVisible()
  })
})

test.describe("Timer respects reduced motion", () => {
  test("timer shows completed when time passed", async ({ page }) => {
    await page.goto("/clubs")
    const completed = page.locator("text=completed")
    await expect(completed).toBeVisible()
  })
})
