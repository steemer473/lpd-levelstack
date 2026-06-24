import { describe, expect, it, vi } from "vitest"

import { generateAuthMagicLink } from "@/lib/auth/generate-report-magic-link"
import {
  MAGIC_LINK_EXPIRY_LABEL,
  MAGIC_LINK_EXPIRY_SECONDS,
} from "@/lib/auth/generate-report-magic-link"
import {
  buildReportResendSignInUrl,
  buildUpgradeIntakeResendSignInUrl,
} from "@/lib/auth/magic-link-callback"

describe("magic link expiry constants", () => {
  it("uses 24 hours for OTP TTL label and seconds", () => {
    expect(MAGIC_LINK_EXPIRY_SECONDS).toBe(86400)
    expect(MAGIC_LINK_EXPIRY_LABEL).toBe("24 hours")
  })
})

describe("buildReportResendSignInUrl", () => {
  it("builds sign-in URL with report redirect", () => {
    const url = buildReportResendSignInUrl("report-abc")
    expect(url).toContain("/auth/sign-in?")
    expect(url).toContain("redirect=%2Freports%2Freport-abc")
  })
})

describe("buildUpgradeIntakeResendSignInUrl", () => {
  it("builds sign-in URL with upgrade intake redirect", () => {
    const url = buildUpgradeIntakeResendSignInUrl("report-abc")
    expect(url).toContain("/auth/sign-in?")
    expect(url).toContain("redirect=%2Fintake%3Ffrom%3Dupgrade%26reportId%3Dreport-abc")
    expect(url).not.toContain("%2Freports%2F")
  })
})

describe("generateAuthMagicLink", () => {
  it("returns server-verifiable callback URL for custom next path", async () => {
    const generateLink = vi.fn().mockResolvedValue({
      data: {
        properties: {
          hashed_token: "hash-123",
        },
      },
      error: null,
    })

    const admin = {
      auth: {
        admin: {
          generateLink,
        },
      },
    } as unknown as Parameters<typeof generateAuthMagicLink>[0]

    const url = await generateAuthMagicLink(
      admin,
      "user@example.com",
      "/intake?from=upgrade&reportId=abc",
    )

    expect(generateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "magiclink",
        email: "user@example.com",
      }),
    )
    expect(url).toContain("token_hash=hash-123")
    expect(url).toContain("next=%2Fintake%3Ffrom%3Dupgrade%26reportId%3Dabc")
  })

  it("returns null when hashed_token is missing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const generateLink = vi.fn().mockResolvedValue({
      data: {
        properties: {
          action_link: "https://example.supabase.co/auth/v1/verify#access_token=abc",
        },
      },
      error: null,
    })

    const admin = {
      auth: {
        admin: {
          generateLink,
        },
      },
    } as unknown as Parameters<typeof generateAuthMagicLink>[0]

    const url = await generateAuthMagicLink(admin, "user@example.com", "/intake")
    expect(url).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
