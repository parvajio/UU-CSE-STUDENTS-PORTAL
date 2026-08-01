import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test"

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@cse-portal.edu"
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "changeme123"

const runId = Date.now().toString(36)
const studentEmail = `e2e.student.${runId}@example.test`
const studentPassword = "Str0ngP@ssw0rd!"
const studentName = `E2E Student ${runId}`
const studentId = `E2E-${runId.toUpperCase()}`
const whatsapp = "+8801999999999"
const githubUrl = "https://github.com/e2e-student"

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.waitForURL("**/")
}

async function submitProfile(page: Page, bio: string) {
  await page.getByLabel("Full name").fill(studentName)
  await page.getByLabel("Student ID").fill(studentId)
  await page.getByLabel("Section").click()
  await page.getByRole("option", { name: "Section A", exact: true }).click()
  await page.getByLabel("Batch").click()
  await page.getByRole("option", { name: "65", exact: true }).click()
  await page.getByLabel("Bio").fill(bio)
  await page.getByLabel("GitHub").fill(githubUrl)
  await page.getByLabel("WhatsApp number").fill(whatsapp)
  await page.getByRole("button", { name: "Web Development", exact: true }).click()
  await page.getByRole("button", { name: "Submit for review", exact: true }).click()
}

async function guestSearch(browser: Browser, query: string): Promise<Page> {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto("/directory")
  await page.getByLabel("Search directory").fill(query)
  await page.getByRole("button", { name: "Search", exact: true }).click()
  await page.waitForURL(/\/directory\?q=/)
  return page
}

test.describe.configure({ mode: "serial" })

let studentContext: BrowserContext
let studentPage: Page

test.beforeAll(async ({ browser }) => {
  studentContext = await browser.newContext()
  studentPage = await studentContext.newPage()
})

test.afterAll(async () => {
  await studentContext.close()
})

test("US2 — register and submit profile as pending", async () => {
  await studentPage.goto("/register")
  await studentPage.getByLabel("Email").fill(studentEmail)
  await studentPage.getByLabel("Password", { exact: true }).fill(studentPassword)
  await studentPage.getByLabel("Confirm password").fill(studentPassword)
  await studentPage.getByRole("button", { name: "Create account", exact: true }).click()
  await studentPage.waitForURL("**/")

  await studentPage.goto("/profile")
  await submitProfile(studentPage, "A short bio for the e2e validation.")

  await expect(studentPage.getByText(/Your profile is under review/)).toBeVisible()

  await studentPage.goto("/my-submissions")
  await expect(studentPage.getByText("Pending Review").first()).toBeVisible()
  await expect(studentPage.getByRole("heading", { name: studentName })).toBeVisible()
})

test("US1a — guest search does not show a pending profile", async ({ browser }) => {
  const page = await guestSearch(browser, studentName)
  await expect(page.getByRole("heading", { name: studentName })).toHaveCount(0)
  await page.context().close()
})

test("US3 — admin approves the pending profile", async ({ browser }) => {
  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD)

  await adminPage.goto("/approve")
  await expect(adminPage.getByRole("heading", { name: "Approvals" })).toBeVisible()

  const card = adminPage
    .locator("div.rounded-xl.border")
    .filter({ hasText: studentName })
    .first()
  await expect(card).toBeVisible()
  await card.getByRole("button", { name: "Review", exact: true }).click()
  await adminPage.getByRole("button", { name: "Approve", exact: true }).click()

  await expect(adminPage.getByRole("heading", { name: studentName })).toHaveCount(0)
  await adminContext.close()
})

test("US1b — guest search shows approved profile with guest-visible fields only", async ({
  browser,
}) => {
  const page = await guestSearch(browser, "Web Development")
  await expect(page.getByRole("heading", { name: studentName })).toBeVisible()
  await expect(page.getByText("Batch 65")).toBeVisible()
  const card = page
    .getByRole("heading", { name: studentName })
    .locator("xpath=ancestor::div[contains(@class,'rounded-xl')]")
  await expect(card.getByText("Web Development")).toBeVisible()
  await expect(page.getByText(whatsapp)).toHaveCount(0)
  await expect(page.getByText(githubUrl)).toHaveCount(0)
  await page.context().close()
})

test("Scenario 3 — role-based access control", async ({ browser }) => {
  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()
  await guestPage.goto("/profile")
  await expect(guestPage).toHaveURL(/\/login\?callbackUrl=.*profile/)
  await guestContext.close()

  const response = await studentPage.goto("/manage/roles")
  expect(response?.status()).toBe(403)
  await expect(studentPage.getByText("Forbidden")).toBeVisible()

  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD)
  await adminPage.goto("/approve")
  await expect(adminPage.getByRole("heading", { name: "Approvals" })).toBeVisible()
  await adminContext.close()
})

test("US4 — editing an approved profile reverts it to pending", async ({ browser }) => {
  await studentPage.goto("/profile")
  await studentPage.getByRole("button", { name: "Edit Profile", exact: true }).click()
  const bio = studentPage.getByLabel("Bio")
  await bio.fill("Updated bio after approval.")
  await studentPage.getByRole("button", { name: "Submit for review", exact: true }).click()

  await expect(studentPage.getByText(/Your profile is under review/)).toBeVisible()

  const page = await guestSearch(browser, studentName)
  await expect(page.getByRole("heading", { name: studentName })).toHaveCount(0)
  await page.context().close()
})
