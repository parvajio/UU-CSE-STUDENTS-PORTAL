import { test, expect } from "@playwright/test"

function getHref(locator: import("@playwright/test").Locator): Promise<string> {
  return locator.getAttribute("href") as Promise<string>
}

test.describe("Club membership self-service", () => {
  test("club detail shows separate Executives and Members sections", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    await expect(page.getByRole("heading", { name: "Executives" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Members", exact: true })).toBeVisible()
  })

  test("guest clicking Join Club is sent to login with a callback URL", async ({ page }) => {
    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    await page.getByRole("link", { name: /join club/i }).click()
    await page.waitForURL(/\/login/)
    const callback = new URL(page.url()).searchParams.get("callbackUrl")
    expect(callback).toBe(href)
  })

  test("unauthenticated membership join is rejected with 401", async ({ request }) => {
    // Fresh `request` fixture carries no auth cookies.
    const res = await request.post("/api/clubs/00000000-0000-0000-0000-000000000000/membership")
    expect(res.status()).toBe(401)
  })

  test("signed-in user can join without a profile, sees group links, and leave", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("admin@cse-portal.edu")
    await page.getByLabel("Password").fill("changeme123")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForURL("/")

    await page.goto("/clubs")
    const href = await getHref(page.locator("a[href^='/clubs/']").first())
    await page.goto(href)

    // Join (works with or without a profile) → confirm → group-links modal.
    const joinControl = page.getByRole("button", { name: /join club/i }).or(
      page.getByRole("link", { name: /join club/i })
    )
    // If already a member from a previous run, leave first to reset state.
    if (await page.getByRole("button", { name: /leave/i }).count()) {
      await page.getByRole("button", { name: /leave/i }).first().click()
      await page.getByRole("button", { name: "Confirm leave" }).click()
      await expect(page.getByRole("link", { name: /join club/i })).toBeVisible()
    }
    await page.getByRole("button", { name: /join club/i }).click()
    await page.getByRole("button", { name: "Confirm join" }).click()
    await expect(page.getByText(/you're on the list/i)).toBeVisible()
    await page.getByRole("button", { name: "Done" }).click()

    // Leave restores the pre-test state.
    await page.getByRole("button", { name: /leave/i }).first().click()
    await page.getByRole("button", { name: "Confirm leave" }).click()
    await expect(page.getByRole("button", { name: /join club/i })).toBeVisible()
  })
})
