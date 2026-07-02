#!/usr/bin/env node
/**
 * Deploy Plunk analytics webhook workflows (separate from nurture A/B).
 *
 * Plunk has no global "Webhook URL" setting — each event needs its own workflow
 * with a WEBHOOK step pointing at your app endpoint.
 *
 * Usage:
 *   node scripts/setup-plunk-analytics-webhooks.mjs --from-local
 *   node scripts/setup-plunk-analytics-webhooks.mjs --from-local --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const workflowIdsPath = join(root, "docs/plunk/analytics-workflow-ids.json")

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
const webhookUrl =
  process.env.PLUNK_WEBHOOK_URL?.trim() ||
  "https://levelstack.levelplaydigital.com/api/webhooks/plunk"
const webhookSecret = process.env.PLUNK_WEBHOOK_SECRET?.trim()

/** System events forwarded to Supabase email_events */
const ANALYTICS_EVENTS = [
  "email.delivery",
  "email.open",
  "email.click",
  "email.bounce",
  "contact.unsubscribed",
]

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

function saveJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8")
}

function workflowName(eventName) {
  return `LevelStack Analytics — ${eventName}`
}

function webhookBody(eventName) {
  return JSON.stringify({
    type: eventName,
    email: "{{email}}",
    data: {
      emailId: "{{event.emailId}}",
      templateId: "{{event.templateId}}",
      campaignId: "{{event.campaignId}}",
      reason: "{{event.reason}}",
      bounceType: "{{event.bounceType}}",
      link: "{{event.link}}",
    },
  })
}

function webhookConfig() {
  const config = {
    url: webhookUrl,
    method: "POST",
    body: undefined,
  }
  if (webhookSecret) {
    config.headers = {
      Authorization: `Bearer ${webhookSecret}`,
    }
  }
  return config
}

async function listWorkflows() {
  const data = await api("GET", "/workflows")
  return data.workflows || data.data || data || []
}

async function connectSteps(workflowId, fromStepId, toStepId) {
  return api("POST", `/workflows/${workflowId}/transitions`, {
    fromStepId,
    toStepId,
  })
}

function loadExistingWorkflowIds(raw) {
  if (!raw || typeof raw !== "object") return {}
  const bucket = raw.workflows
  if (!bucket || typeof bucket !== "object") return {}

  const ids = { ...bucket }
  delete ids.webhook_url
  delete ids.updated_at
  delete ids.workflows

  if (bucket.workflows && typeof bucket.workflows === "object") {
    return { ...bucket.workflows, ...ids }
  }
  return ids
}

async function deployAnalyticsWorkflow(eventName, existingIds) {
  const name = workflowName(eventName)
  const existingId = existingIds[eventName]

  if (dryRun) {
    console.log(`🔍 Would create analytics workflow: ${eventName} → ${webhookUrl}`)
    return existingId || null
  }

  const all = await listWorkflows()
  const matches = all.filter((w) => w.name === name || w.eventName === eventName)
  if (matches.length > 0) {
    const preferred =
      (existingId && matches.find((w) => w.id === existingId)) || matches[matches.length - 1]
    console.log(`⏭️  ${eventName} — already exists (${preferred.id})`)
    return preferred.id
  }

  const workflow = await api("POST", "/workflows", {
    name,
    eventName,
    enabled: true,
    allowReentry: true,
  })
  const workflowId = workflow.id || workflow.workflow?.id
  if (!workflowId) throw new Error(`Analytics workflow ${eventName} returned no id`)

  const config = webhookConfig()
  config.body = webhookBody(eventName)

  const webhookStep = await api("POST", `/workflows/${workflowId}/steps`, {
    type: "WEBHOOK",
    name: "POST to LevelStack analytics",
    position: { x: 120, y: 220 },
    config,
  })

  const detail = await api("GET", `/workflows/${workflowId}`)
  const steps = detail.steps || detail.workflow?.steps || []
  const trigger = steps.find((s) => s.type === "TRIGGER")
  const webhookStepId = webhookStep.id || webhookStep.step?.id || webhookStep.stepId

  if (trigger?.id && webhookStepId) {
    await connectSteps(workflowId, trigger.id, webhookStepId)
  } else {
    console.warn(`⚠️  ${eventName} — verify trigger → webhook transition in Plunk dashboard`)
  }

  await api("PATCH", `/workflows/${workflowId}`, { enabled: true })
  console.log(`✅ ${eventName} → workflow ${workflowId}`)
  return workflowId
}

async function main() {
  if (!apiKey) {
    console.error("Missing PLUNK_SECRET_KEY. Use --from-local or set env.")
    process.exit(1)
  }

  console.log(`Plunk analytics webhooks${dryRun ? " (dry run)" : ""}`)
  console.log(`Webhook URL: ${webhookUrl}`)
  if (!webhookSecret) {
    console.warn(
      "\n⚠️  PLUNK_WEBHOOK_SECRET is empty — webhooks will deploy without auth headers.",
    )
    console.warn("   Set a secret in .env.local + Vercel, then re-run to add Authorization headers.\n")
  }

  const existing = loadJson(workflowIdsPath)
  const existingIds = loadExistingWorkflowIds(existing)
  const deployed = { ...existingIds }

  for (const eventName of ANALYTICS_EVENTS) {
    const id = await deployAnalyticsWorkflow(eventName, existingIds)
    if (id) deployed[eventName] = id
  }

  if (!dryRun) {
    saveJson(workflowIdsPath, {
      webhook_url: webhookUrl,
      updated_at: new Date().toISOString(),
      workflows: deployed,
      deprecated_workflows: [
        "d1d85928-fae9-4162-8cc5-67797d3e266f",
        "e1fa9ee1-af6a-426d-b555-d923e9baa9ae",
        "e9304375-0a97-45d7-ade6-9972f0b359ab",
        "d912c6b2-fbf1-4259-9a21-60e98d5a84e3",
        "0ea1990d-fff8-4417-b968-edf1aebc7081",
      ],
    })
    console.log(`\nSaved → ${workflowIdsPath}`)
    console.log(
      "\nIn Plunk dashboard: Workflows → filter by 'LevelStack Analytics' to see webhook steps.",
    )
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
