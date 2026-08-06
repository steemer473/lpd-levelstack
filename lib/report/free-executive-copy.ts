/**
 * Single copy source for the free Visibility Snapshot executive summary.
 * Consumed by web, print, email topFinding, and CRM nurture.
 */

import type { AuditSignalResult } from "@/lib/audit/types"
import {
  FREE_TIER_SECTION_IDS,
  PIPELINE_STEPS,
} from "@/lib/pipeline/constants"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { PRODUCT_NAMES } from "@/lib/report/outcome-copy"

/** Diagnostic areas only — Action Plan is a deliverable, not a judgment area. */
export const DIAGNOSTIC_AREA_IDS = PIPELINE_STEPS.filter(
  (s) => s.id !== "action_plan",
).map((s) => s.id)

export type DiagnosticAreaCounts = {
  checked: number
  total: number
  unopened: number
}

export function diagnosticAreaCounts(): DiagnosticAreaCounts {
  const checked = FREE_TIER_SECTION_IDS.size
  const total = DIAGNOSTIC_AREA_IDS.length
  return {
    checked,
    total,
    unopened: total - checked,
  }
}

/** Assessment date pinned to Eastern so UTC evening runs stay on the same calendar day. */
export function formatAssessmentDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  })
}

export const FREE_KPI_LABELS = {
  score: "Score",
  grade: "Grade",
  checksFailed: "Checks failed",
  findings: "Findings",
} as const

export const FREE_SCORE_LABEL = "Free scan" as const

/** Never count Subdomain Exposure toward "what we verified" — it has never failed in production. */
export const NON_DISCRIMINATING_SIGNAL_LABELS = new Set(["Subdomain Exposure"])

export type FreeHeadlineState = "has_failures" | "clean_scan"

export type FreeExecutiveHeadline = {
  state: FreeHeadlineState
  businessName: string
  checked: number
  total: number
  unopened: number
  failedCount: number
  /** First sentence (scope + result). */
  lead: string
  /** Second sentence (unopened areas). */
  follow: string
  /** Full headline for plain-text surfaces. */
  full: string
}

function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return n === 1 ? singular : plural
}

export function freeExecutiveHeadline(
  report: LevelstackReportJson,
): FreeExecutiveHeadline {
  const { checked, total, unopened } = diagnosticAreaCounts()
  const businessName = report.meta.businessName.trim() || "this business"
  const failedCount = Math.max(0, report.meta.criticalCount ?? 0)
  const state: FreeHeadlineState =
    failedCount > 0 ? "has_failures" : "clean_scan"

  const lead =
    state === "has_failures"
      ? `We checked ${checked} of the ${total} areas prospects use to judge ${businessName} — and already found ${failedCount} ${pluralize(failedCount, "critical issue")}.`
      : `We checked ${checked} of the ${total} areas prospects use to judge ${businessName} — both came back clean.`

  const follow = `The ${unopened} areas we haven't opened yet are where reputation and revenue problems usually hide.`

  return {
    state,
    businessName,
    checked,
    total,
    unopened,
    failedCount,
    lead,
    follow,
    full: `${lead} ${follow}`,
  }
}

export type PriorityFindingVariantId =
  | "search_snippet_accuracy"
  | "social_platform_coverage"
  | "directory_presence"
  | "google_indexing"
  | "meta_og_completeness"
  | "name_collision"
  | "subdomain_exposure"
  | "generic_fail"

export type PriorityFinding = {
  variantId: PriorityFindingVariantId
  observation: string
  consequence: string
  /** Observation + consequence for single-slot surfaces. */
  fullText: string
  signalId?: string
  signalLabel?: string
}

const SIGNAL_ID_BY_LABEL: Record<string, string> = {
  "Google Indexing": "google_indexing",
  "Search Snippet Accuracy": "search_snippet_accuracy",
  "Meta & OG Completeness": "meta_og_completeness",
  "Social Platform Coverage": "social_platform_coverage",
  "Subdomain Exposure": "subdomain_exposure",
  "Directory Presence": "directory_presence",
  "Name Collision Score": "name_collision",
}

