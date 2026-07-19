import { expect, test } from "@playwright/test"

const SAMPLE_PATH = "/sample-report"

test.describe("Sample report — public marketing preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SAMPLE_PATH)
    await expect(page.locator(".levelstack-report")).toBeVisible()
  })

  test("shows sample badge and executive dashboard", async ({ page }) => {
    await expect(page.getByText("Sample Report", { exact: true })).toBeVisible()
    await expect(page.getByText(/all data is illustrative/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /Your public presence scores/i })).toBeVisible()
    await expect(page.locator(".rpt-conv-kpi-strip")).toBeVisible()
  })

  test("sidebar has eight tabs including executive summary", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Report sections" })
    await expect(nav.getByRole("button", { name: /Executive Summary/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Search footprint/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Social & off-site presence/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Reputation/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Digital presence/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Revenue funnel/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Competitive context/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Action plan/i })).toBeVisible()
  })

  test("search footprint tab shows Google AI Overview preview", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Report sections" })
      .getByRole("button", { name: /Search footprint/i })
      .click()
    await expect(page.getByText(/Google AI Overview/i)).toBeVisible()
  })

  test("locked tab opens unlock modal", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Report sections" })
      .getByRole("button", { name: /Revenue funnel/i })
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("OD-5 B: free exec shows capped teaser titles without Who/Time matrix", async ({
    page,
  }) => {
    const card = page.locator(".rpt-card").filter({
      has: page.getByRole("heading", { name: /Your next decisions/i }),
    })
    await expect(card).toBeVisible()
    await expect(card.getByText("Respond to both negative Google reviews")).toBeVisible()
    await expect(
      page.getByRole("button", { name: /View full action plan \(locked\)/i }),
    ).toBeVisible()
    await expect(card.getByText("Owner")).toHaveCount(0)
    await expect(card.getByText("Time")).toHaveCount(0)
  })

  test("OD-5 B: action plan tab stays locked with blurred teaser", async ({ page }) => {
    await page
      .getByRole("navigation", { name: "Report sections" })
      .getByRole("button", { name: /Action plan/i })
      .click()
    await expect(
      page.getByRole("button", { name: /Unlock Action Roadmap — \$97/i }),
    ).toBeVisible()
    await expect(page.getByText(/prioritized action/i).first()).toBeVisible()
    await expect(page.getByText("Respond to both negative Google reviews")).toBeVisible()
    // Full matrix labels stay paid-only
    await expect(page.getByText("If ignored")).toHaveCount(0)
  })
})

test("legacy HTML path redirects to sample report", async ({ page }) => {
  const response = await page.goto("/levelstack-sample-report.html")
  expect(response?.url()).toContain("/sample-report")
})
