#!/usr/bin/env node
/**
 * Lint customer-facing copy for retired "report" language.
 * Allowlist: internal identifiers, API routes, test fixtures, component paths.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const CUSTOMER_DIRS = ["app", "components", "data", "lib/report", "lib/email"]
const SKIP_DIRS = ["node_modules", ".next", "app/api", "docs", "e2e", "scripts", "lib/pipeline", "lib/auth", "lib/reports", "lib/research", "lib/ghl", "lib/prompts"]
const EXT = [".ts", ".tsx", ".md"]
const BANNED = [
  /\bfull[_\s]report\b/i,
  /\bfull report\b/i,
]
const ALLOWLIST = [
  /reportId/i,
  /full_report/i,
  /levelstack_report_url/i,
  /report-tier/i,
  /reportTier/i,
  /report-types/i,
  /report-shared/i,
  /report-view/i,
  /report-faq/i,
  /report-delivery/i,
  /report-complete/i,
  /report-value/i,
  /report-footer/i,
  /report-sidebar/i,
  /report-types/i,
  /levelstack-report/i,
  /\/reports\//i,
  /\/api\//i,
  /\.test\./i,
  /\.spec\./i,
  /e2e\//i,
  /structured-data/i,
  /ghl-nurture/i,
  /sanitize-report/i,
  /parse-serp/i,
  /section-guides/i,
  /REPORT_INTRO/i,
  /report JSON/i,
  /report pipeline/i,
  /report engine/i,
  /report analysis/i,
  /report evidence/i,
  /report-ready/i,
  /report URL/i,
  /report link/i,
  /report delivery/i,
  /report-complete/i,
  /report tier/i,
  /report UI/i,
  /report email/i,
  /report PDF/i,
  /Action Roadmap PDF/i,
  /docs\//i,
  /scripts\//i,
]

function walk(dir, files = []) {
  try {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (SKIP_DIRS.some((s) => p.includes(s))) continue
      if (name === "node_modules" || name === ".next") continue
      const st = statSync(p)
      if (st.isDirectory()) walk(p, files)
      else if (EXT.some((e) => name.endsWith(e))) files.push(p)
    }
  } catch {
    /* skip missing dirs */
  }
  return files
}

function isAllowed(line) {
  return ALLOWLIST.some((re) => re.test(line))
}

const files = CUSTOMER_DIRS.flatMap((d) => walk(join(ROOT, d)))
const violations = []

for (const file of files) {
  const rel = relative(ROOT, file)
  if (/\.test\./.test(rel) || /\.spec\./.test(rel)) continue
  const lines = readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    if (isAllowed(line)) return
    for (const re of BANNED) {
      if (re.test(line)) violations.push(`${rel}:${i + 1}: ${line.trim().slice(0, 80)}`)
    }
  })
}

if (violations.length) {
  console.error("lint:customer-copy failed:\n" + violations.slice(0, 30).join("\n"))
  if (violations.length > 30) console.error(`... and ${violations.length - 30} more`)
  process.exit(1)
}
console.log("lint:customer-copy passed")
