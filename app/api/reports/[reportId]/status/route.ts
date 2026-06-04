import { NextResponse } from "next/server"

import { getReportStatusPayload } from "@/lib/reports/get-report"
import { requireLevelStackIntakeAccess } from "@/lib/levelstack-intake-auth"

type RouteContext = { params: Promise<{ reportId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireLevelStackIntakeAccess()
  if (!auth.ok) {
    return auth.response
  }

  const { reportId } = await context.params
  const payload = await getReportStatusPayload(reportId, auth.user.id)

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Report not found." },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, ...payload })
}
