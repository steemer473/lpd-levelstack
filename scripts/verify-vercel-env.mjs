/**
 * Pre-deploy checklist for Vercel Production env (no secret values printed).
 * Usage: VERCEL_ENV=production node scripts/verify-vercel-env.mjs
 *
 * Or load from .env.local and check what would be required on Vercel:
 *   node scripts/verify-vercel-env.mjs --from-local
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const fromLocal = process.argv.includes("--from-local")
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

const requiredProduction = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_HUB_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERPAPI_KEY",
  "OPENAI_API_KEY",
]

const forbiddenOnVercel = [
  "LEVELSTACK_DEV_BYPASS_ENTITLEMENT",
  "LEVELSTACK_DEV_SKIP_WEBSITE_CHECK",
]

const recommended = [
  "FIRECRAWL_API_KEY",
  "GOOGLE_PAGESPEED_API_KEY",
  "RESEND_API_KEY",
]

console.log("Vercel Production environment checklist\n")

let failed = false

for (const key of requiredProduction) {
  const ok = Boolean(process.env[key]?.trim())
  console.log(`  ${ok ? "✓" : "✗"} ${key}${ok ? "" : " — MISSING"}`)
  if (!ok) failed = true
}

console.log("")
for (const key of recommended) {
  const ok = Boolean(process.env[key]?.trim())
  console.log(`  ${ok ? "✓" : "○"} ${key}${ok ? "" : " — optional, not set"}`)
}

console.log("")
const checkForbiddenOnVercel = !fromLocal || process.env.VERCEL_ENV === "production"
for (const key of forbiddenOnVercel) {
  const set = process.env[key] === "true"
  if (!checkForbiddenOnVercel) {
    console.log(
      `  ○ ${key}${set ? " — set locally (ok for dev; omit on Vercel)" : " — not set"}`,
    )
    continue
  }
  console.log(`  ${set ? "✗" : "✓"} ${key}${set ? " — MUST NOT be true on Vercel" : " — ok"}`)
  if (set) failed = true
}

if (failed) {
  console.log("\nFix missing/forbidden variables in Vercel → Project → Settings → Environment Variables")
  process.exit(1)
}

console.log("\nAll required Production variables present.")
console.log("Set them in Vercel dashboard or: vercel env add <NAME> production")
