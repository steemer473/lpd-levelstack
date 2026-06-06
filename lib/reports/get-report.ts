import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type LevelstackReportRow = {
  id: string
  status: string
  report_json: unknown
  plan_id: string | null
  error_message: string | null
  job_id: string | null
  intake_id: string
}

export async function getReportForUser(
  reportId: string,
  userId: string,
): Promise<LevelstackReportRow | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data } = await supabase
    .from("levelstack_reports")
    .select("id, status, report_json, plan_id, error_message, job_id, intake_id")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle()

  return data
}

/** Dev preview — load any report by id (service role). */
export async function getReportById(
  reportId: string,
): Promise<LevelstackReportRow | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const { data } = await supabase
    .from("levelstack_reports")
    .select("id, status, report_json, plan_id, error_message, job_id, intake_id")
    .eq("id", reportId)
    .maybeSingle()

  return data
}

export async function getReportStatusPayload(
  reportId: string,
  userId: string,
): Promise<{
  reportId: string
  reportStatus: string
  jobStatus: string | null
  currentStep: string | null
  completedSteps: string[]
  progress: number
  error: string | null
  businessName: string | null
} | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data: report } = await supabase
    .from("levelstack_reports")
    .select("id, status, error_message, job_id, report_json")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle()

  if (!report) return null

  let jobStatus: string | null = null
  let currentStep: string | null = null
  let completedSteps: string[] = []
  let progress = report.status === "ready" ? 100 : 0
  let businessName: string | null = null

  if (report.report_json && typeof report.report_json === "object") {
    const meta = (report.report_json as { meta?: { businessName?: string } }).meta
    businessName = meta?.businessName ?? null
  }

  if (report.job_id) {
    const { data: job } = await supabase
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
      } | null
      currentStep = meta?.current_step ?? null
      completedSteps = meta?.completed_steps ?? []
      if (typeof meta?.progress === "number") {
        progress = meta.progress
      }
      if (report.status === "failed" && job.error_message) {
        return {
          reportId: report.id,
          reportStatus: report.status,
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
    jobStatus,
    currentStep,
    completedSteps,
    progress,
    error: report.error_message,
    businessName,
  }
}
