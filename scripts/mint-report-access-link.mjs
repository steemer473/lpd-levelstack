#!/usr/bin/env node
/**
 * Dev-only: mint a report access link for QA when signed-in user ≠ report owner.
 * Usage: npx tsx --env-file=.env.local scripts/mint-report-access-link.mjs <reportId>
 */
import { pathToFileURL } from "node:url"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const reportId = process.argv[2]

if (!reportId) {
  console.error(
    "Usage: npx tsx --env-file=.env.local scripts/mint-report-access-link.mjs <reportId>",
  )
  process.exit(1)
}

const { createAdminClient } = await import(
  pathToFileURL(join(root, "lib/supabase/admin.ts")).href
)
const { signReportAccessToken } = await import(
  pathToFileURL(join(root, "lib/auth/report-access-token.ts")).href
)
const { planIdToReportTier } = await import(
  pathToFileURL(join(root, "lib/levelstack-plans.ts")).href
)
const { env } = await import(pathToFileURL(join(root, "env.mjs")).href)

const admin = createAdminClient()
if (!admin) {
  console.error("Admin client not configured")
  process.exit(1)
}

const { data: report, error } = await admin
  .from("levelstack_reports")
  .select("id, status, plan_id, report_tier, user_id")
  .eq("id", reportId)
  .maybeSingle()

if (error || !report) {
  console.error("Report not found:", error?.message ?? report)
  process.exit(1)
}

const tier =
  report.report_tier === "free_snapshot" ||
  report.report_tier === "full_report" ||
  report.report_tier === "strategy_call"
    ? report.report_tier
    : planIdToReportTier(report.plan_id)

const token = signReportAccessToken(reportId, tier)
if (!token) {
  console.error(
    "Could not mint token — set LEVELSTACK_REPORT_TOKEN_SECRET in .env.local (must match production).",
  )
  process.exit(1)
}

const base =
  env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://levelstack.levelplaydigital.com"

const accessUrl = `${base}/reports/${reportId}/access?rtoken=${encodeURIComponent(token)}`
const directUrl = `${base}/reports/${reportId}`

console.log(JSON.stringify({
  reportId: report.id,
  status: report.status,
  tier,
  ownerUserId: report.user_id,
  accessUrl,
  directUrl,
  note: "Open accessUrl once — it sets an HttpOnly cookie, then redirects to the report.",
}, null, 2))
