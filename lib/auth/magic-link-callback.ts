import { getAppUrl } from "@/lib/urls"

/** Must match Supabase Auth email OTP expiry (hosted max: 86400 = 24 hours). */
export const MAGIC_LINK_EXPIRY_SECONDS = 86400

export const MAGIC_LINK_EXPIRY_LABEL = "24 hours"

/** Sign-in page for requesting a fresh magic link to a report. */
export function buildReportResendSignInUrl(reportId: string): string {
  const reportPath = `/reports/${reportId}`
  return getAppUrl(`/auth/sign-in?redirect=${encodeURIComponent(reportPath)}`)
}

/** Intake upgrade path after paid checkout (free snapshot → full report). */
export function buildUpgradeIntakePath(reportId: string): string {
  return `/intake?from=upgrade&reportId=${reportId}`
}

/** Sign-in page for requesting a fresh magic link to the upgrade intake flow. */
export function buildUpgradeIntakeResendSignInUrl(reportId: string): string {
  const intakePath = buildUpgradeIntakePath(reportId)
  return getAppUrl(`/auth/sign-in?redirect=${encodeURIComponent(intakePath)}`)
}

/** Server-verifiable magic link — uses hashed_token, not Supabase action_link (hash fragments). */
export function buildMagicLinkCallbackUrl(
  hashedToken: string,
  nextPath: string,
): string {
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "magiclink",
    next: nextPath,
  })
  return getAppUrl(`/auth/callback?${params.toString()}`)
}
