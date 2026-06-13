import type { LucideIcon } from "lucide-react"
import {
  ClipboardList,
  Globe,
  LayoutGrid,
  Search,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react"

import type { LevelstackReportJson, ReportSection } from "@/lib/pipeline/report-types"

/** Report + product brand colors — mirrors tokens/design-tokens.json (--lpd-*) */
export const LPD = {
  orange: "var(--lpd-orange)",
  blue: "var(--lpd-blue)",
  dark: "var(--lpd-dark)",
  red: "var(--lpd-severity-critical)",
  amber: "var(--lpd-severity-attention)",
  green: "var(--lpd-severity-good)",
} as const

export const REPORT_ASSESSMENT_TITLE =
  "DIGITAL PRESENCE & REVENUE FUNNEL ASSESSMENT" as const

export function planDisplayName(planId: string | null): string {
  if (planId === "levelstack-strategy-call" || planId === "levelstack-review-call") {
    return "LevelStack + Strategy Call"
  }
  if (planId === "levelstack-full-report" || planId === "levelstack-standard") {
    return "LevelStack Full Report"
  }
  if (planId === "levelstack-free-snapshot") return "LevelStack Free Snapshot"
  return "LevelStack Assessment"
}

export function readinessLabel(score: number): string {
  if (score >= 80) return "Strong"
  if (score >= 70) return "Established"
  if (score >= 55) return "Developing"
  if (score >= 40) return "Early"
  return "At risk"
}

export const TAB_ICONS: Record<string, LucideIcon> = {
  executive_summary: LayoutGrid,
  search_footprint: Search,
  online_reputation: Star,
  digital_presence: Globe,
  revenue_funnel: TrendingUp,
  competitive_context: Shield,
  action_plan: ClipboardList,
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
  if (status === "critical") return "bg-lpd-critical"
  if (status === "attention") return "bg-lpd-attention"
  return "bg-lpd-good"
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
  { id: "executive_summary", label: "Executive summary" },
  { id: "search_footprint", label: "Search footprint" },
  { id: "online_reputation", label: "Reputation" },
  { id: "digital_presence", label: "Digital presence" },
  { id: "revenue_funnel", label: "Revenue funnel" },
  { id: "competitive_context", label: "Competitive context" },
  { id: "action_plan", label: "Action plan" },
]

export const LOCKED_SECTION_LABELS: Record<string, string> = {
  revenue_funnel: "Revenue funnel diagnosis",
  competitive_context: "Competitive context snapshot",
  action_plan: "Full prioritized action plan",
}

export const PAID_TAB_IDS = new Set([
  "revenue_funnel",
  "competitive_context",
  "action_plan",
])
