import {
  buildMagicLinkCallbackUrl,
  buildReportAccessPath,
  MAGIC_LINK_EXPIRY_LABEL,
  MAGIC_LINK_EXPIRY_SECONDS,
} from "@/lib/auth/magic-link-callback"
import { signReportAccessToken } from "@/lib/auth/report-access-token"
import type { ReportTier } from "@/lib/levelstack-plans"
import type { createAdminClient } from "@/lib/supabase/admin"
import { getAppUrl } from "@/lib/urls"

export { MAGIC_LINK_EXPIRY_LABEL, MAGIC_LINK_EXPIRY_SECONDS }
export { buildReportResendSignInUrl } from "@/lib/auth/magic-link-callback"

export async function generateAuthMagicLink(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
  nextPath: string,
): Promise<string | null> {
  const callbackUrl = getAppUrl(
    `/auth/callback?next=${encodeURIComponent(nextPath)}`,
  )

  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: callbackUrl },
  })

  if (error) {
    console.error("[magic-link] generateLink failed:", error.message)
    return null
  }

  const hashedToken = link?.properties?.hashed_token ?? null
  if (hashedToken) {
    return buildMagicLinkCallbackUrl(hashedToken, nextPath)
  }

  console.error(
    "[magic-link] generateLink returned no hashed_token — refusing action_link fallback",
    { email, nextPath },
  )
  return null
}

export async function generateReportMagicLink(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
  reportId: string,
): Promise<string | null> {
  return generateAuthMagicLink(admin, email, `/reports/${reportId}`)
}

/**
 * Absolute URL that opens a report from an email with zero friction: the
 * access route verifies the signed token, sets an HttpOnly cookie, and
 * redirects to the clean report URL. Works on any device for the token's
 * lifetime, independent of Supabase OTP state. Returns null if the signing
 * secret is unset.
 */
export function generateReportAccessUrl(
  reportId: string,
  tier: ReportTier,
): string | null {
  const token = signReportAccessToken(reportId, tier)
  if (!token) return null
  return getAppUrl(buildReportAccessPath(reportId, token))
}

/** Same as {@link generateReportAccessUrl} but lands on the print/PDF view. */
export function generateReportAccessPrintUrl(
  reportId: string,
  tier: ReportTier,
): string | null {
  const token = signReportAccessToken(reportId, tier)
  if (!token) return null
  return getAppUrl(buildReportAccessPath(reportId, token, { to: "print" }))
}
