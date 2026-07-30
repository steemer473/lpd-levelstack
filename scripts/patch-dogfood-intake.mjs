#!/usr/bin/env node
/**
 * Dev-only: patch LPD dogfood intake with real paid fields before regen.
 * Usage: npx tsx --env-file=.env.local scripts/patch-dogfood-intake.mjs [reportId]
 */
import { pathToFileURL } from "node:url"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const reportId =
  process.argv[2] ?? "031e84ed-ae67-437d-8131-774e45655d27"

const { createAdminClient } = await import(
  pathToFileURL(join(root, "lib/supabase/admin.ts")).href
)

const admin = createAdminClient()
if (!admin) {
  console.error("Admin client not configured")
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

const formData = {
  ...(intake.form_data ?? {}),
  businessVertical: "consulting_b2b",
  ownerName: "Stephanie Danielle Ragsdale",
  primaryService:
    "B2B marketing operations and automation systems for small businesses",
  primaryServiceKeywords: "marketing operations software",
  pricePoint: "$497–$694 LevelStack + platform retainers",
  marketCity: "Atlanta",
  marketState: "GA",
  geoMarket: "local",
  socialProfiles:
    "LinkedIn: https://www.linkedin.com/in/stephaniedragsdale\nInstagram: @levelplaydigital",
  emailListSize: "Under 500",
  complaintsAwareness: "None known",
  reputationSelfAssessment: "Limited third-party review volume; strong owned content",
  reputationScale: 7,
  purchaseMotivation: "Dogfood paid report QA",
}

const { error: updateErr } = await admin
  .from("levelstack_intakes")
  .update({ form_data: formData })
  .eq("id", intake.id)

if (updateErr) {
  console.error("Intake update failed:", updateErr.message)
  process.exit(1)
}

console.log("Patched dogfood intake:", {
  reportId,
  intakeId: intake.id,
  ownerName: formData.ownerName,
  primaryService: formData.primaryService,
  primaryServiceKeywords: formData.primaryServiceKeywords,
  businessVertical: formData.businessVertical,
})
