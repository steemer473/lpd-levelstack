import {
  buildMagicLinkCallbackUrl,
  MAGIC_LINK_EXPIRY_LABEL,
  MAGIC_LINK_EXPIRY_SECONDS,
} from "@/lib/auth/magic-link-callback"
import type { createAdminClient } from "@/lib/supabase/admin"
import { getAppUrl } from "@/lib/urls"

export { MAGIC_LINK_EXPIRY_LABEL, MAGIC_LINK_EXPIRY_SECONDS }
export { buildReportResendSignInUrl } from "@/lib/auth/magic-link-callback"

export async function generateReportMagicLink(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
  reportId: string,
): Promise<string | null> {
  const reportPath = `/reports/${reportId}`
  const callbackUrl = getAppUrl(
    `/auth/callback?next=${encodeURIComponent(reportPath)}`,
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
    return buildMagicLinkCallbackUrl(hashedToken, reportPath)
  }

  return link?.properties?.action_link ?? null
}
