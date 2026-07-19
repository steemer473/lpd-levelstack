import type { SupabaseClient } from "@supabase/supabase-js"

export type IntakeLinkedReport = {
  id: string
  status: string
  report_tier?: string | null
  job_id?: string | null
}

const DEFAULT_COLUMNS = "id, status, job_id, report_tier"

const PAID_REPORT_TIERS = ["full_report", "strategy_call"] as const

/**
 * Returns the most recent report for an intake. Use instead of maybeSingle() on
 * intake_id — returning free snapshot users can have multiple report rows per intake.
 */
export async function getLatestReportForIntake(
  supabase: SupabaseClient,
  intakeId: string,
  columns: string = DEFAULT_COLUMNS,
): Promise<IntakeLinkedReport | null> {
  const { data, error } = await supabase
    .from("levelstack_reports")
    .select(columns)
    .eq("intake_id", intakeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[getLatestReportForIntake]", error.message)
    return null
  }

  return (data as IntakeLinkedReport | null) ?? null
}

/**
 * Newest ready paid Action Roadmap for an intake (ignores newer free snapshots).
 * Used so paid entitlement UX is not confused by a later free_snapshot row.
 */
export async function getLatestReadyPaidReportForIntake(
  supabase: SupabaseClient,
  intakeId: string,
  columns: string = DEFAULT_COLUMNS,
): Promise<IntakeLinkedReport | null> {
  const { data, error } = await supabase
    .from("levelstack_reports")
    .select(columns)
    .eq("intake_id", intakeId)
    .eq("status", "ready")
    .in("report_tier", [...PAID_REPORT_TIERS])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[getLatestReadyPaidReportForIntake]", error.message)
    return null
  }

  return (data as IntakeLinkedReport | null) ?? null
}

/**
 * Newest ready paid Action Roadmap for a user across intakes.
 * Fallback when intake-scoped lookup is unavailable (e.g. free-intake by email).
 */
export async function getLatestReadyPaidReportForUser(
  supabase: SupabaseClient,
  userId: string,
  columns: string = DEFAULT_COLUMNS,
): Promise<IntakeLinkedReport | null> {
  const { data, error } = await supabase
    .from("levelstack_reports")
    .select(columns)
    .eq("user_id", userId)
    .eq("status", "ready")
    .in("report_tier", [...PAID_REPORT_TIERS])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[getLatestReadyPaidReportForUser]", error.message)
    return null
  }

  return (data as IntakeLinkedReport | null) ?? null
}
