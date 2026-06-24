import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isDevReportPreviewEnabled } from "@/lib/dev-report-preview"
import { planIdToReportTier, type ReportTier } from "@/lib/levelstack-plans"

export type LevelstackReportRow = {
  id: string
  status: string
  report_json: unknown
  free_snapshot_json?: unknown
  plan_id: string | null
  report_tier?: string | null
  error_message: string | null
  job_id: string | null
  intake_id: string
  user_id?: string
  upgrade_notify_sent_at?: string | null
}

const REPORT_COLUMNS =
  "id, status, report_json, free_snapshot_json, plan_id, report_tier, error_message, job_id, intake_id, user_id, upgrade_notify_sent_at"
const REPORT_COLUMNS_LEGACY =
  "id, status, report_json, plan_id, error_message, job_id, intake_id, user_id"

async function queryReportById(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  reportId: string,
): Promise<LevelstackReportRow | null> {
  const { data, error } = await supabase
    .from("levelstack_reports")
    .select(REPORT_COLUMNS)
    .eq("id", reportId)
    .maybeSingle()

  if (!error) return data

  if (error.code === "42703" || error.message.includes("report_tier") || error.message.includes("free_snapshot_json")) {
    const { data: legacy } = await supabase
      .from("levelstack_reports")
      .select(REPORT_COLUMNS_LEGACY)
      .eq("id", reportId)
      .maybeSingle()
    return legacy
  }

  return null
}

export async function getReportForUser(
  reportId: string,
  userId: string,
): Promise<LevelstackReportRow | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("levelstack_reports")
    .select(REPORT_COLUMNS)
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle()

  if (!error) return data

  if (error.code === "42703" || error.message.includes("report_tier") || error.message.includes("free_snapshot_json")) {
    const { data: legacy } = await supabase
      .from("levelstack_reports")
      .select(REPORT_COLUMNS_LEGACY)
      .eq("id", reportId)
      .eq("user_id", userId)
      .maybeSingle()
    return legacy
  }

  return null
}

/** Dev preview — load any report by id (service role). */
export async function getReportById(
  reportId: string,
): Promise<LevelstackReportRow | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  return queryReportById(supabase, reportId)
}

/**
 * Resolve a report for the current viewer.
 * Owners always use RLS. In local dev preview, falls back to service-role lookup
 * so rebuild/status APIs work when the signed-in hub account ≠ report owner.
 */
export async function resolveReportAccess(
  reportId: string,
  userId: string | null,
): Promise<LevelstackReportRow | null> {
  if (userId) {
    const owned = await getReportForUser(reportId, userId)
    if (owned) return owned
  }

  if (isDevReportPreviewEnabled()) {
    return getReportById(reportId)
  }

  return null
}

export async function getReportStatusPayload(
  reportId: string,
  userId: string | null,
): Promise<{
  reportId: string
  reportStatus: string
  reportTier: ReportTier
  jobStatus: string | null
  currentStep: string | null
  completedSteps: string[]
  progress: number
  error: string | null
  businessName: string | null
} | null> {
  const report = await resolveReportAccess(reportId, userId)

  if (!report) return null

  const supabase = await createClient()
  const admin = createAdminClient()
  const jobClient =
    isDevReportPreviewEnabled() && admin ? admin : supabase

  if (!jobClient) return null

  let jobStatus: string | null = null
  let currentStep: string | null = null
  let completedSteps: string[] = []
  let progress = report.status === "ready" ? 100 : 0
  let businessName: string | null = null
  let reportTier: ReportTier = planIdToReportTier(report.plan_id)

  if (report.report_tier === "free_snapshot" || report.report_tier === "full_report" || report.report_tier === "strategy_call") {
    reportTier = report.report_tier
  }

  if (report.report_json && typeof report.report_json === "object") {
    const meta = (report.report_json as { meta?: { businessName?: string } }).meta
    businessName = meta?.businessName ?? null
  }

  if (report.job_id) {
    const { data: job } = await jobClient
      .from("levelstack_research_jobs")
      .select("status, metadata, error_message")
      .eq("id", report.job_id)
      .maybeSingle()

    if (job) {
      jobStatus = job.status
      const meta = job.metadata as {
        current_step?: string | null
        completed_steps?: string[]
        progress?: number
        report_tier?: ReportTier
      } | null
      currentStep = meta?.current_step ?? null
      completedSteps = meta?.completed_steps ?? []
      if (meta?.report_tier) {
        reportTier = meta.report_tier
      }
      if (typeof meta?.progress === "number") {
        progress = meta.progress
      }
      if (report.status === "failed" && job.error_message) {
        return {
          reportId: report.id,
          reportStatus: report.status,
          reportTier,
          jobStatus,
          currentStep,
          completedSteps,
          progress,
          error: job.error_message ?? report.error_message,
          businessName,
        }
      }
    }
  }

  return {
    reportId: report.id,
    reportStatus: report.status,
    reportTier,
    jobStatus,
    currentStep,
    completedSteps,
    progress,
    error: report.error_message,
    businessName,
  }
}
