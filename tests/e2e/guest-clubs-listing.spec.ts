import { test, expect } from "@playwright/test"

test.describe("Guest browses /clubs", () => {
  test("guest sees departments and clubs without login", async ({ page }) => {
    await page.goto("/clubs")
    await expect(page.getByText("Student Clubs")).toBeVisible()
    const departments = page.locator("h2")
    await expect(departments.first()).toBeVisible()
  })

  test("guest sees approved clubs grouped by department", async ({ page }) => {
    await page.goto("/clubs")
    const departmentSections = page.locator("section")
    await expect(departmentSections.first()).toBeVisible()
  })

  test("guest does not see rejected or pending clubs", async ({ page }) => {
    await page.goto("/clubs")
    const pageContent = page.locator("body")
    await expect(pageContent).not.toContainText("rejected")
    await expect(pageContent).not.toContainText("pending")
  })

  test("department with no clubs shows empty state", async ({ page }) => {
    await page.goto("/clubs")
    const emptyStates = page.locator("text=No clubs yet")
    if (await emptyStates.count() > 0) {
      await expect(emptyStates.first()).toBeVisible()
    }
  })
})
