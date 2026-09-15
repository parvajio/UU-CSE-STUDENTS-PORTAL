import { test, expect } from "@playwright/test"

test.describe("Club section full e2e", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("admin@cse-portal.edu")
    await page.getByLabel("Password").fill("changeme123")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/")
  })

  test("full admin flow: create department, club, verify on /clubs", async ({ page }) => {
    await page.goto("/manage/clubs")
    await page.getByRole("tab", { name: "Departments" }).click()
    await page.getByLabel("Name").fill("Full Test Dept")
    await page.getByLabel("Slug").fill("full-test-dept")
    await page.getByRole("button", { name: "Create Department" }).click()
    await expect(page.getByText("Full Test Dept")).toBeVisible()

    await page.getByRole("tab", { name: "Clubs" }).click()
    await page.getByLabel("Name").fill("Full Test Club")
    await page.getByLabel("Department").selectOption("CSE")
    await page.getByRole("button", { name: "Create Club" }).click()
    await page.goto("/clubs")
    await expect(page.getByText("Full Test Club")).toBeVisible()
  })
})
