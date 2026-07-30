import { cookies } from "next/headers"

import { reportAccessCookieName } from "@/lib/auth/report-access-token"

/** Read the emailed magic-link access cookie for a report (works with or without a session). */
export async function readReportAccessTokenCookie(
  reportId: string,
): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(reportAccessCookieName(reportId))?.value ?? null
}
