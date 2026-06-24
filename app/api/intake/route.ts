import { after, NextResponse } from "next/server"

import { env } from "@/env.mjs"
import { syncPaidIntakeLead } from "@/lib/ghl/sync-levelstack-lead"
import { runReportPipeline } from "@/lib/pipeline/run-report-pipeline"
import { getLevelStackPlanId } from "@/lib/levelstack-access"
import { requirePaidLevelStackIntakeAccess } from "@/lib/levelstack-intake-auth"
import { planIdToReportTier } from "@/lib/levelstack-plans"
import { isWebsiteReachable } from "@/lib/intake/validate-website"
import { levelstackIntakeSchema } from "@/lib/intake/schema"
import { upgradeFreeSnapshotToPaidIntake } from "@/lib/intake/upgrade-free-snapshot"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/** Vercel Fluid Compute — report synthesis often runs 1–3 minutes */
export const maxDuration = 300

export async function POST(request: Request) {
  const auth = await requirePaidLevelStackIntakeAccess()
  if (!auth.ok) {
    return auth.response
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = levelstackIntakeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data

  if (data.hasActiveAdSpend === "yes") {
    if (!data.adPlatforms?.trim() || !data.adBudget?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Ad platform and approximate budget are required when ad spend is active.",
        },
        { status: 400 },
      )
    }
  }

  const skipWebsiteCheck =
    process.env.NODE_ENV === "development" && env.LEVELSTACK_DEV_SKIP_WEBSITE_CHECK

  if (!skipWebsiteCheck) {
    const websiteCheck = await isWebsiteReachable(data.websiteUrl)
    if (!websiteCheck.ok) {
      return NextResponse.json(
        { success: false, message: websiteCheck.message },
        { status: 400 },
      )
    }
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Database is not configured." },
      { status: 500 },
    )
  }

  const { data: existing } = await supabase
    .from("levelstack_intakes")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("status", "submitted")
    .limit(1)
    .maybeSingle()

  const formData = {
    ...data,
    priorBusinessNames: data.priorBusinessNames.map((n) => n.trim()).filter(Boolean),
  }

  if (existing) {
    const { data: existingReport } = await supabase
      .from("levelstack_reports")
      .select("id, status, job_id, report_tier")
      .eq("intake_id", existing.id)
      .maybeSingle()

    if (existingReport?.report_tier === "free_snapshot") {
      const upgraded = await upgradeFreeSnapshotToPaidIntake({
        supabase,
        user: auth.user,
        intakeId: existing.id,
        reportId: existingReport.id,
        formData,
        onPipelineStart: ({ jobId, reportId, intakeId }) => {
          after(() =>
            runReportPipeline({ jobId, reportId, intakeId }).catch((err) =>
              console.error("[pipeline]", err),
            ),
          )
        },
        onGhlSync: (payload) => {
          after(() =>
            syncPaidIntakeLead(payload).catch((err) => console.error("[ghl]", err)),
          )
        },
      })

      if (!upgraded.ok) {
        return NextResponse.json(
          { success: false, message: upgraded.message },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        upgraded: true,
        intakeId: upgraded.intakeId,
        jobId: upgraded.jobId,
        reportId: upgraded.reportId,
      })
    }

    if (
      existingReport?.job_id &&
      (existingReport.status === "pending" || existingReport.status === "generating")
    ) {
      after(() =>
        runReportPipeline({
          jobId: existingReport.job_id!,
          reportId: existingReport.id,
          intakeId: existing.id,
        }).catch((err) => console.error("[pipeline]", err)),
      )
    }

    if (
      existingReport?.report_tier !== "free_snapshot" &&
      existingReport?.status === "failed" &&
      existingReport.job_id
    ) {
      after(() =>
        runReportPipeline({
          jobId: existingReport.job_id,
          reportId: existingReport.id,
          intakeId: existing.id,
        }).catch((err) => console.error("[pipeline]", err)),
      )
      return NextResponse.json({
        success: true,
        message: "Report generation restarted.",
        intakeId: existing.id,
        reportId: existingReport.id,
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: "You have already submitted your LevelStack intake.",
        intakeId: existing.id,
        reportId: existingReport?.id ?? null,
      },
      { status: 409 },
    )
  }

  const planId = await getLevelStackPlanId(supabase, auth.user.id)
  const reportTier = planIdToReportTier(planId)

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Server database client is not configured." },
      { status: 500 },
    )
  }

  const { data: intake, error: intakeError } = await admin
    .from("levelstack_intakes")
    .insert({
      user_id: auth.user.id,
      status: "submitted",
      form_data: formData,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (intakeError || !intake) {
    return NextResponse.json(
      { success: false, message: intakeError?.message ?? "Failed to save intake." },
      { status: 500 },
    )
  }

  const { data: job, error: jobError } = await admin
    .from("levelstack_research_jobs")
    .insert({
      intake_id: intake.id,
      user_id: auth.user.id,
      status: "pending",
      metadata: { plan_id: planId, report_tier: reportTier },
    })
    .select("id")
    .single()

  if (jobError || !job) {
    return NextResponse.json(
      { success: false, message: jobError?.message ?? "Failed to queue research job." },
      { status: 500 },
    )
  }

  const { data: report, error: reportError } = await admin
    .from("levelstack_reports")
    .insert({
      intake_id: intake.id,
      user_id: auth.user.id,
      job_id: job.id,
      status: "pending",
      plan_id: planId,
      report_tier: reportTier,
    })
    .select("id")
    .single()

  if (reportError || !report) {
    return NextResponse.json(
      { success: false, message: reportError?.message ?? "Failed to create report." },
      { status: 500 },
    )
  }

  after(() =>
    runReportPipeline({
      jobId: job.id,
      reportId: report.id,
      intakeId: intake.id,
    }).catch((err) => console.error("[pipeline]", err)),
  )

  const userEmail = auth.user.email
  if (userEmail) {
    after(() =>
      syncPaidIntakeLead({
        email: userEmail,
        ownerName: formData.ownerName,
        formData,
        planId: planId ?? "levelstack-paid",
        reportId: report.id,
      }).catch((err) => console.error("[ghl]", err)),
    )
  }

  return NextResponse.json({
    success: true,
    intakeId: intake.id,
    jobId: job.id,
    reportId: report.id,
  })
}
