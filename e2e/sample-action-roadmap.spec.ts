import { expect, test, type Page } from "@playwright/test"

const SAMPLE_PATH = "/sample-report/action-roadmap"

async function assertNoHorizontalPageOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth > doc.clientWidth + 1
  })
  expect(hasOverflow).toBe(false)
}

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
    await page.getByRole("button", { name: /About this section/i }).click()
    await expect(page.getByText(/What this section shows/i)).toBeVisible()
    await expect(page.getByText(/Priority \(P0–P3\)/i).first()).toBeVisible()
    await page.keyboard.press("Escape")
    const firstItem = page.locator(".rpt-roadmap-item").first()
    await expect(firstItem).toBeVisible()
    await expect(firstItem.locator(".rpt-badge").first()).toBeVisible()
    await expect(firstItem.getByText(/Impact/i).first()).toBeVisible()
    await expect(firstItem.getByText(/Effort/i).first()).toBeVisible()
    await expect(firstItem.getByText(/Priority/i).first()).toBeVisible()
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

test.describe("Sample Action Roadmap — mobile responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SAMPLE_PATH)
    await expect(page.locator(".levelstack-report")).toBeVisible()
  })

  test("hamburger menu button is visible and contrasting at scroll top", async ({ page }) => {
    const menuBtn = page
      .getByRole("navigation", { name: "LevelStack" })
      .getByRole("button", { name: /Open menu/i })
    await expect(menuBtn).toBeVisible()
    const color = await menuBtn.evaluate((el) => getComputedStyle(el).color)
    // Expect light/white-ish text (rgb with high R/G/B), not near-black on navy
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    expect(match).not.toBeNull()
    if (match) {
      const r = Number(match[1])
      const g = Number(match[2])
      const b = Number(match[3])
      expect(r + g + b).toBeGreaterThan(500)
    }
  })

  test("overall score card is full width above Executive Summary heading", async ({ page }) => {
    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()
    if (!viewport || viewport.width >= 640) {
      test.skip()
      return
    }

    const scoreCard = page.locator(".rpt-dash-header .rpt-overall-score-card")
    const heading = page.getByRole("heading", { name: /Executive Summary/i })
    await expect(scoreCard).toBeVisible()
    await expect(heading).toBeVisible()

    const scoreBox = await scoreCard.boundingBox()
    const headingBox = await heading.boundingBox()
    const headerBox = await page.locator(".rpt-dash-header").boundingBox()
    expect(scoreBox).not.toBeNull()
    expect(headingBox).not.toBeNull()
    expect(headerBox).not.toBeNull()
    if (scoreBox && headingBox && headerBox) {
      expect(scoreBox.y).toBeLessThan(headingBox.y)
      expect(scoreBox.width).toBeGreaterThanOrEqual(headerBox.width - 8)
    }
  })

  test("About these scores has readable contrast when expanded", async ({ page }) => {
    const details = page.locator(".rpt-score-disclaimer")
    await expect(details).toBeVisible()
    await details.locator("summary").click()
    const body = details.locator("p").first()
    await expect(body).toBeVisible()
    const styles = await body.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { color: cs.color, background: cs.backgroundColor }
    })
    const colorMatch = styles.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    expect(colorMatch).not.toBeNull()
    if (colorMatch) {
      const r = Number(colorMatch[1])
      const g = Number(colorMatch[2])
      const b = Number(colorMatch[3])
      // Body text should be dark enough (not washed-out muted)
      expect((r + g + b) / 3).toBeLessThan(140)
    }
  })

  test("score calculation drawer content is not clipped on mobile", async ({ page }) => {
    await page.getByRole("button", { name: /How your score was calculated/i }).click()
    const row = page.locator(".rpt-score-breakdown-row").first()
    await expect(row).toBeVisible()
    const clipped = await row.evaluate((el) => el.scrollWidth > el.clientWidth + 2)
    expect(clipped).toBe(false)
    await expect(page.getByText("In average").first()).toBeVisible()
    await assertNoHorizontalPageOverflow(page)
  })

  test("priority actions table scrolls inside wrapper without page overflow", async ({
    page,
  }) => {
    const table = page.locator(".rpt-priority-table")
    await expect(table).toBeVisible()
    await table.scrollIntoViewIfNeeded()
    const scrollWrap = page.locator(".rpt-priority-section .overflow-x-auto")
    await expect(scrollWrap).toBeVisible()
    const wrapBox = await scrollWrap.boundingBox()
    const viewport = page.viewportSize()
    expect(wrapBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    if (wrapBox && viewport) {
      expect(wrapBox.width).toBeLessThanOrEqual(viewport.width)
    }
    await assertNoHorizontalPageOverflow(page)
  })

  test("site footer links stack one per line and are centered on mobile", async ({ page }) => {
    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()
    if (!viewport || viewport.width >= 768) {
      test.skip()
      return
    }

    const footer = page.locator("footer").last()
    await footer.scrollIntoViewIfNeeded()
    const linkA = footer.getByRole("link", { name: /levelplaydigital\.com/i })
    const linkB = footer.getByRole("link", { name: /Privacy Policy/i })
    const linkC = footer.getByRole("link", { name: /Terms of Service/i })
    await expect(linkA).toBeVisible()
    await expect(linkB).toBeVisible()
    await expect(linkC).toBeVisible()

    const boxA = await linkA.boundingBox()
    const boxB = await linkB.boundingBox()
    const boxC = await linkC.boundingBox()
    expect(boxA).not.toBeNull()
    expect(boxB).not.toBeNull()
    expect(boxC).not.toBeNull()
    if (boxA && boxB && boxC) {
      expect(boxB.y).toBeGreaterThan(boxA.y + boxA.height / 2)
      expect(boxC.y).toBeGreaterThan(boxB.y + boxB.height / 2)
      const footerBox = await footer.boundingBox()
      expect(footerBox).not.toBeNull()
      if (footerBox) {
        const center = footerBox.x + footerBox.width / 2
        expect(Math.abs(boxA.x + boxA.width / 2 - center)).toBeLessThan(24)
        expect(Math.abs(boxB.x + boxB.width / 2 - center)).toBeLessThan(24)
        expect(Math.abs(boxC.x + boxC.width / 2 - center)).toBeLessThan(24)
      }
    }
  })
})
