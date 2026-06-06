export type SignalStatus = "pass" | "warning" | "fail"

export type AuditSignalResult = {
  id: string
  label: string
  status: SignalStatus
  finding: string
  evidence: string[]
  tier: "free" | "paid"
}

export type InsightSeverity = "low" | "medium" | "high"

export type AuditInsight = {
  id: string
  label: string
  severity: InsightSeverity
  summary: string
  details: string[]
  remediation?: string[]
}

export type AuditScoreBundle = {
  signals: AuditSignalResult[]
  insights: AuditInsight[]
  overallScore: number
  letterGrade: string
}

export const SIGNAL_WEIGHTS: Record<string, number> = {
  google_indexing: 15,
  meta_og_completeness: 10,
  search_snippet_accuracy: 10,
  social_platform_coverage: 15,
  directory_presence: 10,
  third_party_mentions: 10,
  name_collision: 10,
  subdomain_exposure: 10,
  infrastructure_leakage: 10,
  positioning_consistency: 10,
}

export function statusToPercent(status: SignalStatus): number {
  if (status === "pass") return 100
  if (status === "warning") return 50
  return 0
}

export function letterGradeFromScore(score: number): string {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}
