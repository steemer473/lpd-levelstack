#!/usr/bin/env node
/**
 * Apply a Supabase migration SQL file to the linked LPD project via Management API.
 *
 * Prereq: Supabase personal access token with project access
 *   export SUPABASE_ACCESS_TOKEN=sbp_...
 *   # Create at https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   node scripts/apply-supabase-migration.mjs supabase/migrations/20250606100000_prd_v2_tiers.sql
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const PROJECT_REF = "lppmbgqsovtfbpbvjvxi"
const token = process.env.SUPABASE_ACCESS_TOKEN

const sqlPath = process.argv[2]
if (!sqlPath) {
  console.error("Usage: node scripts/apply-supabase-migration.mjs <path-to.sql>")
  process.exit(1)
}

if (!token) {
  console.error(
    "SUPABASE_ACCESS_TOKEN is required.\n" +
      "Create one at https://supabase.com/dashboard/account/tokens then:\n" +
      "  export SUPABASE_ACCESS_TOKEN=sbp_...\n" +
      "Or run: supabase login && supabase db push",
  )
  process.exit(1)
}

const query = readFileSync(resolve(sqlPath), "utf8")

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
)

const body = await res.text()
if (!res.ok) {
  console.error(`Migration failed (HTTP ${res.status}):`, body)
  process.exit(1)
}

console.log("Migration applied successfully.")
if (body) console.log(body)
