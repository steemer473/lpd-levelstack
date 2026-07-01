#!/usr/bin/env node
/**
 * Deploy LevelStack nurture workflows to Plunk via REST API.
 *
 * Prerequisites:
 *   pnpm generate:nurture-emails && node scripts/sync-plunk-templates.mjs --from-local
 *
 * Usage:
 *   node scripts/setup-plunk-workflows.mjs --from-local
 *   node scripts/setup-plunk-workflows.mjs --from-local --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const templateIdsPath = join(root, "docs/plunk/email-templates/template-ids.json")
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

const EVENT_REPORT_READY = "levelstack_report_ready"
const EVENT_PURCHASED = "levelstack_purchased"
const EVENT_WAITLIST = "sap_waitlist_joined"

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
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${String(text).slice(0, 500)}`)
  }
  return data
}

function loadJson(path) {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, "utf8"))
}

function saveJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8")
}

function templateId(mapping, filename) {
  const id = mapping[filename]
  if (!id) {
    throw new Error(`Missing template id for ${filename}. Run sync-plunk-templates.mjs first.`)
  }
  return id
}

async function createWorkflow({ name, eventName }) {
  return api("POST", "/workflows", {
    name,
    eventName,
    enabled: true,
    allowReentry: false,
  })
}

async function addStep(workflowId, { name, type, config, position, autoConnect }) {
  return api("POST", `/workflows/${workflowId}/steps`, {
    type,
    name,
    position,
    config,
    ...(autoConnect ? { autoConnect: true } : {}),
  })
}

function stepPosition(index) {
  return { x: 120, y: 80 + index * 140 }
}

function delayStep(name, amount, unit, index) {
  return {
    name,
    type: "DELAY",
    config: { amount, unit },
    position: stepPosition(index),
  }
}

function emailStep(name, templateFilename, templateMapping, index) {
  return {
    name,
    type: "SEND_EMAIL",
    config: { templateId: templateId(templateMapping, templateFilename) },
    position: stepPosition(index),
  }
}

async function connectSteps(workflowId, fromStepId, toStepId, branch) {
  return api("POST", `/workflows/${workflowId}/transitions`, {
    fromStepId,
    toStepId,
    ...(branch ? { branch } : {}),
  })
}

/**
 * Workflow A:
 * DELAY 4h → email-02 → DELAY 2d → CONDITION topCompetitor → email-03 / fallback → DELAY 2d → email-04 → DELAY 3d → email-05
 * Parallel WAIT_FOR_EVENT levelstack_purchased exits early when purchase event fires.
 */
async function deployWorkflowA(templateMapping) {
  console.log("\n— Workflow A (nurture Emails 2–5) —")

  if (dryRun) {
    console.log("🔍 Would create workflow", EVENT_REPORT_READY)
    return null
  }

  const workflow = await createWorkflow({
    name: "LevelStack Nurture — Workflow A",
    eventName: EVENT_REPORT_READY,
  })
  const workflowId = workflow.id || workflow.workflow?.id
  if (!workflowId) throw new Error("Workflow A create returned no id")

  let i = 0
  const delay4h = await addStep(workflowId, delayStep("Wait 4 hours", 4, "hours", i++))
  const email02 = await addStep(workflowId, emailStep("Email 2 — Prospect", "email-02-prospect.html", templateMapping, i++))
  const delay2d = await addStep(workflowId, delayStep("Wait 2 days", 2, "days", i++))
  const condition = await addStep(workflowId, {
    name: "Has top competitor?",
    type: "CONDITION",
    config: {
      field: "contact.data.topCompetitor",
      operator: "is_not_empty",
    },
    position: stepPosition(i++),
  })
  const email03 = await addStep(workflowId, emailStep("Email 3 — Competitor", "email-03-competitor.html", templateMapping, i++))
  const email03fb = await addStep(
    workflowId,
    emailStep("Email 3 — Competitor fallback", "email-03-competitor-fallback.html", templateMapping, i++),
  )
  const delay2d2 = await addStep(workflowId, delayStep("Wait 2 days", 2, "days", i++))
  const email04 = await addStep(workflowId, emailStep("Email 4 — Finding", "email-04-finding.html", templateMapping, i++))
  const delay3d = await addStep(workflowId, delayStep("Wait 3 days", 3, "days", i++))
  const email05 = await addStep(workflowId, emailStep("Email 5 — SAP bridge", "email-05-sap-bridge.html", templateMapping, i++))
  const purchasedWait = await addStep(workflowId, {
    name: "Wait for purchase",
    type: "WAIT_FOR_EVENT",
    config: {
      eventName: EVENT_PURCHASED,
      timeout: 30 * 24 * 60 * 60,
    },
    position: stepPosition(i++),
  })
  const exitPurchased = await addStep(workflowId, {
    name: "Exit — purchased",
    type: "EXIT",
    config: { reason: "purchased" },
    position: stepPosition(i++),
  })

  const sid = (s) => s.id || s.step?.id || s.stepId

  const detail = await api("GET", `/workflows/${workflowId}`)
  const allSteps = detail.steps || detail.workflow?.steps || []
  const trigger = allSteps.find((s) => s.type === "TRIGGER")
  const triggerId = trigger?.id

  if (triggerId) {
    await connectSteps(workflowId, triggerId, sid(delay4h))
    await connectSteps(workflowId, sid(delay4h), sid(email02))
    await connectSteps(workflowId, sid(email02), sid(delay2d))
    await connectSteps(workflowId, sid(delay2d), sid(condition))
    await connectSteps(workflowId, sid(condition), sid(email03), "yes")
    await connectSteps(workflowId, sid(condition), sid(email03fb), "no")
    await connectSteps(workflowId, sid(email03), sid(delay2d2))
    await connectSteps(workflowId, sid(email03fb), sid(delay2d2))
    await connectSteps(workflowId, sid(delay2d2), sid(email04))
    await connectSteps(workflowId, sid(email04), sid(delay3d))
    await connectSteps(workflowId, sid(delay3d), sid(email05))
    await connectSteps(workflowId, sid(email02), sid(purchasedWait))
    await connectSteps(workflowId, sid(purchasedWait), sid(exitPurchased))
  } else {
    console.warn("⚠️  Could not resolve TRIGGER step — verify transitions in Plunk dashboard.")
  }

  await api("PATCH", `/workflows/${workflowId}`, { enabled: true })

  console.log(`✅ Workflow A → ${workflowId}`)
  return workflowId
}

