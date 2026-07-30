#!/usr/bin/env node
/**
 * Dev-only: reset and rerun runReportPipeline for a report (preserves plan_id).
 * Usage: node --env-file=.env.local scripts/regen-report-dev.mjs <reportId>
 */
import { pathToFileURL } from "node:url"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const reportId = process.argv[2]

if (!reportId) {
  console.error("Usage: node --env-file=.env.local scripts/regen-report-dev.mjs <reportId>")
  process.exit(1)
}

const { createAdminClient } = await import(
  pathToFileURL(join(root, "lib/supabase/admin.ts")).href
)
const { runReportPipeline } = await import(
  pathToFileURL(join(root, "lib/pipeline/run-report-pipeline.ts")).href
)

const admin = createAdminClient()
if (!admin) {
  console.error("Admin client not configured (check SUPABASE_SERVICE_ROLE_KEY)")
  process.exit(1)
}

const { data: report, error } = await admin
  .from("levelstack_reports")
  .select("id, job_id, intake_id, plan_id, status")
  .eq("id", reportId)
  .maybeSingle()

if (error || !report?.job_id || !report.intake_id) {
  console.error("Report not found or missing job/intake:", error?.message ?? report)
  process.exit(1)
}

console.log("Regenerating report:", {
  id: report.id,
  plan_id: report.plan_id,
  status: report.status,
  job_id: report.job_id,
})

await admin
  .from("levelstack_reports")
  .update({
    status: "pending",
    report_json: null,
    error_message: null,
  })
  .eq("id", reportId)

await admin
  .from("levelstack_research_jobs")
  .update({ status: "pending", error_message: null, metadata: {} })
  .eq("id", report.job_id)

console.log("Pipeline starting (typically 1–3 min)...")
await runReportPipeline({
  jobId: report.job_id,
  reportId: report.id,
  intakeId: report.intake_id,
})

const { data: after } = await admin
  .from("levelstack_reports")
  .select("status, plan_id, report_json, error_message")
  .eq("id", reportId)
  .maybeSingle()

const json = after?.report_json
const meta = json && typeof json === "object" && "meta" in json ? json.meta : null

console.log("\nDone:", {
  status: after?.status,
  plan_id: after?.plan_id,
  error: after?.error_message,
  overallScore: meta?.overallScore,
  letterGrade: meta?.letterGrade,
  reportTier: meta?.reportTier,
  businessCategory: meta?.businessCategory,
  scoreBasisSectionIds: meta?.scoreBasisSectionIds,
})

if (after?.status !== "ready") {
  process.exit(1)
}
