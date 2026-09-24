import { test, expect } from "@playwright/test"

test.describe("Admin manages achievements and events", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("admin@cse-portal.edu")
    await page.getByLabel("Password").fill("changeme123")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/")
  })

  test("admin creates achievement and event, verifies they appear on club detail page", async ({ page }) => {
    await page.goto("/manage/clubs")
    await page.getByRole("tab", { name: "Clubs" }).click()
    const clubLinks = page.locator("a[href^='/clubs/']")
    const firstClubHref = await clubLinks.first().getAttribute("href")
    const clubId = firstClubHref?.replace("/clubs/", "") ?? ""

    await page.goto(`/manage/clubs/${clubId}/achievements`)
    await page.getByLabel("Title").fill("Test Achievement")
    await page.getByLabel("Description").fill("Test achievement description")
    await page.getByRole("button", { name: "Create Achievement" }).click()
    await expect(page.getByText("Test Achievement")).toBeVisible()

    await page.goto(`/manage/clubs/${clubId}/events`)
    await page.getByRole("button", { name: "New Event" }).click()
    await page.getByLabel("Name").fill("Test Event")
    await page.getByLabel("Date").fill(new Date().toISOString().split("T")[0])
    await page.getByLabel("Description").fill("Test event description")
    await page.getByRole("button", { name: "Create event", exact: true }).click()

    await page.goto(`/clubs/${clubId}`)
    await expect(page.getByText("Test Achievement")).toBeVisible()
    await expect(page.getByText("Test Event")).toBeVisible()
  })
})
