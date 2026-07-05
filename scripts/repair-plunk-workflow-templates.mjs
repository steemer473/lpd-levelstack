#!/usr/bin/env node
/**
 * Repair SEND_EMAIL steps: set top-level templateId so Plunk dashboard shows templates.
 * (API create only set config.templateId; UI reads step.templateId.)
 *
 * Usage:
 *   node scripts/repair-plunk-workflow-templates.mjs --from-local
 *   node scripts/repair-plunk-workflow-templates.mjs --from-local --dry-run
 */
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const workflowIdsPath = join(root, "docs/plunk/workflow-ids.json")

const fromLocal = process.argv.includes("--from-local")
const dryRun = process.argv.includes("--dry-run")

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
const workflowBase =
  process.env.PLUNK_WORKFLOW_API_URL?.trim() || "https://next-api.useplunk.com"

function headers() {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }
}

async function api(method, path, body) {
  const res = await fetch(`${workflowBase}${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${String(text).slice(0, 500)}`)
  }
  return text ? JSON.parse(text) : null
}

function loadJson(path) {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, "utf8"))
}

async function repairWorkflow(workflowId, label) {
  console.log(`\n— ${label} (${workflowId}) —`)

  const detail = await api("GET", `/workflows/${workflowId}`)
  const steps = detail.steps || detail.workflow?.steps || []
  const emailSteps = steps.filter((s) => s.type === "SEND_EMAIL")
  const needsRepair = emailSteps.filter(
    (s) => s.config?.templateId && s.templateId !== s.config.templateId,
  )

  if (needsRepair.length === 0) {
    console.log("✅ All email steps already linked")
    return { repaired: 0, skipped: emailSteps.length }
  }

  console.log(`Found ${needsRepair.length} step(s) missing top-level templateId`)

  if (dryRun) {
    for (const step of needsRepair) {
      console.log(`🔍 Would patch ${step.name} → ${step.config.templateId}`)
    }
    return { repaired: needsRepair.length, skipped: emailSteps.length - needsRepair.length }
  }

  const wasEnabled = detail.enabled ?? detail.workflow?.enabled ?? false
  if (wasEnabled) {
    await api("PATCH", `/workflows/${workflowId}`, { enabled: false })
    console.log("Disabled workflow for safe step updates")
  }

  try {
    await api("POST", `/workflows/${workflowId}/executions/cancel-all`)
    console.log("Cancelled active executions")
  } catch (err) {
    console.warn(`⚠️  cancel-all: ${err.message}`)
  }

  for (const step of needsRepair) {
    const templateId = step.config.templateId
    await api("PATCH", `/workflows/${workflowId}/steps/${step.id}`, { templateId })
    console.log(`✅ ${step.name} → ${templateId}`)
  }

  if (wasEnabled) {
    await api("PATCH", `/workflows/${workflowId}`, { enabled: true })
    console.log("Re-enabled workflow")
  }

  return { repaired: needsRepair.length, skipped: emailSteps.length - needsRepair.length }
}

async function main() {
  if (!apiKey) {
    console.error("Missing PLUNK_SECRET_KEY. Use --from-local or set env.")
    process.exit(1)
  }

  const workflowMapping = loadJson(workflowIdsPath)
  const targets = [
    ["Workflow A", workflowMapping.workflow_a],
    ["Workflow B", workflowMapping.workflow_b],
    ["Workflow C", workflowMapping.workflow_c],
  ].filter(([, id]) => Boolean(id))

  if (targets.length === 0) {
    console.error(`No workflow IDs in ${workflowIdsPath}`)
    process.exit(1)
  }

  console.log(`Plunk workflow template repair${dryRun ? " (dry run)" : ""}`)
  console.log(`API: ${workflowBase}`)

  let totalRepaired = 0
  for (const [label, id] of targets) {
    const result = await repairWorkflow(id, label)
    totalRepaired += result.repaired
  }

  console.log(`\nDone. Repaired ${totalRepaired} email step(s).`)
  if (!dryRun && totalRepaired > 0) {
    console.log(
      "Note: active executions were cancelled — re-fire levelstack_report_ready (or waitlist events) to restart affected contacts.",
    )
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
