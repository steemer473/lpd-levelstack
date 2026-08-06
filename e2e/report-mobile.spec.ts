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

async function openMobileMenu(page: Page) {
  const globalNav = page.getByRole("navigation", { name: "LevelStack" })
  await globalNav.getByRole("button", { name: /Open menu/i }).click()
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible()
}

function menuSectionsNav(page: Page) {
  return page
    .getByRole("dialog", { name: "Menu" })
    .getByRole("navigation", { name: "Report sections" })
}

function menuSectionTab(page: Page, label: RegExp) {
  return menuSectionsNav(page).getByRole("button", { name: label })
}

test.describe("Report mobile — dev preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PREVIEW_PATH)
    await expect(page.locator(".levelstack-report")).toBeVisible()
  })

  test("executive tab loads without horizontal page scroll", async ({ page }) => {
    await assertNoHorizontalPageOverflow(page)
    await expect(page.getByRole("heading", { name: /Executive Summary/i })).toBeVisible()
    await expect(page.getByText(/We checked 2 of the 6 areas/i)).toBeVisible()
    await expect(page.locator(".rpt-conv-kpi-strip")).toBeVisible()
    await expect(page.getByText(/Now viewing:/i)).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Report sections\. Current/i }),
    ).toHaveCount(0)
  })

  test("unlock modal layout fits mobile viewport", async ({ page }) => {
    await page.goto(`${PREVIEW_PATH}?modal=unlock`)
    await expect(page.locator(".levelstack-report")).toBeVisible()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Full 90-day prioritized action plan/i)).toBeVisible()
    await expect(
      dialog.getByRole("link", { name: /Unlock — \$97|Unlock Action Roadmap — \$97/i }),
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
    await openMobileMenu(page)
    await menuSectionTab(page, /Revenue funnel/i).click()
    await expect(
      page.getByRole("dialog", { name: /Unlock|Included in your Action Roadmap/i }),
    ).toBeVisible()
  })

  test("section guide tooltip stays within viewport", async ({ page }) => {
    await page.getByRole("button", { name: /About /i }).first().click()
    const tip = page.locator("[data-slot=popover-content]")
    await expect(tip).toBeVisible()
    const tipBox = await tip.boundingBox()
    const viewport = page.viewportSize()
    expect(tipBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    if (tipBox && viewport) {
      expect(tipBox.x).toBeGreaterThanOrEqual(-1)
      expect(tipBox.y).toBeGreaterThanOrEqual(-1)
      expect(tipBox.x + tipBox.width).toBeLessThanOrEqual(viewport.width + 1)
      expect(tipBox.y + tipBox.height).toBeLessThanOrEqual(viewport.height + 1)
      const textOverflow = await tip.evaluate((el) => el.scrollWidth > el.clientWidth + 1)
      expect(textOverflow).toBe(false)
    }
  })

  test("upgrade banner CTA is visible and stacks on narrow viewports", async ({ page }) => {
    const banner = page.locator(".rpt-upsell")
    await banner.scrollIntoViewIfNeeded()
    await expect(banner).toBeVisible()
    await assertButtonTextVisible(page, /Unlock — \$97|Unlock Action Roadmap — \$97/i)
    await expect(banner.getByText(/one-time, no subscription/i)).toBeVisible()
    const bannerBox = await banner.boundingBox()
    const cta = banner.getByRole("link", { name: /Unlock — \$97|Unlock Action Roadmap/i })
    const ctaBox = await cta.boundingBox()
    expect(bannerBox).not.toBeNull()
    expect(ctaBox).not.toBeNull()
    if (bannerBox && ctaBox && page.viewportSize() && page.viewportSize()!.width < 640) {
      expect(ctaBox.y).toBeGreaterThan(bannerBox.y + 20)
      expect(ctaBox.width).toBeGreaterThanOrEqual(bannerBox.width - 56)
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
    await openMobileMenu(page)
    const competitiveTab = menuSectionTab(page, /Competitive context/i)
    await expect(competitiveTab.getByLabel("Locked")).toHaveCount(0)
    await competitiveTab.click()
    await expect(page.locator(".levelstack-report .overflow-x-auto table")).toBeVisible()
    await assertNoHorizontalPageOverflow(page)
  })

  test("hamburger lists sections before top-nav links, Unlock CTA last", async ({
    page,
  }) => {
    const globalNav = page.getByRole("navigation", { name: "LevelStack" })
    await expect(globalNav.getByRole("button", { name: /Open menu/i })).toBeVisible()
    await expect(globalNav.getByRole("link", { name: /^Home$/i })).toHaveCount(0)
    await expect(globalNav.getByRole("link", { name: /^Intake$/i })).toHaveCount(0)

    await openMobileMenu(page)
    const menu = page.getByRole("dialog", { name: "Menu" })
    await expect(menu).toBeVisible()

    const exec = menuSectionsNav(page).getByRole("button", { name: /Executive Summary/i })
    const questions = menu.getByRole("link", { name: /Questions/i })
    const unlock = menu.getByRole("link", { name: /Unlock — \$97|Unlock Action Roadmap — \$97/i })
    await expect(exec).toBeVisible()
    await expect(questions).toBeVisible()
    await expect(unlock).toBeVisible()
    await expect(menu.getByRole("button", { name: /Sign out/i })).toHaveCount(0)

    const execBox = await exec.boundingBox()
    const questionsBox = await questions.boundingBox()
    const unlockBox = await unlock.boundingBox()
    expect(execBox).not.toBeNull()
    expect(questionsBox).not.toBeNull()
    expect(unlockBox).not.toBeNull()
    if (execBox && questionsBox && unlockBox) {
      expect(execBox.y).toBeLessThan(questionsBox.y)
      expect(questionsBox.y).toBeLessThan(unlockBox.y)
    }
  })

  test("all seven sidebar tabs are reachable without page overflow", async ({ page }) => {
    const lockedTabs = [
      /Reputation/i,
      /Digital presence/i,
      /Revenue funnel/i,
      /Competitive context/i,
      /Action plan/i,
    ]
    const tabs = [
      /Executive Summary/i,
      /Google visibility/i,
      /Reputation/i,
      /Digital presence/i,
      /Revenue funnel/i,
      /Competitive context/i,
      /Action plan/i,
    ]

    for (const tab of tabs) {
      await openMobileMenu(page)
      await menuSectionTab(page, tab).click()
      if (lockedTabs.some((locked) => locked.source === tab.source)) {
        const unlockDialog = page.getByRole("dialog", {
          name: /Unlock Your|Included in your Action Roadmap/i,
        })
        await expect(unlockDialog).toBeVisible()
        await unlockDialog
          .getByRole("button", { name: /Return to Visibility Snapshot/i })
          .click()
        await expect(unlockDialog).toHaveCount(0)
      }
      await assertNoHorizontalPageOverflow(page)
    }
  })
})
