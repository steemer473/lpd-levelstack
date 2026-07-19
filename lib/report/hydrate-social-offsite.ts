import type {
  LevelstackReportJson,
  ReportFinding,
  ReportSection,
} from "@/lib/pipeline/report-types"

const SOCIAL_FINDING_PATTERN =
  /linkedin|facebook|instagram|twitter|x\.com|social|youtube|tiktok/i

/**
 * Ensure Social & off-site is present for display when older paid JSON omitted it.
 * Prefer free snapshot backup; else lift social-like findings from digital_presence.
 */
export function hydrateMissingSocialOffsite(
  report: LevelstackReportJson,
  freeSnapshot?: LevelstackReportJson | null,
): LevelstackReportJson {
  if (report.sections.some((s) => s.id === "social_offsite")) {
    return report
  }

  const fromFree = freeSnapshot?.sections.find((s) => s.id === "social_offsite")
  if (fromFree) {
    return insertSocialSection(report, fromFree)
  }

  const synthesized = synthesizeSocialFromDigitalPresence(report)
  if (synthesized) {
    return insertSocialSection(report, synthesized)
  }

  return report
}

export function sectionMissingFromReport(
  report: LevelstackReportJson,
  sectionId: string,
): boolean {
  return !report.sections.some((s) => s.id === sectionId)
}

function insertSocialSection(
  report: LevelstackReportJson,
  social: ReportSection,
): LevelstackReportJson {
  const searchIdx = report.sections.findIndex((s) => s.id === "search_footprint")
  const sections = [...report.sections]
  const insertAt = searchIdx >= 0 ? searchIdx + 1 : 0
  sections.splice(insertAt, 0, {
    ...social,
    id: "social_offsite",
    label: social.label || "Social & off-site presence",
  })
  return { ...report, sections }
}

function synthesizeSocialFromDigitalPresence(
  report: LevelstackReportJson,
): ReportSection | null {
  const digital = report.sections.find((s) => s.id === "digital_presence")
  if (!digital?.findings.length) return null

  const socialFindings = digital.findings.filter((f) =>
    SOCIAL_FINDING_PATTERN.test(`${f.label} ${f.value} ${f.detail}`),
  )
  if (socialFindings.length === 0) return null

  return {
    id: "social_offsite",
    label: "Social & off-site presence",
    status: digital.status,
    score: digital.score,
    findings: socialFindings.map(
      (f): ReportFinding => ({
        ...f,
      }),
    ),
  }
}

/**
 * Soft guarantee after paid synthesis: if social_offsite vanished, restore baseline.
 */
export function ensureSocialOffsiteSection(
  sections: ReportSection[],
  baselineSections: ReportSection[],
): ReportSection[] {
  if (sections.some((s) => s.id === "social_offsite")) return sections
  const baseline = baselineSections.find((s) => s.id === "social_offsite")
  if (!baseline) return sections

  const searchIdx = sections.findIndex((s) => s.id === "search_footprint")
  const next = [...sections]
  const insertAt = searchIdx >= 0 ? searchIdx + 1 : 0
  next.splice(insertAt, 0, baseline)
  return next
}
