import { describe, expect, it } from "vitest"

import { buildPaymentReceivedBody } from "@/lib/email/upgrade-notify"

describe("buildPaymentReceivedBody", () => {
  it("uses tokenized sign-in URL in CTA and copy block when provided", () => {
    const magicUrl =
      "https://levelstack.levelplaydigital.com/auth/callback?token_hash=abc&next=%2Fintake%3Ffrom%3Dupgrade%26reportId%3Dreport-1"

    const html = buildPaymentReceivedBody({
      email: "user@example.com",
      businessName: "Acme Co",
      reportId: "report-1",
      planId: "levelstack-standard",
      signInUrl: magicUrl,
    })

    expect(html).toContain(magicUrl)
    expect(html).toContain("token_hash=abc")
    expect(html).toContain("request a new sign-in link")
    expect(html).toContain("from%3Dupgrade")
    expect(html).not.toContain("redirect=%2Freports%2F")
  })

  it("resend link targets upgrade intake sign-in, not report page", () => {
    const html = buildPaymentReceivedBody({
      email: "user@example.com",
      businessName: "Acme Co",
      reportId: "report-1",
      planId: "levelstack-standard",
    })

    expect(html).toContain("from%3Dupgrade")
    expect(html).toContain("reportId=report-1")
    expect(html).not.toContain("%2Freports%2Freport-1")
  })
})
