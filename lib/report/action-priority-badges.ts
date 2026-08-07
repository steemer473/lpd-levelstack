import type { RecommendationObject } from "@/lib/pipeline/recommendation-types"
import type { RoadmapBucketKey } from "@/lib/report/roadmap-from-recommendations"

export type BadgeLevel = "high" | "medium" | "low"

export type ActionPriorityBadges = {
  impact: BadgeLevel
  effort: BadgeLevel
  /** Display code shown in Priority column / chip (P0–P2 for buckets, P0–P3 for recommendations). */
  priorityCode: string
}

const HOUR_RE = /(\d+(?:\.\d+)?)\s*(?:–|-|to)?\s*(\d+(?:\.\d+)?)?\s*(h|hr|hrs|hour|hours)\b/i
const MIN_RE = /(\d+(?:\.\d+)?)\s*(?:–|-|to)?\s*(\d+(?:\.\d+)?)?\s*(m|min|mins|minute|minutes)\b/i

/** Upper bound of a duration range in approximate hours, or null if unparseable. */
function upperBoundHours(hint: string): number | null {
  const hourMatch = hint.match(HOUR_RE)
  if (hourMatch) {
    const a = Number(hourMatch[1])
    const b = hourMatch[2] ? Number(hourMatch[2]) : a
    if (Number.isFinite(a) && Number.isFinite(b)) return Math.max(a, b)
  }
  const minMatch = hint.match(MIN_RE)
  if (minMatch) {
    const a = Number(minMatch[1])
    const b = minMatch[2] ? Number(minMatch[2]) : a
    if (Number.isFinite(a) && Number.isFinite(b)) return Math.max(a, b) / 60
  }
  return null
}

export function impactLevelFromLabel(label?: string | null): BadgeLevel {
  if (!label?.trim()) return "medium"
  const normalized = label.trim().toLowerCase()
  if (normalized.includes("high") || normalized === "h") return "high"
  if (
    normalized.includes("moderate") ||
    normalized.includes("medium") ||
    normalized === "m"
  ) {
    return "medium"
  }
  if (normalized.includes("low") || normalized === "l") return "low"
  return "medium"
}

/**
 * Map a free-text effort / time hint to a badge level.
 * ≤1h → low, ≤3h → medium, else → high. Unparseable → medium.
 */
export function effortLevelFromHint(hint?: string | null): BadgeLevel {
  if (!hint?.trim()) return "medium"
  const hours = upperBoundHours(hint)
  if (hours == null) return "medium"
  if (hours <= 1) return "low"
  if (hours <= 3) return "medium"
  return "high"
}

export function priorityCodeForBucket(bucket: RoadmapBucketKey): string {
  if (bucket === "week") return "P0"
  if (bucket === "month") return "P1"
  return "P2"
}

/** Default impact when legacy action items have no ROI label: week = high, else medium. */
function defaultImpactForBucket(bucket: RoadmapBucketKey): BadgeLevel {
  return bucket === "week" ? "high" : "medium"
}

export function badgesForActionItem(args: {
  bucket: RoadmapBucketKey
  time: string
  impactLabel?: string | null
}): ActionPriorityBadges {
  return {
    impact: args.impactLabel?.trim()
      ? impactLevelFromLabel(args.impactLabel)
      : defaultImpactForBucket(args.bucket),
    effort: effortLevelFromHint(args.time),
    priorityCode: priorityCodeForBucket(args.bucket),
  }
}

export function badgesForRecommendation(
  rec: Pick<RecommendationObject, "priority" | "effortHint" | "roi">,
): ActionPriorityBadges {
  return {
    impact: impactLevelFromLabel(rec.roi.rangeLabel),
    effort: effortLevelFromHint(rec.effortHint),
    priorityCode: rec.priority,
  }
}

/** Exec Priority actions row: legacy week items without impactLabel default to high. */
export function badgesForPriorityAction(item: {
  priority: string
  effortHint?: string
  impactLabel?: string
}): { impact: BadgeLevel; effort: BadgeLevel; priorityCode: string } {
  return {
    impact: item.impactLabel?.trim()
      ? impactLevelFromLabel(item.impactLabel)
      : item.priority === "P0"
        ? "high"
        : "medium",
    effort: effortLevelFromHint(item.effortHint),
    priorityCode: item.priority,
  }
}
