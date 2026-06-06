import { after, NextResponse } from "next/server"

import { requireLevelStackIntakeAccess } from "@/lib/levelstack-intake-auth"
import { runReportPipeline } from "@/lib/pipeline/run-report-pipeline"
import { getReportForUser } from "@/lib/reports/get-report"
import { createAdminClient } from "@/lib/supabase/admin"

type RouteContext = { params: Promise<{ reportId: string }> }

/** Vercel Fluid Compute — report synthesis often runs 1–3 minutes */
export const maxDuration = 300

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireLevelStackIntakeAccess()
  if (!auth.ok) {
    return auth.response
  }

  const { reportId } = await context.params
  let report = await getReportForUser(reportId, auth.user.id)

  if (!report) {
    return NextResponse.json(
      { success: false, message: "Report not found." },
      { status: 404 },
    )
  }

  const regenerate =
    process.env.NODE_ENV === "development" &&
    new URL(request.url).searchParams.get("regenerate") === "1"

  if (
    regenerate &&
    report.job_id &&
    (report.status === "ready" || report.status === "failed")
  ) {
    const admin = createAdminClient()
    if (admin) {
      await admin
        .from("levelstack_reports")
        .update({ status: "pending", report_json: null, error_message: null })
        .eq("id", reportId)
      await admin
        .from("levelstack_research_jobs")
        .update({ status: "pending", error_message: null, metadata: {} })
        .eq("id", report.job_id)
      report = (await getReportForUser(reportId, auth.user.id))!
    }
  }

  if (report.status === "ready") {
    return NextResponse.json({
      success: true,
      message:
        process.env.NODE_ENV === "development"
          ? "Report is already ready. POST with ?regenerate=1 to rebuild (dev only)."
          : "Report is already ready.",
    })
  }

  if (!report.job_id) {
    return NextResponse.json(
      { success: false, message: "Report has no research job." },
      { status: 400 },
    )
  }

  const jobId = report.job_id
  const intakeId = report.intake_id

  after(() =>
    runReportPipeline({
      jobId,
      reportId: report.id,
      intakeId,
    }).catch((err) => console.error("[pipeline]", err)),
  )

  return NextResponse.json({
    success: true,
    started: true,
    message:
      "Report generation started. Watch the progress screen — typically 1–3 minutes.",
  })
}
