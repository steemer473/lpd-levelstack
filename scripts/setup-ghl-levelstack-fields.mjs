/**
 * Create LevelStack GHL custom fields via API.
 * Keys must match lib/ghl/field-mapping.ts (GHL derives keys from field names).
 *
 * Usage:
 *   node scripts/setup-ghl-levelstack-fields.mjs --from-local
 *   node scripts/setup-ghl-levelstack-fields.mjs --from-local --dry-run
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const fromLocal = process.argv.includes("--from-local")
const dryRun = process.argv.includes("--dry-run")
const envPath = resolve(process.cwd(), ".env.local")

if (fromLocal && existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

const apiKey = process.env.GHL_API_KEY?.trim()
const locationId = process.env.GHL_LOCATION_ID?.trim()

if (!apiKey || !locationId) {
  console.error("Missing GHL_API_KEY or GHL_LOCATION_ID. Use --from-local or set env vars.")
  process.exit(1)
}

const isPIT = apiKey.startsWith("pit-")
const baseUrl = isPIT
  ? "https://services.leadconnectorhq.com"
  : "https://rest.gohighlevel.com/v1"

function headers() {
  const h = {
    "Content-Type": "application/json",
    Version: "2021-07-28",
    Authorization: `Bearer ${apiKey}`,
    locationId,
  }
  return h
}

/** Expected API keys from lib/ghl/field-mapping.ts */
const LEVELSTACK_FIELDS = [
  { name: "Website URL", expectedKey: "website_url", dataType: "TEXT" },
  { name: "Intake Source", expectedKey: "intake_source", dataType: "TEXT" },
  { name: "Geo Focus", expectedKey: "geo_focus", dataType: "TEXT" },
  { name: "LevelStack Report URL", expectedKey: "levelstack_report_url", dataType: "TEXT" },
  { name: "Primary Service", expectedKey: "primary_service", dataType: "TEXT" },
  { name: "Purchase Motivation", expectedKey: "purchase_motivation", dataType: "TEXT" },
  { name: "Market City", expectedKey: "market_city", dataType: "TEXT" },
  { name: "Top Competitor", expectedKey: "top_competitor", dataType: "TEXT" },
  { name: "Top Finding", expectedKey: "top_finding", dataType: "TEXT" },
  { name: "Report Tier", expectedKey: "report_tier", dataType: "TEXT" },
]

function normalizeKey(fieldKey) {
  if (!fieldKey) return ""
  return fieldKey.includes(".") ? fieldKey.split(".")[1] : fieldKey
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function listCustomFields() {
  const res = await fetch(`${baseUrl}/custom-fields/`, {
    method: "GET",
    headers: headers(),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`List fields failed (${res.status}): ${text.slice(0, 300)}`)
  }
  const parsed = JSON.parse(text)
  const fields = parsed.customFields || parsed.fields || parsed || []
  return Array.isArray(fields) ? fields : []
}

async function createCustomField(field) {
  const res = await fetch(`${baseUrl}/custom-fields/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: field.name,
      dataType: field.dataType,
    }),
  })
  const text = await res.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { raw: text }
  }
  return { ok: res.ok, status: res.status, body: parsed }
}

async function main() {
  console.log(`GHL LevelStack field setup${dryRun ? " (dry run)" : ""}`)
  console.log(`Location: ${locationId.slice(0, 8)}…`)

  const existing = await listCustomFields()
  const byName = new Map(
    existing.map((f) => [String(f.name || "").toLowerCase(), f]),
  )
  const byKey = new Map(
    existing.map((f) => [normalizeKey(f.fieldKey || f.key || ""), f]),
  )

  const results = []

  for (const field of LEVELSTACK_FIELDS) {
    const existingByName = byName.get(field.name.toLowerCase())
    const existingByKey = byKey.get(field.expectedKey)

    if (existingByName || existingByKey) {
      const match = existingByName || existingByKey
      const actualKey = normalizeKey(match.fieldKey || match.key)
      results.push({
        name: field.name,
        status: "exists",
        expectedKey: field.expectedKey,
        actualKey,
        keyMatch: actualKey === field.expectedKey,
      })
      console.log(
        `⏭️  ${field.name} — already exists (key: ${actualKey}${actualKey === field.expectedKey ? "" : `, expected ${field.expectedKey}`})`,
      )
      continue
    }

    if (dryRun) {
      results.push({ name: field.name, status: "would_create", expectedKey: field.expectedKey })
      console.log(`🔍 Would create: ${field.name} → ${field.expectedKey}`)
      continue
    }

    const created = await createCustomField(field)
    const cf =
      created.body?.customField ||
      created.body?.response?.customField ||
      created.body

    if (created.ok && cf) {
      const actualKey = normalizeKey(cf.fieldKey || cf.key)
      results.push({
        name: field.name,
        status: "created",
        expectedKey: field.expectedKey,
        actualKey,
        id: cf.id,
      })
      console.log(`✅ Created ${field.name} (key: ${actualKey}, id: ${cf.id || "?"})`)
    } else {
      const errMsg =
        created.body?.errors?.[0]?.message ||
        created.body?.message ||
        created.body?.error ||
        JSON.stringify(created.body).slice(0, 200)
      const isDuplicate =
        String(errMsg).toLowerCase().includes("already") ||
        String(errMsg).toLowerCase().includes("duplicate") ||
        String(errMsg).toLowerCase().includes("taken")

      results.push({
        name: field.name,
        status: isDuplicate ? "exists" : "failed",
        expectedKey: field.expectedKey,
        error: String(errMsg),
      })
      console.log(
        `${isDuplicate ? "⏭️" : "❌"} ${field.name} — ${isDuplicate ? "already exists" : errMsg}`,
      )
    }

    await sleep(250)
  }

  const created = results.filter((r) => r.status === "created").length
  const exists = results.filter((r) => r.status === "exists").length
  const failed = results.filter((r) => r.status === "failed").length
  const keyMismatches = results.filter(
    (r) => r.actualKey && r.expectedKey && r.actualKey !== r.expectedKey,
  )

  console.log("\nSummary:")
  console.log(`  Created: ${created}`)
  console.log(`  Already existed: ${exists}`)
  console.log(`  Failed: ${failed}`)

  if (keyMismatches.length > 0) {
    console.log("\n⚠️  Key mismatches (update lib/ghl/field-mapping.ts if needed):")
    for (const m of keyMismatches) {
      console.log(`  ${m.name}: expected ${m.expectedKey}, got ${m.actualKey}`)
    }
  }

  console.log("\nTags (auto-created on first use — no API setup required):")
  console.log("  levelstack, levelstack_free_snapshot, levelstack_paid_intake")
  console.log("  levelstack_report_ready, levelstack_report_ready_free_snapshot")
  console.log("  levelstack_report_ready_full_report, levelstack_report_ready_strategy_call")
  console.log("  paid_levelstack, seo_automator_pro_waitlist")

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
