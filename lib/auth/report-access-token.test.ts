import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/env.mjs", () => ({
  env: {
    LEVELSTACK_REPORT_TOKEN_SECRET:
      "test-report-token-secret-test-report-token-secret",
  },
}))

import {
  REPORT_ACCESS_TOKEN_TTL_SECONDS,
  reportAccessCookieName,
  signReportAccessToken,
  verifyReportAccessToken,
} from "@/lib/auth/report-access-token"

const REPORT_ID = "031e84ed-ae67-437d-8131-774e45655d27"

describe("signReportAccessToken / verifyReportAccessToken", () => {
  it("round-trips a valid token and returns the bound tier", () => {
    const token = signReportAccessToken(REPORT_ID, "full_report")
    expect(token).toBeTruthy()

    const claims = verifyReportAccessToken(token, REPORT_ID)
    expect(claims).not.toBeNull()
    expect(claims?.reportId).toBe(REPORT_ID)
    expect(claims?.tier).toBe("full_report")
    expect(claims?.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it("rejects a token verified against a different reportId", () => {
    const token = signReportAccessToken(REPORT_ID, "full_report")
    expect(verifyReportAccessToken(token, "some-other-report-id")).toBeNull()
  })

  it("rejects a tampered tier (signature no longer matches)", () => {
    const token = signReportAccessToken(REPORT_ID, "free_snapshot")
    const [reportId, , expiry, sig] = (token as string).split(".")
    const forged = `${reportId}.full_report.${expiry}.${sig}`
    expect(verifyReportAccessToken(forged, REPORT_ID)).toBeNull()
  })

  it("rejects a tampered signature", () => {
    const token = signReportAccessToken(REPORT_ID, "full_report") as string
    const forged = `${token.slice(0, -2)}xy`
    expect(verifyReportAccessToken(forged, REPORT_ID)).toBeNull()
  })

  it("rejects an expired token", () => {
    const token = signReportAccessToken(REPORT_ID, "full_report", -10)
    expect(token).toBeTruthy()
    expect(verifyReportAccessToken(token, REPORT_ID)).toBeNull()
  })

  it("rejects malformed tokens", () => {
    expect(verifyReportAccessToken("", REPORT_ID)).toBeNull()
    expect(verifyReportAccessToken(null, REPORT_ID)).toBeNull()
    expect(verifyReportAccessToken(undefined, REPORT_ID)).toBeNull()
    expect(verifyReportAccessToken("a.b.c", REPORT_ID)).toBeNull()
    expect(verifyReportAccessToken(`${REPORT_ID}.full_report.notanumber.sig`, REPORT_ID)).toBeNull()
  })

  it("rejects an unknown tier value", () => {
    const token = signReportAccessToken(REPORT_ID, "full_report") as string
    const [reportId, , expiry] = token.split(".")
    // A made-up tier won't have a valid signature, and is also not an allowed tier.
    const forged = `${reportId}.enterprise.${expiry}.someSignature`
    expect(verifyReportAccessToken(forged, REPORT_ID)).toBeNull()
  })

  it("uses a 30-day default TTL", () => {
    expect(REPORT_ACCESS_TOKEN_TTL_SECONDS).toBe(60 * 60 * 24 * 30)
  })
})

describe("reportAccessCookieName", () => {
  it("namespaces the cookie per report", () => {
    expect(reportAccessCookieName(REPORT_ID)).toBe(`lvlstk_ra_${REPORT_ID}`)
  })
})

describe("when the signing secret is unset", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock("@/env.mjs", () => ({ env: { LEVELSTACK_REPORT_TOKEN_SECRET: undefined } }))
  })

  afterEach(() => {
    vi.resetModules()
    vi.doUnmock("@/env.mjs")
  })

  it("fails closed: sign returns null and verify returns null", async () => {
    const mod = await import("@/lib/auth/report-access-token")
    expect(mod.signReportAccessToken(REPORT_ID, "full_report")).toBeNull()
    // Even a structurally plausible token can't verify without a secret.
    expect(mod.verifyReportAccessToken(`${REPORT_ID}.full_report.9999999999.sig`, REPORT_ID)).toBeNull()
  })
})
