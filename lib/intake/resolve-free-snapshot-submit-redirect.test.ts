import { describe, expect, it } from "vitest"

import { resolveFreeSnapshotSubmitRedirect } from "@/lib/intake/resolve-free-snapshot-submit-redirect"

describe("resolveFreeSnapshotSubmitRedirect", () => {
  it("redirects immediately when session matches returning user", () => {
    expect(
      resolveFreeSnapshotSubmitRedirect({
        existingUser: true,
        redirectImmediately: true,
        reportId: "r-1",
        signInUrl: "https://example.com/magic",
      }),
    ).toEqual({ type: "redirect_report", reportId: "r-1" })
  })

  it("sends new users through magic link when available", () => {
    expect(
      resolveFreeSnapshotSubmitRedirect({
        existingUser: false,
        reportId: "r-1",
        signInUrl: "https://example.com/magic",
      }),
    ).toEqual({ type: "redirect_magic_link", signInUrl: "https://example.com/magic" })
  })

  it("falls back to report route for new users without magic link", () => {
    expect(
      resolveFreeSnapshotSubmitRedirect({
        existingUser: false,
        reportId: "r-1",
      }),
    ).toEqual({ type: "redirect_report_fallback", reportId: "r-1" })
  })

  it("shows welcome back for signed-out returning users", () => {
    expect(
      resolveFreeSnapshotSubmitRedirect({
        existingUser: true,
        reportId: "r-1",
        signInUrl: "https://example.com/magic",
      }),
    ).toEqual({ type: "welcome_back", signInUrl: "https://example.com/magic" })
  })
})
