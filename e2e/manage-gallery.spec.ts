import { test, expect } from "@playwright/test"

test.describe("Admin manages gallery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("admin@cse-portal.edu")
    await page.getByLabel("Password").fill("changeme123")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/")
  })

  test("admin creates gallery album and uploads images", async ({ page }) => {
    await page.goto("/manage/clubs")
    await page.getByRole("tab", { name: "Clubs" }).click()
    const clubLinks = page.locator("a[href^='/clubs/']")
    const firstClubHref = await clubLinks.first().getAttribute("href")
    const clubId = firstClubHref?.replace("/clubs/", "") ?? ""
    await page.goto(`/manage/clubs/${clubId}/gallery`)

    await page.getByLabel("Title").fill("Test Album")
    await page.getByLabel("Description").fill("Test description")
    await page.getByRole("button", { name: "Create Album" }).click()

    await expect(page.getByText("Test Album")).toBeVisible()
    await expect(page.getByText("Test description")).toBeVisible()
  })
})
