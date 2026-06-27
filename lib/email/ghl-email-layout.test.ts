import { describe, expect, it } from "vitest"

import {
  GHL_EMAIL_TEMPLATES,
  GHL_MERGE,
  buildEmail02Body,
  ghlEmailLayout,
} from "./ghl-email-layout"

describe("ghl-email-layout", () => {
  it("wraps body in branded shell with hosted assets", () => {
    const html = ghlEmailLayout({
      title: "Test",
      preheader: "Preview text",
      body: buildEmail02Body(),
    })

    expect(html).toContain("https://levelplaydigital.com/images/logo.png")
    expect(html).toContain("https://levelplaydigital.com/images/email/gradient-accent-bar.png")
    expect(html).toContain("https://levelplaydigital.com/images/email/cta-unlock-97.png")
    expect(html).toContain(GHL_MERGE.firstName)
    expect(html).toContain("Hello, {{ contact.first_name }}")
    expect(html).toContain(GHL_MERGE.unsubscribe)
    expect(html).toContain("LevelStack")
    expect(html).toContain("#FF6633")
  })

  it("defines five nurture templates", () => {
    expect(GHL_EMAIL_TEMPLATES).toHaveLength(5)
    expect(GHL_EMAIL_TEMPLATES.map((t) => t.filename)).toEqual([
      "email-02-prospect.html",
      "email-03-competitor.html",
      "email-03-competitor-fallback.html",
      "email-04-finding.html",
      "email-05-sap-bridge.html",
    ])
  })
})
