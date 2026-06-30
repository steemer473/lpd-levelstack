#!/usr/bin/env node
/**
 * Generates GHL-ready HTML files from lib/email/ghl-email-layout.ts
 * Run: node scripts/generate-ghl-email-templates.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const outDir = join(root, "docs/ghl/email-templates")

async function main() {
  const modPath = pathToFileURL(join(root, "lib/email/ghl-email-layout.ts")).href
  const {
    ghlEmailLayout,
    GHL_EMAIL_TEMPLATES,
    GHL_WAITLIST_EMAIL_TEMPLATES,
  } = await import(modPath)

  mkdirSync(outDir, { recursive: true })

  for (const template of [...GHL_EMAIL_TEMPLATES, ...GHL_WAITLIST_EMAIL_TEMPLATES]) {
    const html = ghlEmailLayout({
      title: template.subject,
      preheader: template.preheader,
      body: template.buildBody(),
    })
    const outPath = join(outDir, template.filename)
    writeFileSync(outPath, html, "utf8")
    console.log(`Wrote ${outPath}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
