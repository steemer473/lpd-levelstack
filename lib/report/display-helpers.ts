import type { LevelstackReportJson, ReportSection } from "@/lib/pipeline/report-types"

export const LPD = {
  orange: "#FF6633",
  blue: "#00D4F5",
  dark: "#090E18",
  red: "#E24B4A",
  amber: "#EF9F27",
  green: "#639922",
} as const

export function planDisplayName(planId: string | null): string {
  if (planId === "levelstack-review-call") return "LevelStack + Review Call"
  if (planId === "levelstack-standard") return "LevelStack Standard"
  return "LevelStack"
}

export function severityToFlag(severity: string): "critical" | "attention" | "good" {
  if (severity === "critical" || severity === "high") return "critical"
  if (severity === "medium") return "attention"
  return "good"
}

export function flagLabel(severity: string): string {
  const kind = severityToFlag(severity)
  if (kind === "critical") return severity === "critical" ? "Critical" : "High"
  if (kind === "attention") return "Attention"
  return "Good"
}

export function sectionDotClass(status: ReportSection["status"]): string {
  if (status === "critical") return "bg-[#E24B4A]"
  if (status === "attention") return "bg-[#EF9F27]"
  return "bg-[#639922]"
}

export function sectionStatusBadge(section: ReportSection): string {
  if (section.id === "revenue_funnel") {
    return `Funnel readiness: ${section.score}%`
  }
  if (section.id === "action_plan") {
    const total =
      (section.findings.length > 0 ? section.findings.length : 0)
    return `${total > 0 ? total : "Prioritized"} items`
  }
  if (section.id === "competitive_context") {
    return `${section.status === "good" ? "1 strength" : "Gaps identified"}`
  }

  const critical = section.findings.filter((f) => f.severity === "critical").length
  const high = section.findings.filter((f) => f.severity === "high").length
  if (critical > 0 && high > 0) {
    return `${critical} critical · ${high} high`
  }
  if (critical > 0) {
    return `${critical} critical issue${critical === 1 ? "" : "s"}`
  }
  if (high > 0) {
    return `${high} high priority`
  }
  return `${section.findings.length} finding${section.findings.length === 1 ? "" : "s"}`
}

export function scoreBarColor(score: number): string {
  if (score < 55) return LPD.red
  if (score < 75) return LPD.amber
  return LPD.green
}

export function biggestProblemSections(
  sections: ReportSection[],
  limit = 3,
): ReportSection[] {
  return [...sections]
    .filter((s) => s.id !== "action_plan")
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
}

export function priorityBreakdown(meta: LevelstackReportJson["meta"]) {
  return [
    { label: "Critical", count: meta.criticalCount, color: LPD.red },
    { label: "High", count: meta.highCount, color: LPD.amber },
    { label: "Medium", count: meta.mediumCount, color: LPD.amber },
    { label: "Low", count: meta.lowCount, color: LPD.green },
  ]
}

export const SECTION_TAB_ORDER: { id: string; label: string }[] = [
  { id: "search_footprint", label: "Search footprint" },
  { id: "online_reputation", label: "Reputation" },
  { id: "digital_presence", label: "Digital presence" },
  { id: "revenue_funnel", label: "Revenue funnel" },
  { id: "competitive_context", label: "Competitive context" },
  { id: "action_plan", label: "Action plan" },
]
