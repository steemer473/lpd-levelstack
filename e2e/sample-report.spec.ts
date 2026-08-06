import { expect, test, type Page } from "@playwright/test"

const SAMPLE_PATH = "/sample-report"

async function openMobileMenu(page: Page) {
  await page
    .getByRole("navigation", { name: "LevelStack" })
    .getByRole("button", { name: /Open menu/i })
    .click()
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible()
}

function reportSectionsNav(page: Page) {
  const menuNav = page
    .getByRole("dialog", { name: "Menu" })
    .getByRole("navigation", { name: "Report sections" })
  const inlineNav = page.locator("aside.rpt-sidebar").getByRole("navigation", {
    name: "Report sections",
  })
  return menuNav.or(inlineNav)
}

test.describe("Sample report — public marketing preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SAMPLE_PATH)
    await expect(page.locator(".levelstack-report")).toBeVisible()
  })

  test("shows sample badge and executive dashboard", async ({ page }) => {
    await expect(page.getByText("Sample Report", { exact: true })).toBeVisible()
    await expect(page.getByText(/all data is illustrative/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /Executive Summary/i })).toBeVisible()
    await expect(page.getByText(/We checked 2 of the 6 areas/i)).toBeVisible()
    await expect(page.locator(".rpt-conv-kpi-strip")).toBeVisible()
  })

  test("sidebar has eight tabs including executive summary", async ({ page }) => {
    await openMobileMenu(page)
    const nav = reportSectionsNav(page)
    await expect(nav.getByRole("button", { name: /Executive Summary/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Google visibility/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Social & off-site presence/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Reputation/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Digital presence/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Revenue funnel/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Competitive context/i })).toBeVisible()
    await expect(nav.getByRole("button", { name: /Action plan/i })).toBeVisible()
  })

  test("Google visibility tab shows Google AI Overview preview", async ({ page }) => {
    await openMobileMenu(page)
    await reportSectionsNav(page)
      .getByRole("button", { name: /Google visibility/i })
      .click()
    await expect(page.getByText(/Google AI Overview/i)).toBeVisible()
  })

  test("locked tab opens unlock modal", async ({ page }) => {
    await openMobileMenu(page)
    await reportSectionsNav(page)
      .getByRole("button", { name: /Revenue funnel/i })
      .click()
    await expect(
      page.getByRole("dialog", { name: /Unlock Your|Included in your Action Roadmap/i }),
    ).toBeVisible()
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
      card.getByText(/Full prioritized action plan stays locked/i),
    ).toBeVisible()
    await expect(card.getByText("Owner")).toHaveCount(0)
    await expect(card.getByText("Time")).toHaveCount(0)
  })

  test("free exec shows three insight cards with dynamic research lines", async ({
    page,
  }) => {
    const insights = page.locator(".rpt-conv-insights")
    await expect(insights).toBeVisible()

    await expect(insights.getByText("What prospects see", { exact: true })).toBeVisible()
    await expect(insights.getByText("Social presence", { exact: true })).toBeVisible()
    await expect(insights.getByText("Where you're exposed", { exact: true })).toBeVisible()

    await expect(
      insights.getByText(/When prospects search for/i),
    ).toBeVisible()
    await expect(
      insights.getByText(/Findings are based on live Google search results/i),
    ).toBeVisible()
    await expect(insights.getByText(/From public research:/i).first()).toBeVisible()
    await expect(
      insights.getByText(/Social presence compares whether strangers can find credible LinkedIn/i),
    ).toBeVisible()
    await expect(
      insights.getByText(/Upgrade to Action Roadmap \(\$97\)/i).first(),
    ).toBeVisible()
    await expect(
      insights.getByText(/Revenue risk asks whether traffic and ad spend convert/i),
    ).toBeVisible()
  })

  test("shows Checks failed KPI and one upgrade module", async ({ page }) => {
    await expect(page.getByText("Checks failed", { exact: true })).toBeVisible()
    await expect(page.getByText("Warnings", { exact: true })).toBeVisible()
    await expect(page.getByText("Grade so far", { exact: true }).first()).toBeVisible()

    await page.getByRole("button", { name: /About Grade so far/i }).click()
    await expect(page.getByText("Grade so far", { exact: true }).nth(1)).toBeVisible()
    await expect(
      page.getByText(/Based on 2 of 6 areas checked/i),
    ).toBeVisible()
    await expect(
      page.getByText(/This grade will change as locked areas are opened/i),
    ).toBeVisible()

    const upgrade = page.locator("[data-upgrade-module=action-roadmap]")
    await expect(upgrade).toHaveCount(1)
    await expect(upgrade.getByText(/You've seen 2 of 6 areas/i)).toBeVisible()
    await expect(upgrade.locator("[data-area-unlocked]")).toHaveCount(6)
    await expect(upgrade.locator('[data-area-unlocked="true"]')).toHaveCount(2)
    await expect(upgrade.locator('[data-area-unlocked="false"]')).toHaveCount(4)
    await expect(
      upgrade.getByRole("link", { name: /Unlock Action Roadmap — \$97/i }),
    ).toBeVisible()
    await expect(
      upgrade.getByText(/applies in full as a credit|assessment fee credits/i),
    ).toBeVisible()
    await expect(page.getByText(/at capacity/i)).toHaveCount(0)
  })

  test("OD-5 B: action plan tab stays locked with unlock modal", async ({ page }) => {
    await openMobileMenu(page)
    await reportSectionsNav(page)
      .getByRole("button", { name: /Action plan/i })
      .click()
    const dialog = page.getByRole("dialog", {
      name: /Unlock Your|Included in your Action Roadmap/i,
    })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole("link", { name: /Unlock — \$97|Unlock Action Roadmap — \$97/i }),
    ).toBeVisible()
    await expect(dialog.getByText(/Action Roadmap shows how to close them/i)).toBeVisible()
  })
})

test("legacy HTML path redirects to sample report", async ({ page }) => {
  const response = await page.goto("/levelstack-sample-report.html")
  expect(response?.url()).toContain("/sample-report")
})
