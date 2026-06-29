#!/usr/bin/env node
/**
 * Interactive clipboard helper for pasting GHL nurture HTML in your own browser session.
 *
 * Usage (while on Marketing → Emails in GHL):
 *   node scripts/ghl-email-paste-helper.mjs
 *
 * Copies each template HTML to your clipboard. Paste into GHL Custom HTML editor, then press Enter for the next.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import readline from "node:readline/promises"
import { execSync } from "node:child_process"
import { stdin as input, stdout as output } from "node:process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const templatesDir = join(root, "docs/ghl/email-templates")

function copyToClipboard(text) {
  if (process.platform === "darwin") {
    execSync("pbcopy", { input: text })
    return true
  }
  if (process.platform === "win32") {
    execSync("clip", { input: text })
    return true
  }
  return false
}

async function main() {
  const modPath = pathToFileURL(join(root, "lib/email/ghl-email-layout.ts")).href
  const { GHL_EMAIL_TEMPLATES } = await import(modPath)
  const rl = readline.createInterface({ input, output })

  console.log("\nLevelStack GHL paste helper")
  console.log("Open: Marketing → Emails → Templates (or workflow email step → Custom HTML)\n")

  for (const template of GHL_EMAIL_TEMPLATES) {
    const html = readFileSync(join(templatesDir, template.filename), "utf8")
    const copied = copyToClipboard(html)

    console.log("─".repeat(60))
    console.log(`File:    ${template.filename}`)
    console.log(`Subject: ${template.subject}`)
    console.log(`Preview: ${template.preheader}`)
    if (copied) {
      console.log("✓ Full HTML copied to clipboard")
    } else {
      console.log(`Open file: ${join(templatesDir, template.filename)}`)
    }
    console.log("\nIn GHL: edit matching template → Custom HTML → select all → paste → save subject")
    await rl.question("Press Enter when done with this template… ")
  }

  rl.close()
  console.log("\nDone — all 5 templates processed.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
