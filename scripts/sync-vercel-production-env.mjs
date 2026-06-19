/**
 * Push Production env vars from .env.local to Vercel (non-interactive).
 * Overrides public URLs for production. Skips dev-only flags.
 *
 * Prereq: pnpm dlx vercel link --yes --project lpd-levelstack --scope steemer473s-projects
 *
 * Usage: node scripts/sync-vercel-production-env.mjs
 * Preview: set via Vercel dashboard (Preview → All Previews) — CLI 50.x cannot
 * add Preview vars non-interactively without a feature-branch name.
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"

const SCOPE = "steemer473s-projects"
const PRODUCTION_APP_URL = "https://levelstack.levelplaydigital.com"
const PRODUCTION_HUB_URL = "https://levelplaydigital.com"

const SENSITIVE = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "SERPAPI_KEY",
  "SEARCHAPI_KEY",
  "DATAFORSEO_LOGIN",
  "DATAFORSEO_PASSWORD",
  "FIRECRAWL_API_KEY",
  "GOOGLE_PAGESPEED_API_KEY",
  "RESEND_API_KEY",
  "ANTHROPIC_API_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
])

const SKIP = new Set([
  "LEVELSTACK_DEV_BYPASS_ENTITLEMENT",
  "LEVELSTACK_DEV_SKIP_WEBSITE_CHECK",
  "LEVELSTACK_DEV_MOCK_SERP",
])

const KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_HUB_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERPAPI_KEY",
  "SEARCHAPI_KEY",
  "DATAFORSEO_LOGIN",
  "DATAFORSEO_PASSWORD",
  "SERP_PROVIDER_CHAIN",
  "SERP_CACHE_TTL_HOURS",
  "OPENAI_API_KEY",
  "FIRECRAWL_API_KEY",
  "GOOGLE_PAGESPEED_API_KEY",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "FROM_NAME",
  "ANTHROPIC_API_KEY",
]

if (process.argv.includes("--preview")) {
  console.error(
    "Preview env vars: use Vercel dashboard → Environment Variables → Preview → All Previews.\n" +
      "The Vercel CLI cannot target all Preview branches non-interactively on this CLI version.",
  )
  process.exit(1)
}
const envPath = resolve(process.cwd(), ".env.local")

if (!existsSync(envPath)) {
  console.error("Missing .env.local — copy from .env.example and fill values.")
  process.exit(1)
}

const vars = {}
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
  vars[key] = value
}

vars.NEXT_PUBLIC_APP_URL = PRODUCTION_APP_URL
vars.NEXT_PUBLIC_HUB_URL = PRODUCTION_HUB_URL

const targets = ["production"]

for (const target of targets) {
  console.log(`\nSyncing ${target} environment…`)
  for (const key of KEYS) {
    if (SKIP.has(key)) continue
    const value = vars[key]?.trim()
    if (!value) {
      console.log(`  ○ skip ${key} (not in .env.local)`)
      continue
    }

    const args = [
      "env",
      "add",
      key,
      target,
      "--value",
      value,
      "--yes",
      "--force",
      "--scope",
      SCOPE,
    ]
    if (SENSITIVE.has(key)) args.push("--sensitive")

    // Vercel CLI often hangs after a successful save; cap wait time per variable.
    const result = spawnSync("vercel", args, {
      stdio: "pipe",
      cwd: process.cwd(),
      timeout: 30_000,
      encoding: "utf8",
    })

    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`
    const saved =
      output.includes("Saving") ||
      output.includes("Added Environment Variable") ||
      output.includes("Overrode Environment Variable")

    if (result.error?.code === "ETIMEDOUT" && saved) {
      console.log(`  ✓ ${key} (saved; CLI timed out)`)
      continue
    }

    if (result.status !== 0 && !saved) {
      if (output.trim()) console.error(output.trim())
      console.error(`Failed to set ${key} for ${target}`)
      process.exit(result.status ?? 1)
    }
    console.log(`  ✓ ${key}`)
  }
}

console.log("\nDone. Redeploy production or run: vercel --prod")
