import type { User } from "@supabase/supabase-js"

import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { syncPaidIntakeLead } from "@/lib/ghl/sync-levelstack-lead"
import { getLevelStackPlanId } from "@/lib/levelstack-access"
import { planIdToReportTier } from "@/lib/levelstack-plans"
import { runReportPipeline } from "@/lib/pipeline/run-report-pipeline"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"

export type UpgradeFreeSnapshotResult =
  | { ok: true; intakeId: string; jobId: string; reportId: string }
  | { ok: false; message: string }

/**
 * Reuses the free-snapshot intake row and report row when a buyer upgrades to a paid tier.
 */
export async function upgradeFreeSnapshotToPaidIntake(params: {
  supabase: SupabaseClient
  user: User
  intakeId: string
  reportId: string
  formData: LevelstackIntakeFormValues
  onPipelineStart: (job: { jobId: string; reportId: string; intakeId: string }) => void
  onGhlSync?: (payload: {
    email: string
    ownerName: string
    formData: LevelstackIntakeFormValues
    planId: string
    reportId: string
  }) => void
}): Promise<UpgradeFreeSnapshotResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, message: "Server database client is not configured." }
  }

  const planId = await getLevelStackPlanId(params.supabase, params.user.id)
  const reportTier = planIdToReportTier(planId)

  const { error: intakeError } = await admin
    .from("levelstack_intakes")
    .update({
      form_data: params.formData,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", params.intakeId)
    .eq("user_id", params.user.id)

  if (intakeError) {
    return { ok: false, message: intakeError.message }
  }

  const { data: job, error: jobError } = await admin
    .from("levelstack_research_jobs")
    .insert({
      intake_id: params.intakeId,
      user_id: params.user.id,
      status: "pending",
      metadata: { plan_id: planId, report_tier: reportTier, upgraded_from: "free_snapshot" },
    })
    .select("id")
    .single()

  if (jobError || !job) {
    return { ok: false, message: jobError?.message ?? "Failed to queue research job." }
  }

  const { error: reportError } = await admin
    .from("levelstack_reports")
    .update({
      job_id: job.id,
      status: "pending",
      plan_id: planId,
      report_tier: reportTier,
      report_json: null,
      error_message: null,
    })
    .eq("id", params.reportId)
    .eq("user_id", params.user.id)

  if (reportError) {
    return { ok: false, message: reportError.message }
  }

  params.onPipelineStart({
    jobId: job.id,
    reportId: params.reportId,
    intakeId: params.intakeId,
  })

  const userEmail = params.user.email
  if (userEmail && params.onGhlSync) {
    params.onGhlSync({
      email: userEmail,
      ownerName: params.formData.ownerName,
      formData: params.formData,
      planId: planId ?? "levelstack-paid",
      reportId: params.reportId,
    })
  }

  return {
    ok: true,
    intakeId: params.intakeId,
    jobId: job.id,
    reportId: params.reportId,
  }
}
