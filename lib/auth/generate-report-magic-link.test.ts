import { describe, expect, it } from "vitest"

import {
  MAGIC_LINK_EXPIRY_LABEL,
  MAGIC_LINK_EXPIRY_SECONDS,
} from "@/lib/auth/generate-report-magic-link"
import { buildReportResendSignInUrl } from "@/lib/auth/magic-link-callback"

describe("magic link expiry constants", () => {
  it("uses 7 days for OTP TTL label and seconds", () => {
    expect(MAGIC_LINK_EXPIRY_SECONDS).toBe(604800)
    expect(MAGIC_LINK_EXPIRY_LABEL).toBe("7 days")
  })
})

describe("buildReportResendSignInUrl", () => {
  it("builds sign-in URL with report redirect", () => {
    const url = buildReportResendSignInUrl("report-abc")
    expect(url).toContain("/auth/sign-in?")
    expect(url).toContain("redirect=%2Freports%2Freport-abc")
  })
})
