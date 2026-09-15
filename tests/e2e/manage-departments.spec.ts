import { test, expect } from "@playwright/test"

test.describe("Admin creates department and club", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("admin@cse-portal.edu")
    await page.getByLabel("Password").fill("changeme123")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/")
  })

  test("admin creates a department", async ({ page }) => {
    await page.goto("/manage/clubs")
    await page.getByRole("tab", { name: "Departments" }).click()
    await page.getByLabel("Name").fill("Test Dept")
    await page.getByLabel("Slug").fill("test-dept")
    await page.getByLabel("Description").fill("Test description")
    await page.getByRole("button", { name: "Create Department" }).click()
    await expect(page.getByText("Test Dept")).toBeVisible()
  })

  test("admin creates a club and it appears on /clubs", async ({ page }) => {
    await page.goto("/manage/clubs")
    await page.getByRole("tab", { name: "Clubs" }).click()
    await page.getByLabel("Name").fill("Test Club")
    await page.getByLabel("Department").selectOption("CSE")
    await page.getByRole("button", { name: "Create Club" }).click()
    await page.goto("/clubs")
    await expect(page.getByText("Test Club")).toBeVisible()
  })
})
