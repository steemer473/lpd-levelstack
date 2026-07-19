import type {
  ReportActionItem,
  ReportFinding,
} from "@/lib/pipeline/report-types"
import {
  CONFIDENCE_METHODOLOGY_REF,
  type RecommendationObject,
  type RecommendationPriority,
} from "@/lib/pipeline/recommendation-types"

const STUB_CONFIDENCE_RATIONALE =
  "Migrated stub; awaiting P2-4 evidence population."

/** Map finding severity → Roadmap priority (distinct from severity chrome). */
export function priorityFromSeverity(
  severity: ReportFinding["severity"],
): RecommendationPriority {
  switch (severity) {
    case "critical":
      return "P0"
    case "high":
      return "P1"
    case "medium":
      return "P2"
    default:
      return "P3"
  }
}

function slugPart(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40)
}

function mapWhoToOwnerRole(
  who: string,
): RecommendationObject["owner"]["role"] {
  const w = who.toLowerCase()
  if (/you|owner|founder/.test(w)) return "business_owner"
  if (/market/.test(w)) return "marketing"
  if (/ops|operations/.test(w)) return "ops"
  if (/freelancer|contractor/.test(w)) return "freelancer"
  if (/agency|partner/.test(w)) return "agency"
  return "unassigned"
}

export type MapFindingOptions = {
  sectionId: string
  id?: string
}

/**
 * Skeleton Recommendation from a Finding alone.
 * Not wired into production assembly — for tests and future P2-4 dual-write.
 */
export function mapFindingToRecommendationSkeleton(
  finding: ReportFinding,
  options: MapFindingOptions,
): RecommendationObject {
  const id =
    options.id ??
    `rec_${slugPart(options.sectionId)}_${slugPart(finding.label) || "finding"}`

  return {
    id,
    title: finding.headline?.trim() || finding.label,
    summary: finding.detail || finding.value,
    evidence: [],
    confidence: {
      band: "Low",
      rationale: STUB_CONFIDENCE_RATIONALE,
      methodologyRef: CONFIDENCE_METHODOLOGY_REF,
    },
    priority: priorityFromSeverity(finding.severity),
    roi: {
      kind: "unknown",
      rangeLabel: "Not estimated",
    },
    dependencies: { recommendationIds: [] },
    owner: { role: "unassigned" },
    automatability: { automatable: false },
    artifact: { kind: "none" },
    urgency: "Review when capacity allows.",
    consequenceOfInaction: "Gap may persist until addressed.",
    sourceSectionId: options.sectionId,
  }
}

export type MapActionItemOptions = {
  sectionId?: string
  id?: string
  /** Optional finding used for priority / title fallback. */
  finding?: ReportFinding
  /** Resolved dependency recommendation IDs (not findingRef text). */
  dependencyIds?: string[]
}

/**
 * Map a legacy ActionItem (+ optional Finding) → Recommendation Object.
 * Not called from production assembly yet (P2-4).
 */
export function mapActionItemToRecommendation(
  item: ReportActionItem,
  options: MapActionItemOptions = {},
): RecommendationObject {
  const finding = options.finding
  const sectionId = options.sectionId ?? "action_plan"
  const base = finding
    ? mapFindingToRecommendationSkeleton(finding, {
        sectionId,
        id: options.id,
      })
    : null

  const id =
    options.id ??
    base?.id ??
    `rec_${slugPart(sectionId)}_${slugPart(item.task) || "action"}`

  return {
    id,
    title: item.task,
    summary: item.sub?.trim() || finding?.detail || finding?.value || item.task,
    evidence: [],
    confidence: {
      band: "Low",
      rationale: STUB_CONFIDENCE_RATIONALE,
      methodologyRef: CONFIDENCE_METHODOLOGY_REF,
    },
    priority: finding
      ? priorityFromSeverity(finding.severity)
      : base?.priority ?? "P2",
    roi: {
      kind: "unknown",
      rangeLabel: "Not estimated",
      notes: item.marketToll || item.coreMetric || undefined,
    },
    dependencies: {
      recommendationIds: options.dependencyIds ?? [],
    },
    owner: { role: mapWhoToOwnerRole(item.who) },
    automatability: {
      automatable: Boolean(item.automatorFlag),
      lpdProduct: item.automatorProduct,
    },
    artifact: item.artifact?.trim()
      ? { kind: "checklist", content: item.artifact }
      : { kind: "none" },
    urgency: "Review when capacity allows.",
    consequenceOfInaction: "Gap may persist until addressed.",
    sourceSectionId: sectionId,
    effortHint: item.time,
  }
}
