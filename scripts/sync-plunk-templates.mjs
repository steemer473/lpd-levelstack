#!/usr/bin/env node
/**
 * Generate HTML files and optionally sync MARKETING templates to Plunk.
 *
 * Usage:
 *   pnpm generate:nurture-emails
 *   node scripts/sync-plunk-templates.mjs --from-local
 *   node scripts/sync-plunk-templates.mjs --from-local --dry-run
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const htmlOutDir = join(root, "docs/plunk/email-templates")
const mappingPath = join(htmlOutDir, "template-ids.json")

const fromLocal = process.argv.includes("--from-local")
const dryRun = process.argv.includes("--dry-run")
const syncOnly = process.argv.includes("--sync-only")

const envPath = join(root, ".env.local")
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

const apiKey = process.env.PLUNK_SECRET_KEY?.trim()
let apiBase = process.env.PLUNK_API_URL?.trim() || "https://next-api.useplunk.com"
if (apiBase.includes("api.useplunk.com") && !apiBase.includes("next-api.useplunk.com")) {
  console.warn("⚠️  PLUNK_API_URL points at api.useplunk.com — using https://next-api.useplunk.com for templates/track.")
  apiBase = "https://next-api.useplunk.com"
}
const fromEmail = process.env.PLUNK_FROM_EMAIL?.trim()
const fromName = process.env.PLUNK_FROM_NAME?.trim() || "LevelStack"

function loadMapping() {
  if (!existsSync(mappingPath)) return {}
  return JSON.parse(readFileSync(mappingPath, "utf8"))
}

function saveMapping(mapping) {
  writeFileSync(mappingPath, `${JSON.stringify(mapping, null, 2)}\n`, "utf8")
}

async function loadTemplatesFromCode() {
  const modPath = pathToFileURL(join(root, "lib/email/nurture-email-layout.ts")).href
  const { ALL_NURTURE_TEMPLATES, nurtureEmailLayout } = await import(modPath)
  return ALL_NURTURE_TEMPLATES.map((t) => {
    const html = nurtureEmailLayout({
      title: t.subject,
      preheader: t.preheader,
      body: t.buildBody(),
    })
    return { ...t, html }
  })
}

async function upsertPlunkTemplate(template, existingId) {
  const payload = {
    name: `LevelStack — ${template.slug}`,
    subject: template.subject,
    body: template.html,
    type: "MARKETING",
    ...(fromEmail ? { from: fromEmail, fromName } : {}),
  }

  const path = existingId ? `/templates/${existingId}` : "/templates"
  const method = existingId ? "PATCH" : "POST"

  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Template ${template.filename} failed (${res.status}): ${text.slice(0, 400)}`)
  }
  const data = JSON.parse(text)
  return (
    data.id ||
    data.template?.id ||
    data.data?.id ||
    existingId
  )
}

async function main() {
  const templates = await loadTemplatesFromCode()

  if (!syncOnly) {
    mkdirSync(htmlOutDir, { recursive: true })
    for (const template of templates) {
      const outPath = join(htmlOutDir, template.filename)
      writeFileSync(outPath, template.html, "utf8")
      console.log(`Wrote ${outPath}`)
    }
  }

  if (!apiKey) {
    console.log("\nPLUNK_SECRET_KEY not set — HTML generated only. Re-run with --from-local after adding keys.")
    return
  }

  if (fromEmail) {
    console.log(`\nPlunk from: ${fromName} <${fromEmail}>`)
  } else {
    console.warn("\n⚠️  PLUNK_FROM_EMAIL not set — verify sender domain in Plunk dashboard.")
  }

  const mapping = loadMapping()
  const updated = { ...mapping }

  console.log(`\nSyncing ${templates.length} MARKETING template(s) to Plunk${dryRun ? " (dry run)" : ""}…`)

  for (const template of templates) {
    const existingId = updated[template.filename]
    if (dryRun) {
      console.log(`🔍 Would sync ${template.filename}${existingId ? ` → ${existingId}` : " (create)"}`)
      continue
    }
    const id = await upsertPlunkTemplate(template, existingId)
    updated[template.filename] = id
    console.log(`✅ ${template.filename} → ${id}`)
  }

  if (!dryRun) {
    saveMapping(updated)
    console.log(`\nSaved template IDs → ${mappingPath}`)
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
