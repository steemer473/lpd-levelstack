import type { SupabaseClient } from "@supabase/supabase-js"

export type IntakeLinkedReport = {
  id: string
  status: string
  report_tier?: string | null
  job_id?: string | null
}

const DEFAULT_COLUMNS = "id, status, job_id, report_tier"

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
