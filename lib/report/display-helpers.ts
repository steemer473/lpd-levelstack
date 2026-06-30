import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  ClipboardList,
  Globe,
  LayoutGrid,
  Search,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react"

import type { LevelstackReportJson, ReportSection } from "@/lib/pipeline/report-types"
import { PRODUCT_NAMES } from "@/lib/report/outcome-copy"
import { parseFindingDetail } from "@/lib/report/parse-finding-detail"

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

/** Short subtitle shown in dashboard sidebar/header (Option A design). */
export const REPORT_ASSESSMENT_SUBTITLE = "Digital Presence Assessment" as const

/** Headline under overall score on dashboard executive summary. */
export function readinessHeadline(score: number): string {
  if (score >= 80) return "Strong performance"
  if (score >= 70) return "Established presence"
  if (score >= 55) return "Needs attention"
  if (score >= 40) return "Early stage"
  return "At risk"
}

/** Three free-tier section cards on conversion hybrid executive summary. */
export const FREE_EXECUTIVE_SECTION_ORDER: { id: string; label: string }[] = [
  { id: "search_footprint", label: "Search footprint" },
  { id: "online_reputation", label: "Reputation" },
  { id: "digital_presence", label: "Digital presence" },
]

/** Six metric cards on Option A executive summary (excludes executive_summary tab). */
export const EXECUTIVE_METRIC_CARD_ORDER: { id: string; label: string }[] = [
  { id: "search_footprint", label: "Search footprint" },
  { id: "online_reputation", label: "Reputation" },
  { id: "digital_presence", label: "Digital presence" },
  { id: "revenue_funnel", label: "Revenue funnel" },
  { id: "competitive_context", label: "Competitive context" },
  { id: "action_plan", label: "Action plan" },
]

/** Short intro paragraph for Option A dashboard (first sentence max). */
export function executiveDashboardIntro(report: LevelstackReportJson): string {
  const first = report.executiveSummary.paragraphs[0]
  if (first) {
    const sentence = first.match(/^(.+?[.!?])(?:\s|$)/)?.[1]
    if (sentence) return sentence
  }
  const score = report.meta.overallScore
  if (score >= 70) {
    return "Your digital presence shows solid fundamentals with targeted opportunities to strengthen visibility and conversion."
  }
  if (score >= 55) {
    return "Your digital presence shows moderate performance with significant opportunities for improvement across key areas."
  }
  return "Your digital presence has gaps that may be costing you leads — prioritize the actions below to close them."
}

/** Editorial headline parts for conversion hybrid exec (free tier). */
export function executiveConversionHeadlineParts(report: LevelstackReportJson): {
  score: number
  pain: string
  market: string
} {
  const market = report.meta.marketLabel ?? "your market"
  const score = report.meta.overallScore
  let pain: string
  if (score < 55) {
    pain = "trust signals may be costing you leads"
  } else if (score < 70) {
    pain = "key gaps may be limiting your visibility"
  } else {
    pain = "targeted improvements could strengthen conversion"
  }
  return { score, pain, market }
}

const SECTION_SCORE_ACCENTS: Record<string, { bar: string; icon: string }> = {
  search_footprint: { bar: "#3182ce", icon: "bg-blue-50 text-blue-600" },
  online_reputation: { bar: "#5cb85c", icon: "bg-green-50 text-green-700" },
  digital_presence: { bar: "#8b5cf6", icon: "bg-violet-50 text-violet-700" },
  revenue_funnel: { bar: "#ef4444", icon: "bg-red-50 text-red-700" },
  competitive_context: { bar: "#0ea5e9", icon: "bg-sky-50 text-sky-700" },
  action_plan: { bar: "#f97316", icon: "bg-orange-50 text-orange-700" },
}

export function sectionScoreAccent(sectionId: string): { bar: string; icon: string } {
  return (
    SECTION_SCORE_ACCENTS[sectionId] ?? {
      bar: "#6b7280",
      icon: "bg-gray-50 text-gray-600",
    }
  )
}

export function planDisplayName(planId: string | null): string {
  if (planId === "levelstack-strategy-call" || planId === "levelstack-review-call") {
    return `LevelStack ${PRODUCT_NAMES.premium}`
  }
  if (planId === "levelstack-full-report" || planId === "levelstack-standard") {
    return `LevelStack ${PRODUCT_NAMES.paid}`
  }
  if (planId === "levelstack-free-snapshot") return `LevelStack ${PRODUCT_NAMES.free}`
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
  const normalized = severity.trim().toLowerCase()
  if (normalized === "critical" || normalized === "high" || normalized === "medium") {
    const kind = severityToFlag(normalized)
    if (kind === "critical") return normalized === "critical" ? "Critical" : "High"
    if (kind === "attention") return "Attention"
    return "Good"
  }
  if (normalized === "revenue risk") return "Revenue Risk"
  if (normalized === "visibility leak") return "Visibility Leak"
  if (normalized === "competitor advantage") return "Competitor Advantage"
  if (normalized === "low" || normalized === "good") return "Good"
  return severity
}

export function outcomeIconForCategory(category?: string): LucideIcon {
  const normalized = category?.trim().toLowerCase()
  if (normalized === "revenue risk") return AlertTriangle
  if (normalized === "visibility leak") return Search
  if (normalized === "competitor advantage") return Shield
  return Star
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
  { id: "executive_summary", label: "Executive Summary" },
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

type ReportFinding = ReportSection["findings"][number]

export function findingHeadlineForDisplay(finding: ReportFinding): string {
  return finding.headline?.trim() || finding.value
}

export function findingBulletsForDisplay(finding: ReportFinding): string[] {
  if (finding.bullets?.length) return finding.bullets

  const parsed = parseFindingDetail(finding.detail)
  if (!parsed) return [finding.detail]

  if (parsed.kind === "bullets") return parsed.items
  if (parsed.kind === "paragraphs") return parsed.paragraphs
  if (parsed.kind === "keyValue") return parsed.items.map((item) => `${item.key}: ${item.value}`)
  if (parsed.kind === "serp") {
    return parsed.items.map((item) => `#${item.position} ${item.title} (${item.url})`)
  }
  return [parsed.text]
}
