#!/usr/bin/env node
/**
 * Repair Plunk workflow transitions:
 * - Remove duplicate edges (same fromStepId + toStepId)
 * - Rebuild CONDITION step branches with yes/no + priority (fixes gates bypassing)
 *
 * Usage:
 *   node scripts/repair-plunk-workflow-transitions.mjs --from-local
 *   node scripts/repair-plunk-workflow-transitions.mjs --from-local --dry-run
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

/** Map condition step name → { yes: target step name, no: target step name } */
const CONDITION_BRANCHES = {
  "Workflow A": {
    "Has top competitor?": {
      yes: "Email 3 — Competitor",
      no: "Email 3 — Competitor fallback",
    },
  },
  "Workflow B": {
    "Credit eligible?": {
      yes: "Wait 1 hour",
      no: "Exit — not credit eligible",
    },
  },
  "Workflow C": {
    "Agency audience?": {
      yes: "Not credit eligible?",
      no: "Exit — not agency",
    },
    "Not credit eligible?": {
      yes: "Wait 1 hour",
      no: "Exit — credit eligible",
    },
  },
}

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

function stepByName(steps, name) {
  return steps.find((s) => s.name === name)
}

function dedupeTransitions(transitions) {
  const seen = new Set()
  const duplicates = []
  const keep = []

  for (const transition of transitions) {
    const key = `${transition.fromStepId}:${transition.toStepId}`
    if (seen.has(key)) {
      duplicates.push(transition)
    } else {
      seen.add(key)
      keep.push(transition)
    }
  }

  return { keep, duplicates }
}

async function deleteTransition(workflowId, transitionId) {
  if (dryRun) {
    console.log(`🔍 Would delete transition ${transitionId}`)
    return
  }
  await api("DELETE", `/workflows/${workflowId}/transitions/${transitionId}`)
}

async function createTransition(workflowId, fromStepId, toStepId, branch, priority) {
  if (dryRun) {
    console.log(`🔍 Would connect ${fromStepId.slice(0, 8)} → ${toStepId.slice(0, 8)} (${branch}, p${priority})`)
    return
  }
  await api("POST", `/workflows/${workflowId}/transitions`, {
    fromStepId,
    toStepId,
    branch,
    priority,
  })
}

async function repairWorkflow(workflowId, label) {
  console.log(`\n— ${label} (${workflowId}) —`)

  const detail = await api("GET", `/workflows/${workflowId}`)
  const steps = detail.steps || []
  const branchMap = CONDITION_BRANCHES[label] || {}

  let deleted = 0
  let rebuilt = 0

  const wasEnabled = detail.enabled ?? false
  if (wasEnabled && !dryRun) {
    await api("PATCH", `/workflows/${workflowId}`, { enabled: false })
    console.log("Disabled workflow for safe transition updates")
  }

  if (!dryRun) {
    try {
      const cancelled = await api("POST", `/workflows/${workflowId}/executions/cancel-all`)
      console.log(`Cancelled active executions (${cancelled?.cancelled ?? "?"})`)
    } catch (err) {
      console.warn(`⚠️  cancel-all: ${err.message}`)
    }
  }

  for (const step of steps) {
    const outgoing = step.outgoingTransitions || []
    if (outgoing.length === 0) continue

    if (step.type === "CONDITION" && branchMap[step.name]) {
      const targets = branchMap[step.name]
      const yesStep = stepByName(steps, targets.yes)
      const noStep = stepByName(steps, targets.no)

      if (!yesStep || !noStep) {
        console.warn(`⚠️  Missing branch targets for "${step.name}" — verify step names in dashboard`)
        continue
      }

      for (const transition of outgoing) {
        await deleteTransition(workflowId, transition.id)
        deleted += 1
      }

      await createTransition(workflowId, step.id, yesStep.id, "yes", 0)
      await createTransition(workflowId, step.id, noStep.id, "no", 1)
      rebuilt += 1
      console.log(`✅ Rebuilt branches for "${step.name}"`)
      continue
    }

    const { keep, duplicates } = dedupeTransitions(outgoing)
    if (duplicates.length === 0) continue

    for (const transition of duplicates) {
      await deleteTransition(workflowId, transition.id)
      deleted += 1
    }
    console.log(`✅ Deduped ${duplicates.length} edge(s) from "${step.name}" (${keep.length} kept)`)
  }

  if (wasEnabled && !dryRun) {
    await api("PATCH", `/workflows/${workflowId}`, { enabled: true })
    console.log("Re-enabled workflow")
  }

  return { deleted, rebuilt }
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

  console.log(`Plunk workflow transition repair${dryRun ? " (dry run)" : ""}`)
  console.log(`API: ${workflowBase}`)

  let totalDeleted = 0
  let totalRebuilt = 0
  for (const [label, id] of targets) {
    const result = await repairWorkflow(id, label)
    totalDeleted += result.deleted
    totalRebuilt += result.rebuilt
  }

  console.log(`\nDone. Deleted ${totalDeleted} transition(s), rebuilt ${totalRebuilt} condition step(s).`)
  if (!dryRun && totalRebuilt > 0) {
    console.log(
      "Re-fire sap_waitlist_joined / levelstack_report_ready for contacts whose executions were cancelled.",
    )
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
