import type { RecommendationObject } from "@/lib/pipeline/recommendation-types"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

const PRIORITY_ORDER: Record<RecommendationObject["priority"], number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
}

export type RoadmapBucketKey = "week" | "month" | "quarter"

export type RoadmapBuckets = {
  week: RecommendationObject[]
  month: RecommendationObject[]
  quarter: RecommendationObject[]
}

export const OWNER_ROLE_LABELS: Record<
  RecommendationObject["owner"]["role"],
  string
> = {
  business_owner: "You",
  marketing: "Marketing",
  ops: "Ops",
  freelancer: "Freelancer",
  agency: "Agency",
  unassigned: "Unassigned",
}

export function hasRecommendations(
  report: Pick<LevelstackReportJson, "recommendations">,
): boolean {
  return (report.recommendations?.length ?? 0) > 0
}

export function sortRecommendations(
  recommendations: RecommendationObject[],
): RecommendationObject[] {
  return [...recommendations].sort((a, b) => {
    const byPriority =
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (byPriority !== 0) return byPriority
    return a.id.localeCompare(b.id)
  })
}

/** Bucket by priority: P0 → week, P1 → month, P2+P3 → quarter. */
export function bucketRecommendations(
  recommendations: RecommendationObject[],
): RoadmapBuckets {
  const sorted = sortRecommendations(recommendations)
  const buckets: RoadmapBuckets = { week: [], month: [], quarter: [] }
  for (const rec of sorted) {
    if (rec.priority === "P0") buckets.week.push(rec)
    else if (rec.priority === "P1") buckets.month.push(rec)
    else buckets.quarter.push(rec)
  }
  return buckets
}

export function roadmapBucketsFromReport(
  report: Pick<LevelstackReportJson, "recommendations">,
): RoadmapBuckets | null {
  if (!hasRecommendations(report)) return null
  return bucketRecommendations(report.recommendations!)
}

/** Top-N teasers for free tier (OD-5 Option B). Titles only at call sites. */
export function teaserRecommendations(
  report: Pick<LevelstackReportJson, "recommendations" | "actionPlan" | "meta">,
  n = 3,
): { titles: string[]; summaries: (string | undefined)[]; count: number } {
  if (hasRecommendations(report)) {
    const sorted = sortRecommendations(report.recommendations!)
    const slice = sorted.slice(0, n)
    return {
      titles: slice.map((r) => r.title),
      summaries: slice.map((r) => r.summary),
      count:
        report.meta.teaserActionCount ??
        report.recommendations!.length,
    }
  }

  const week = report.actionPlan.thisWeek.slice(0, n)
  const total =
    report.meta.teaserActionCount ??
    report.actionPlan.thisWeek.length +
      report.actionPlan.thisMonth.length +
      report.actionPlan.thisQuarter.length

  return {
    titles: week.map((i) => i.task),
    summaries: week.map((i) => i.sub),
    count: total,
  }
}

export function ownerRoleLabel(
  role: RecommendationObject["owner"]["role"],
): string {
  return OWNER_ROLE_LABELS[role] ?? role
}

/** Paid exec priority table: P0 then P1 when recommendations present. */
export function priorityActionsFromReport(
  report: Pick<LevelstackReportJson, "recommendations" | "actionPlan">,
): Array<{
  title: string
  summary?: string
  priority: string
  effortHint?: string
  impactLabel?: string
}> {
  if (hasRecommendations(report)) {
    const sorted = sortRecommendations(report.recommendations!).filter(
      (r) => r.priority === "P0" || r.priority === "P1",
    )
    return sorted.map((r) => ({
      title: r.title,
      summary: r.summary,
      priority: r.priority,
      effortHint: r.effortHint,
      impactLabel: r.roi.rangeLabel,
    }))
  }

  return report.actionPlan.thisWeek.map((item) => ({
    title: item.task,
    summary: item.sub,
    priority: "P0",
    effortHint: item.time,
  }))
}
