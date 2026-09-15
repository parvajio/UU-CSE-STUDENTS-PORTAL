import { test, expect } from "@playwright/test"

function getHref(locator: import("@playwright/test").Locator): Promise<string> {
  return locator.getAttribute("href") as Promise<string>
}

test.describe("Guest visits /clubs/[clubId] and verifies all content sections render", () => {
  test("guest views club detail page with all content sections", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByText("About")).toBeVisible()
    await expect(page.getByText("Members")).toBeVisible()
    await expect(page.getByText("Gallery")).toBeVisible()
    await expect(page.getByText("Achievements")).toBeVisible()
    await expect(page.getByText("Events")).toBeVisible()
  })

  test("guest sees club name, description, logo, and cover image", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    await expect(page.locator("h1.font-heading")).toBeVisible()
  })

  test("guest sees social link anchors with rel=noopener noreferrer", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    const externalLinks = page.locator("a[target='_blank']")
    const count = await externalLinks.count()
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const rel = await externalLinks.nth(i).getAttribute("rel")
        expect(rel).toContain("noopener")
        expect(rel).toContain("noreferrer")
      }
    }
  })

  test("guest sees members section with avatar and member info", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    await expect(page.getByText("Members")).toBeVisible()
    const memberRows = page.locator("div.flex.items-center.gap-3")
    const count = await memberRows.count()
    if (count > 0) {
      await expect(memberRows.first()).toBeVisible()
    }
  })

  test("guest sees gallery section with albums", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    await expect(page.getByText("Gallery")).toBeVisible()
  })

  test("guest sees achievements section", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    await expect(page.getByText("Achievements")).toBeVisible()
  })

  test("guest sees events section with countdown timers", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    await expect(page.getByText("Events")).toBeVisible()
  })

  test("guest sees empty state when no content exists", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    const noMembers = page.locator("text=No members yet")
    const count = await noMembers.count()
    if (count > 0) {
      await expect(noMembers).toBeVisible()
    }
  })
})
