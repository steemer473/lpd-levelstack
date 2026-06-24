import { describe, expect, it } from "vitest"

import { buildMagicLinkCallbackUrl, buildUpgradeIntakeResendSignInUrl } from "@/lib/auth/magic-link-callback"

describe("buildMagicLinkCallbackUrl", () => {
  it("builds a server-verifiable callback URL with token_hash", () => {
    const url = buildMagicLinkCallbackUrl("abc123", "/reports/report-id")
    expect(url).toContain("/auth/callback?")
    expect(url).toContain("token_hash=abc123")
    expect(url).toContain("type=magiclink")
    expect(url).toContain("next=%2Freports%2Freport-id")
  })
})

describe("buildUpgradeIntakeResendSignInUrl", () => {
  it("encodes upgrade intake path in redirect param", () => {
    const url = buildUpgradeIntakeResendSignInUrl("uuid-report")
    expect(url).toContain("/auth/sign-in?")
    expect(url).toContain("redirect=%2Fintake%3Ffrom%3Dupgrade%26reportId%3Duuid-report")
  })
})
