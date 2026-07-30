import { NextResponse } from "next/server"

import { readReportAccessTokenCookie } from "@/lib/auth/report-access-cookie"
import { isDevReportPreviewEnabled } from "@/lib/dev-report-preview"
import { getReportStatusPayload } from "@/lib/reports/get-report"
import { requireLevelStackIntakeAccess } from "@/lib/levelstack-intake-auth"

type RouteContext = { params: Promise<{ reportId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const devPreview = isDevReportPreviewEnabled()
  const { reportId } = await context.params

  let userId: string | null = null
  if (!devPreview) {
    const auth = await requireLevelStackIntakeAccess()
    if (!auth.ok) {
      return auth.response
    }
    userId = auth.user.id
  } else {
    const auth = await requireLevelStackIntakeAccess()
    userId = auth.ok ? auth.user.id : null
  }

  const accessToken = await readReportAccessTokenCookie(reportId)
  const payload = await getReportStatusPayload(reportId, userId, accessToken)

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Report not found." },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, ...payload })
}
