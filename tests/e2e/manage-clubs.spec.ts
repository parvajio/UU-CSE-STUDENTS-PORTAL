import { test, expect } from "@playwright/test"

test.describe("Admin creates club", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("admin@cse-portal.edu")
    await page.getByLabel("Password").fill("changeme123")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/")
  })

  test("admin creates a club under department", async ({ page }) => {
    await page.goto("/manage/clubs")
    await page.getByRole("tab", { name: "Clubs" }).click()
    await page.getByLabel("Name").fill("ACM Test")
    await page.getByLabel("Department").selectOption("CSE")
    await page.getByRole("button", { name: "Create Club" }).click()
    await page.goto("/clubs")
    await expect(page.getByText("ACM Test")).toBeVisible()
  })
})
