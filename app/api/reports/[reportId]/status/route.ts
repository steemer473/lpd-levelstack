import { NextResponse } from "next/server"

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

  const payload = await getReportStatusPayload(reportId, userId)

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Report not found." },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, ...payload })
}
