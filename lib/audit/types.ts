export type SignalStatus = "pass" | "warning" | "fail" | "unavailable"

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
  if (status === "unavailable") return 0
  return 0
}

/** Standard US academic 13-point scale (A+ through D-, unmodified F). */
export const LETTER_GRADE_THRESHOLDS = [
  { min: 97, grade: "A+" },
  { min: 93, grade: "A" },
  { min: 90, grade: "A-" },
  { min: 87, grade: "B+" },
  { min: 83, grade: "B" },
  { min: 80, grade: "B-" },
  { min: 77, grade: "C+" },
  { min: 73, grade: "C" },
  { min: 70, grade: "C-" },
  { min: 67, grade: "D+" },
  { min: 63, grade: "D" },
  { min: 60, grade: "D-" },
] as const

export type LetterGrade = (typeof LETTER_GRADE_THRESHOLDS)[number]["grade"] | "F"

export function letterGradeFromScore(score: number): LetterGrade {
  const s = Number.isFinite(score) ? Math.round(score) : 0
  for (const { min, grade } of LETTER_GRADE_THRESHOLDS) {
    if (s >= min) return grade
  }
  return "F"
}
