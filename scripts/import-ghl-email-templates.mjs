#!/usr/bin/env node
/**
 * Push LevelStack nurture HTML into GHL Email Builder templates.
 *
 * Requires a Private Integration Token (pit-...) with marketing scope in GHL_API_KEY.
 * Legacy location JWT keys work for contacts/fields but not email builder APIs.
 *
 * Usage:
 *   pnpm generate:ghl-emails
 *   node scripts/import-ghl-email-templates.mjs --from-local
 *   node scripts/import-ghl-email-templates.mjs --from-local --dry-run
 *   node scripts/import-ghl-email-templates.mjs --from-local --create-missing
 *
 * Optional mapping file (templateId per filename):
 *   docs/ghl/email-templates/template-ids.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const templatesDir = join(root, "docs/ghl/email-templates")
const mappingPath = join(templatesDir, "template-ids.json")

const fromLocal = process.argv.includes("--from-local")
const dryRun = process.argv.includes("--dry-run")
const createMissing = process.argv.includes("--create-missing")
const listOnly = process.argv.includes("--list")

const envPath = resolve(root, ".env.local")
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

if (!apiKey.startsWith("pit-")) {
  console.error(
    "GHL email builder APIs require a Private Integration Token (pit-...).\n" +
      "Create one in GHL: Settings → Private Integrations → marketing scope.\n" +
      "Set it as GHL_API_KEY in .env.local, then re-run.\n\n" +
      "For manual paste, run: node scripts/ghl-email-paste-helper.mjs",
  )
  process.exit(1)
}

const baseUrl = "https://services.leadconnectorhq.com"

function headers() {
  return {
    "Content-Type": "application/json",
    Version: "2021-07-28",
    Authorization: `Bearer ${apiKey}`,
  }
}

async function listEmailTemplates() {
  const res = await fetch(
    `${baseUrl}/emails/builder?locationId=${locationId}&limit=100`,
    { headers: headers() },
  )
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`List templates failed (${res.status}): ${text.slice(0, 400)}`)
  }
  const data = JSON.parse(text)
  return data.builders || data.templates || data.data || data.items || []
}

async function updateTemplate(templateId, { subject, preheader, html }) {
  const res = await fetch(`${baseUrl}/emails/builder/${templateId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      locationId,
      editorType: "html",
      editorContent: html,
      subject,
      previewText: preheader,
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Update ${templateId} failed (${res.status}): ${text.slice(0, 400)}`)
  }
  return JSON.parse(text)
}

async function createTemplate({ name, subject, preheader, html }) {
  const res = await fetch(`${baseUrl}/emails/builder?locationId=${locationId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      locationId,
      name,
      type: "html",
      editorType: "html",
      editorContent: html,
      subject,
      previewText: preheader,
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Create template failed (${res.status}): ${text.slice(0, 400)}`)
  }
  return JSON.parse(text)
}

function loadMapping() {
  if (!existsSync(mappingPath)) return {}
  return JSON.parse(readFileSync(mappingPath, "utf8"))
}

function saveMapping(mapping) {
  writeFileSync(mappingPath, `${JSON.stringify(mapping, null, 2)}\n`, "utf8")
}

function matchTemplate(existing, { filename, subject }) {
  const slug = filename.replace(".html", "")
  return existing.find((t) => {
    const name = String(t.name || t.title || "").toLowerCase()
    const subj = String(t.subject || t.template?.subject || "").toLowerCase()
    return (
      name.includes(slug) ||
      name.includes("levelstack") && name.includes(slug.replace("email-", "")) ||
      subj === subject.toLowerCase()
    )
  })
}

async function loadTemplatesFromCode() {
  const modPath = pathToFileURL(join(root, "lib/email/ghl-email-layout.ts")).href
  const { GHL_EMAIL_TEMPLATES } = await import(modPath)
  return GHL_EMAIL_TEMPLATES.map((t) => ({
    ...t,
    html: readFileSync(join(templatesDir, t.filename), "utf8"),
    name: `LevelStack — ${t.filename.replace(".html", "")}`,
  }))
}

async function main() {
  console.log(`GHL email import${dryRun ? " (dry run)" : ""}`)
  console.log(`Location: ${locationId.slice(0, 8)}…`)

  const existing = await listEmailTemplates()
  console.log(`Found ${existing.length} email template(s) in GHL.`)

  if (listOnly) {
    for (const t of existing) {
      console.log(`- ${t.id || t._id} | ${t.name || t.title} | ${t.subject || ""}`)
    }
    return
  }

  const mapping = loadMapping()
  const templates = await loadTemplatesFromCode()
  const updatedMapping = { ...mapping }

  for (const template of templates) {
    let templateId = updatedMapping[template.filename]
    let match = templateId
      ? existing.find((t) => (t.id || t._id) === templateId)
      : matchTemplate(existing, template)

    if (!match && !templateId && createMissing) {
      if (dryRun) {
        console.log(`🔍 Would create: ${template.filename} (${template.subject})`)
        continue
      }
      const created = await createTemplate(template)
      templateId = created.id || created.templateId || created.data?.id
      console.log(`✅ Created ${template.filename} → ${templateId}`)
      updatedMapping[template.filename] = templateId
      continue
    }

    if (!match && !templateId) {
      console.log(
        `⚠️  No match for ${template.filename} ("${template.subject}"). ` +
          `Add id to ${mappingPath} or use --create-missing`,
      )
      continue
    }

    templateId = templateId || match.id || match._id
    updatedMapping[template.filename] = templateId

    if (dryRun) {
      console.log(`🔍 Would update ${template.filename} → ${templateId}`)
      continue
    }

    await updateTemplate(templateId, template)
    console.log(`✅ Updated ${template.filename} → ${templateId}`)
  }

  saveMapping(updatedMapping)
  console.log(`\nSaved template IDs → ${mappingPath}`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