const VARIANT_PRIORITY: PriorityFindingVariantId[] = [
  "search_snippet_accuracy",
  "social_platform_coverage",
  "directory_presence",
  "google_indexing",
  "name_collision",
  "meta_og_completeness",
  "subdomain_exposure",
  "generic_fail",
]

function clipEvidence(value: string | undefined, max = 120): string {
  const trimmed = (value ?? "").replace(/\s+/g, " ").trim()
  if (!trimmed) return ""
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

function variantIdForSignal(
  idOrLabel: string,
): PriorityFindingVariantId {
  const id = SIGNAL_ID_BY_LABEL[idOrLabel] ?? idOrLabel
  if (
    id === "search_snippet_accuracy" ||
    id === "social_platform_coverage" ||
    id === "directory_presence" ||
    id === "google_indexing" ||
    id === "meta_og_completeness" ||
    id === "name_collision" ||
    id === "subdomain_exposure"
  ) {
    return id
  }
  return "generic_fail"
}

function buildVariantCopy(
  variantId: PriorityFindingVariantId,
  signal: Pick<AuditSignalResult, "finding" | "evidence" | "label">,
): Omit<PriorityFinding, "variantId" | "signalId" | "signalLabel"> {
  const evidence0 = clipEvidence(signal.evidence[0])
  const evidence1 = clipEvidence(signal.evidence[1])

  switch (variantId) {
    case "search_snippet_accuracy": {
      const observation =
        evidence0 && evidence1
          ? `Google is showing “${evidence0}” under your listing, while your site says “${evidence1}.”`
          : signal.finding ||
            "Google is showing messaging that differs from your live site."
      return {
        observation,
        consequence:
          "Prospects decide whether to trust you before they click — mismatched copy undercuts that decision.",
        fullText: `${observation} Prospects decide whether to trust you before they click — mismatched copy undercuts that decision.`,
      }
    }
    case "social_platform_coverage": {
      const observation =
        signal.finding ||
        "Major social profiles for your brand were not found in public search."
      return {
        observation,
        consequence:
          "When prospects look for proof you are active, empty results send them to a competitor who shows up.",
        fullText: `${observation} When prospects look for proof you are active, empty results send them to a competitor who shows up.`,
      }
    }
    case "directory_presence": {
      const observation =
        signal.finding ||
        "Your business is missing from several major directories prospects use to compare options."
      return {
        observation,
        consequence:
          "Buyers checking directories may assume you are less established than rivals who appear there.",
        fullText: `${observation} Buyers checking directories may assume you are less established than rivals who appear there.`,
      }
    }
    case "google_indexing": {
      const observation =
        signal.finding ||
        "Your primary domain does not appear prominently when searching your brand name."
      return {
        observation,
        consequence:
          "If Google does not surface your site for your own name, prospects may never reach the page you control.",
        fullText: `${observation} If Google does not surface your site for your own name, prospects may never reach the page you control.`,
      }
    }
    case "meta_og_completeness": {
      const raw = signal.finding?.trim() ?? ""
      const observation =
        !raw || /[✓✗]|\d+\/\d+\s+tags/i.test(raw)
          ? "Key title, description, or share tags are incomplete on your site."
          : raw
      return {
        observation,
        consequence:
          "Incomplete tags weaken how your link looks in search and when someone shares it.",
        fullText: `${observation} Incomplete tags weaken how your link looks in search and when someone shares it.`,
      }
    }
    case "name_collision": {
      const observation =
        signal.finding ||
        "Other entities compete for your brand name in search."
      return {
        observation,
        consequence:
          "Prospects searching your name may land on the wrong business before they ever see yours.",
        fullText: `${observation} Prospects searching your name may land on the wrong business before they ever see yours.`,
      }
    }
    case "subdomain_exposure": {
      const observation =
        signal.finding || "Indexed subdomains may be publicly visible."
      return {
        observation,
        consequence:
          "Unexpected public pages can confuse prospects or expose outdated content.",
        fullText: `${observation} Unexpected public pages can confuse prospects or expose outdated content.`,
      }
    }
    default: {
      const observation =
        signal.finding?.trim() ||
        "A public-presence check failed on this Visibility Snapshot."
      return {
        observation,
        consequence:
          "Unresolved public gaps shape what prospects conclude before they contact you.",
        fullText: `${observation} Unresolved public gaps shape what prospects conclude before they contact you.`,
      }
    }
  }
}

function priorityRank(variantId: PriorityFindingVariantId): number {
  const idx = VARIANT_PRIORITY.indexOf(variantId)
  return idx === -1 ? VARIANT_PRIORITY.length : idx
}

/** Build customer-facing priority finding from audit signals (assemble / email). */
export function buildPriorityFindingFromSignals(
  signals: AuditSignalResult[],
): PriorityFinding | null {
  const failed = signals.filter((s) => s.status === "fail")
  if (failed.length === 0) return null

  const ranked = [...failed].sort(
    (a, b) =>
      priorityRank(variantIdForSignal(a.id)) -
      priorityRank(variantIdForSignal(b.id)),
  )
  const signal = ranked[0]!
  const variantId = variantIdForSignal(signal.id)
  const copy = buildVariantCopy(variantId, signal)

  return {
    variantId,
    ...copy,
    signalId: signal.id,
    signalLabel: signal.label,
  }
}

type SignalRowLike = {
  label: string
  value: string
}

/** Rebuild priority finding from stored signalRows when full audit bundle is unavailable. */
export function buildPriorityFindingFromSignalRows(
  rows: SignalRowLike[] | undefined,
): PriorityFinding | null {
  if (!rows?.length) return null
  const failed = rows.filter((r) => r.value.toUpperCase() === "FAIL")
  if (failed.length === 0) return null

  const ranked = [...failed].sort(
    (a, b) =>
      priorityRank(variantIdForSignal(a.label)) -
      priorityRank(variantIdForSignal(b.label)),
  )
  const row = ranked[0]!
  const variantId = variantIdForSignal(row.label)
  const copy = buildVariantCopy(variantId, {
    finding: "",
    evidence: [],
    label: row.label,
  })

  return {
    variantId,
    ...copy,
    signalId: SIGNAL_ID_BY_LABEL[row.label],
    signalLabel: row.label,
  }
}

const POSITIVE_FINDING_PATTERN =
  /\brank(?:s|ed)?\s*#?1\b|\b#1\s+for\s+your\s+brand\b|\bno\s+other\s+domains\s+appeared\s+above\b|\bstrong\b|\bappears\s+distinct\b/i

const GENERIC_CRITICAL_FALLBACKS = new Set([
  "Review search footprint first.",
  "Review section findings for the highest-priority trust or conversion gaps.",
])

function isPositiveFindingCopy(text: string): boolean {
  return POSITIVE_FINDING_PATTERN.test(text)
}

/**
 * Resolve priority finding for display.
 * Order: failed signal rows → urgent customer findings → stored criticalIssue (if adverse).
 * Never promotes a positive rank result. Returns null on clean scans.
 */
export function resolvePriorityFinding(
  report: LevelstackReportJson,
  options?: {
    /** Precomputed from assemble-time signals when available. */
    fromSignals?: PriorityFinding | null
    urgentFinding?: string | null
  },
): PriorityFinding | null {
  if (options?.fromSignals) return options.fromSignals

  const fromRows = buildPriorityFindingFromSignalRows(report.signalRows)
  if (fromRows) return fromRows

  const urgent = options?.urgentFinding?.trim()
  if (
    urgent &&
    !GENERIC_CRITICAL_FALLBACKS.has(urgent) &&
    !isPositiveFindingCopy(urgent)
  ) {
    return {
      variantId: "generic_fail",
      observation: urgent,
      consequence:
        "Unresolved public gaps shape what prospects conclude before they contact you.",
      fullText: urgent,
    }
  }

  const stored = report.executiveSummary.criticalIssue?.trim()
  if (
    stored &&
    !GENERIC_CRITICAL_FALLBACKS.has(stored) &&
    !isPositiveFindingCopy(stored) &&
    (report.meta.criticalCount ?? 0) > 0
  ) {
    return {
      variantId: "generic_fail",
      observation: stored,
      consequence:
        "Unresolved public gaps shape what prospects conclude before they contact you.",
      fullText: stored,
    }
  }

  return null
}

/** Checks that passed and are worth listing under "What we verified". */
export function verifiedChecksList(
  rows: SignalRowLike[] | undefined,
): string[] {
  if (!rows?.length) return []
  return rows
    .filter(
      (r) =>
        r.value.toUpperCase() === "PASS" &&
        !NON_DISCRIMINATING_SIGNAL_LABELS.has(r.label),
    )
    .map((r) => r.label)
}

/** Customer-facing topFinding for email / CRM / nurture. */
export function customerFacingTopFinding(
  signals: AuditSignalResult[],
): string | undefined {
  const priority = buildPriorityFindingFromSignals(signals)
  if (priority) return priority.fullText

  const warning = signals.find((s) => s.status === "warning")
  if (!warning) return undefined

  const variantId = variantIdForSignal(warning.id)
  // Prefer observation-only for warnings — avoid "critical" framing on clean/fail-free scans.
  return buildVariantCopy(variantId, warning).observation
}

export function freeScoreBasisLine(report: LevelstackReportJson): string {
  const { checked, total } = diagnosticAreaCounts()
  const score = report.meta.overallScore
  const grade = report.meta.letterGrade
  return `${FREE_SCORE_LABEL}: ${score}/100 (${grade}) — based on ${checked} of ${total} diagnostic areas (Search footprint and Social & off-site).`
}

export const FREE_UPGRADE_MODULE = {
  leadLine: `Ready for the prioritized plan? Unlock your ${PRODUCT_NAMES.paid}.`,
  scopeLine: (counts: DiagnosticAreaCounts = diagnosticAreaCounts()) =>
    `This Visibility Snapshot opened ${counts.checked} of ${counts.total} diagnostic areas. The Action Plan is a separate deliverable.`,
  checksLine: (failCount: number, warnCount: number) => {
    if (failCount > 0) {
      return `${failCount} ${pluralize(failCount, "check")} failed on the free scan${warnCount > 0 ? `; ${warnCount} more ${pluralize(warnCount, "warning")} flagged` : ""}.`
    }
    if (warnCount > 0) {
      return `${warnCount} ${pluralize(warnCount, "warning")} on the free scan — the unopened areas are where reputation and revenue gaps usually hide.`
    }
    return `Both free areas came back clean. The unopened areas are where reputation and revenue gaps usually hide.`
  },
  creditNote:
    "The $97 assessment fee credits toward your first founding-rate month of SEO Automator Pro when an eligible slot opens (same email as purchase).",
  primaryCta: `Unlock ${PRODUCT_NAMES.paid} — $97`,
  secondaryCta: `Prefer a walkthrough? ${PRODUCT_NAMES.premium} — $297`,
  monitoringBridge:
    "Already planning to act on what you found? The technical foundation your rankings depend on needs ongoing attention — not just a one-time fix. SEO Automator Pro monitors your site continuously so you can see what changed and address it before visibility slips between audits.",
  monitoringCta: "Learn about SEO Automator Pro",
} as const

export const REPORT_SCORE_FOOTER =
  "Diagnostic only — LevelStack does not guarantee rankings or revenue outcomes." as const
