import { expect, test, type Page } from "@playwright/test"

const SAMPLE_PATH = "/sample-report/action-roadmap"

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

test.describe("Sample Action Roadmap — public paid preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SAMPLE_PATH)
    await expect(page.locator(".levelstack-report")).toBeVisible()
  })

  test("shows sample badge and paid executive dashboard", async ({ page }) => {
    await expect(page.getByText("Sample Report", { exact: true })).toBeVisible()
    await expect(page.getByText(/all data is illustrative/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /Executive Summary/i })).toBeVisible()
    await expect(page.locator("[data-sample-cta=action-roadmap]")).toBeVisible()
    await expect(
      page
        .locator("[data-sample-cta=action-roadmap]")
        .getByRole("link", { name: /Unlock — \$97|Unlock Action Roadmap — \$97/i }),
    ).toBeVisible()
  })

  test("sidebar tabs are unlocked with no empty-state sections", async ({ page }) => {
    await openMobileMenu(page)
    const nav = reportSectionsNav(page)

    for (const name of [
      /Executive Summary/i,
      /Search Visibility/i,
      /Social & off-site presence/i,
      /Reputation/i,
      /Digital presence/i,
      /Revenue funnel/i,
      /Competitive context/i,
      /Action plan/i,
    ]) {
      await expect(nav.getByRole("button", { name })).toBeVisible()
    }

    await nav.getByRole("button", { name: /Reputation/i }).click()
    await expect(page.getByText(/wasn't included in this report version/i)).toHaveCount(0)
    await expect(
      page.getByText(/Google Business Profile shows 3\.2 stars from 6 reviews/i),
    ).toBeVisible()
  })

  test("Action Plan shows numbered cards with Impact, Effort, and Priority badges", async ({
    page,
  }) => {
    await openMobileMenu(page)
    await reportSectionsNav(page).getByRole("button", { name: /Action plan/i }).click()

    await expect(page.getByText(/Prioritized action plan/i)).toBeVisible()
    await expect(page.getByTestId("roadmap-how-to-read")).toBeVisible()
    await expect(
      page.getByTestId("roadmap-how-to-read").getByText(/Priority \(P0–P3\)/i),
    ).toBeVisible()
    const firstItem = page.locator(".rpt-roadmap-item").first()
    await expect(firstItem).toBeVisible()
    await expect(firstItem.locator(".rpt-badge").first()).toBeVisible()
    await expect(firstItem.getByText("Impact", { exact: true })).toBeVisible()
    await expect(firstItem.getByText("Effort", { exact: true })).toBeVisible()
    await expect(firstItem.getByText("Priority", { exact: true })).toBeVisible()
    await expect(firstItem.locator(".rpt-chip").first()).toBeVisible()
    await expect(
      page.getByText(/Respond to both negative Google reviews/i).first(),
    ).toBeVisible()
    await expect(page.getByText(/wasn't included in this report version/i)).toHaveCount(0)
  })

  test("Competitive Context shows the comparison grid", async ({ page }) => {
    await openMobileMenu(page)
    await reportSectionsNav(page)
      .getByRole("button", { name: /Competitive context/i })
      .click()

    await expect(page.getByText("ATL Fit Pro").first()).toBeVisible()
    await expect(page.getByText("FitLife Atlanta").first()).toBeVisible()
    await expect(page.getByText("Page 1 rank").first()).toBeVisible()
    await expect(page.getByText(/wasn't included in this report version/i)).toHaveCount(0)
  })

  test("deep-link tab query opens Action Plan", async ({ page }) => {
    await page.goto(`${SAMPLE_PATH}?tab=action_plan`)
    await expect(page.getByText(/Prioritized action plan/i)).toBeVisible()
    await expect(page.locator(".rpt-roadmap-item").first()).toBeVisible()
  })
})
