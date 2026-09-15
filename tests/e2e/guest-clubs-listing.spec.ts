import { test, expect } from "@playwright/test"

test.describe("Guest browses /clubs", () => {
  test("guest sees departments and clubs without login", async ({ page }) => {
    await page.goto("/clubs")
    await expect(page.getByText("Student Clubs")).toBeVisible()
    const departments = page.locator("h2")
    await expect(departments.first()).toBeVisible()
  })
})
