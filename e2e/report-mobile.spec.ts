import { expect, test, type Page } from "@playwright/test"

const PREVIEW_PATH = "/dev/report-preview"

async function assertNoHorizontalPageOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth > doc.clientWidth + 1
  })
  expect(hasOverflow).toBe(false)
}

async function assertButtonTextVisible(page: Page, name: RegExp) {
  const button = page.getByRole("button", { name }).or(page.getByRole("link", { name }))
  await expect(button.first()).toBeVisible()
  const box = await button.first().boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    expect(box.width).toBeGreaterThan(0)
    expect(box.height).toBeGreaterThanOrEqual(32)
  }
}

function sidebarTab(page: Page, label: RegExp) {
  return page
    .getByRole("navigation", { name: "Report sections" })
    .getByRole("button", { name: label })
}

test.describe("Report mobile — dev preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PREVIEW_PATH)
    await expect(page.locator(".levelstack-report")).toBeVisible()
  })

  test("executive tab loads without horizontal page scroll", async ({ page }) => {
    await assertNoHorizontalPageOverflow(page)
    await expect(page.getByRole("heading", { name: /Your public presence scores/i })).toBeVisible()
    await expect(page.locator(".rpt-conv-kpi-strip")).toBeVisible()
  })

  test("unlock modal layout fits mobile viewport", async ({ page }) => {
    await page.goto(`${PREVIEW_PATH}?modal=unlock`)
    await expect(page.locator(".levelstack-report")).toBeVisible()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Full 90-day prioritized action plan/i)).toBeVisible()
    await expect(
      dialog.getByRole("link", { name: /Unlock Action Roadmap — \$97/i }),
    ).toBeVisible()
    await expect(
      dialog.getByRole("button", { name: /Return to Visibility Snapshot/i }),
    ).toBeVisible()
    const dialogBox = await dialog.boundingBox()
    const viewport = page.viewportSize()
    expect(dialogBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    if (dialogBox && viewport) {
      expect(dialogBox.width).toBeLessThanOrEqual(viewport.width)
      expect(dialogBox.x).toBeGreaterThanOrEqual(0)
    }
    await assertNoHorizontalPageOverflow(page)
  })

  test("locked sidebar tab opens unlock modal", async ({ page }) => {
    const revenueTab = sidebarTab(page, /Revenue funnel/i)
    await revenueTab.scrollIntoViewIfNeeded()
    await revenueTab.click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("upgrade banner CTA is visible and stacks on narrow viewports", async ({ page }) => {
    const banner = page.locator(".rpt-upsell")
    await banner.scrollIntoViewIfNeeded()
    await expect(banner).toBeVisible()
    await assertButtonTextVisible(page, /Unlock Action Roadmap — \$97/i)
    const bannerBox = await banner.boundingBox()
    const ctaBox = await banner.getByRole("link", { name: /Unlock Action Roadmap/i }).boundingBox()
    expect(bannerBox).not.toBeNull()
    expect(ctaBox).not.toBeNull()
    if (bannerBox && ctaBox && page.viewportSize() && page.viewportSize()!.width < 640) {
      expect(ctaBox.y).toBeGreaterThan(bannerBox.y + 20)
    }
  })

  test("FAQ section has top spacing below upgrade banner", async ({ page }) => {
    const banner = page.locator(".rpt-upsell")
    const faq = page.getByRole("heading", { name: /Action Roadmap FAQs/i })
    await faq.scrollIntoViewIfNeeded()
    const bannerBox = await banner.boundingBox()
    const faqBox = await faq.boundingBox()
    expect(bannerBox).not.toBeNull()
    expect(faqBox).not.toBeNull()
    if (bannerBox && faqBox) {
      expect(faqBox.y - (bannerBox.y + bannerBox.height)).toBeGreaterThanOrEqual(16)
    }
  })

  test("competitive context tab scrolls grid inside container", async ({ page }) => {
    await page.goto(`${PREVIEW_PATH}?tier=paid`)
    await expect(page.locator(".levelstack-report")).toBeVisible()
    const competitiveTab = sidebarTab(page, /Competitive context/i)
    await competitiveTab.scrollIntoViewIfNeeded()
    await expect(competitiveTab.getByLabel("Locked")).toHaveCount(0)
    await competitiveTab.click()
    await expect(page.locator(".levelstack-report .overflow-x-auto table")).toBeVisible()
    await assertNoHorizontalPageOverflow(page)
  })

  test("all seven sidebar tabs are reachable without page overflow", async ({ page }) => {
    const lockedTabs = [/Revenue funnel/i, /Competitive context/i, /Action plan/i]
    const tabs = [
      /Executive Summary/i,
      /Search footprint/i,
      /Reputation/i,
      /Digital presence/i,
      /Revenue funnel/i,
      /Competitive context/i,
      /Action plan/i,
    ]

    for (const tab of tabs) {
      const navTab = sidebarTab(page, tab)
      await navTab.scrollIntoViewIfNeeded()
      await navTab.click()
      if (lockedTabs.some((locked) => locked.source === tab.source)) {
        await expect(page.getByRole("dialog")).toBeVisible()
        await page.getByRole("button", { name: /Return to Visibility Snapshot/i }).click()
        await expect(page.getByRole("dialog")).toHaveCount(0)
      }
      await assertNoHorizontalPageOverflow(page)
    }
  })
})