/** Workflow B: W1 +1h → W2 +3d → W3 +5d → W4 +9d (cumulative from W1 per COPY_BANK) */
async function deployWorkflowB(templateMapping) {
  console.log("\n— Workflow B (SAP waitlist W1–W4) —")

  if (dryRun) {
    console.log("🔍 Would create workflow", EVENT_WAITLIST)
    return null
  }

  const workflow = await createWorkflow({
    name: "LevelStack SAP Waitlist — Workflow B",
    eventName: EVENT_WAITLIST,
  })
  const workflowId = workflow.id || workflow.workflow?.id
  if (!workflowId) throw new Error("Workflow B create returned no id")

  let i = 0
  const delay1h = await addStep(workflowId, delayStep("Wait 1 hour", 1, "hours", i++))
  const w1 = await addStep(
    workflowId,
    emailStep("Waitlist W1", "waitlist-w1-credit-locked.html", templateMapping, i++),
  )
  const delay2d = await addStep(workflowId, delayStep("Wait 2 days", 2, "days", i++))
  const w2 = await addStep(
    workflowId,
    emailStep("Waitlist W2", "waitlist-w2-grade-anatomy.html", templateMapping, i++),
  )
  const delay2d2 = await addStep(workflowId, delayStep("Wait 2 days", 2, "days", i++))
  const w3 = await addStep(
    workflowId,
    emailStep("Waitlist W3", "waitlist-w3-ditch-traditional-agencies.html", templateMapping, i++),
  )
  const delay4d = await addStep(workflowId, delayStep("Wait 4 days", 4, "days", i++))
  const w4 = await addStep(
    workflowId,
    emailStep("Waitlist W4", "waitlist-w4-cohort-update.html", templateMapping, i++),
  )

  const sid = (s) => s.id || s.step?.id || s.stepId
  const detail = await api("GET", `/workflows/${workflowId}`)
  const trigger = (detail.steps || detail.workflow?.steps || []).find((s) => s.type === "TRIGGER")
  if (trigger?.id) {
    await connectSteps(workflowId, trigger.id, sid(delay1h))
    await connectSteps(workflowId, sid(delay1h), sid(w1))
    await connectSteps(workflowId, sid(w1), sid(delay2d))
    await connectSteps(workflowId, sid(delay2d), sid(w2))
    await connectSteps(workflowId, sid(w2), sid(delay2d2))
    await connectSteps(workflowId, sid(delay2d2), sid(w3))
    await connectSteps(workflowId, sid(w3), sid(delay4d))
    await connectSteps(workflowId, sid(delay4d), sid(w4))
  }

  await api("PATCH", `/workflows/${workflowId}`, { enabled: true })

  console.log(`✅ Workflow B → ${workflowId}`)
  return workflowId
}

async function main() {
  if (!apiKey) {
    console.error("Missing PLUNK_SECRET_KEY. Use --from-local or set env.")
    process.exit(1)
  }

  const templateMapping = loadJson(templateIdsPath)
  const workflowMapping = loadJson(workflowIdsPath)

  console.log(`Plunk workflow deploy${dryRun ? " (dry run)" : ""}`)
  console.log(`API: ${workflowBase}`)

  const workflowAId = await deployWorkflowA(templateMapping)
  const workflowBId = await deployWorkflowB(templateMapping)

  if (!dryRun && (workflowAId || workflowBId)) {
    saveJson(workflowIdsPath, {
      ...workflowMapping,
      ...(workflowAId ? { workflow_a: workflowAId } : {}),
      ...(workflowBId ? { workflow_b: workflowBId } : {}),
      events: {
        report_ready: EVENT_REPORT_READY,
        purchased: EVENT_PURCHASED,
        waitlist_joined: EVENT_WAITLIST,
      },
    })
    console.log(`\nSaved workflow IDs → ${workflowIdsPath}`)
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
