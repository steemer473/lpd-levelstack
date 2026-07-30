#!/usr/bin/env node
/**
 * Dev-only: set businessVertical on an intake linked to a report.
 * Usage: node --env-file=.env.local scripts/patch-intake-vertical.mjs <reportId> <verticalId>
 */
import { pathToFileURL } from "node:url"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const reportId = process.argv[2]
const verticalId = process.argv[3] ?? "consulting_b2b"

if (!reportId) {
  console.error(
    "Usage: node --env-file=.env.local scripts/patch-intake-vertical.mjs <reportId> [verticalId]",
  )
  process.exit(1)
}

const { createAdminClient } = await import(
  pathToFileURL(join(root, "lib/supabase/admin.ts")).href
)

const admin = createAdminClient()
if (!admin) {
  console.error("Admin client not configured (check SUPABASE_SERVICE_ROLE_KEY)")
  process.exit(1)
}

const { data: report, error: reportErr } = await admin
  .from("levelstack_reports")
  .select("id, intake_id")
  .eq("id", reportId)
  .maybeSingle()

if (reportErr || !report?.intake_id) {
  console.error("Report not found:", reportErr?.message ?? report)
  process.exit(1)
}

const { data: intake, error: intakeErr } = await admin
  .from("levelstack_intakes")
  .select("id, form_data")
  .eq("id", report.intake_id)
  .maybeSingle()

if (intakeErr || !intake) {
  console.error("Intake not found:", intakeErr?.message ?? intake)
  process.exit(1)
}

const formData = { ...(intake.form_data ?? {}), businessVertical: verticalId }

const { error: updateErr } = await admin
  .from("levelstack_intakes")
  .update({ form_data: formData })
  .eq("id", intake.id)

if (updateErr) {
  console.error("Intake update failed:", updateErr.message)
  process.exit(1)
}

console.log("Patched intake:", {
  reportId,
  intakeId: intake.id,
  businessVertical: verticalId,
  primaryBusinessName: formData.primaryBusinessName,
  primaryService: formData.primaryService,
})
