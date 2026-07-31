import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import type { ReportTier } from "@/lib/levelstack-plans"

const KNOWN_TIERS = new Set<ReportTier>([
  "free_snapshot",
  "full_report",
  "strategy_call",
])

function isKnownTier(value: string | null | undefined): value is ReportTier {
  return Boolean(value && KNOWN_TIERS.has(value as ReportTier))
}

/**
 * Prefer DB `report_tier` for display gating so a full_report row never renders
 * locked free UI when JSON meta.reportTier is stale. Snapshot backup view
 * (`?view=snapshot`) keeps the free JSON tier unchanged.
 */
export function reconcileReportTierFromDb(
  reportJson: LevelstackReportJson,
  dbTier: string | null | undefined,
  options: { snapshotView?: boolean } = {},
): LevelstackReportJson {
  if (options.snapshotView) return reportJson
  if (!isKnownTier(dbTier)) return reportJson
  if (reportJson.meta.reportTier === dbTier) return reportJson

  return {
    ...reportJson,
    meta: {
      ...reportJson.meta,
      reportTier: dbTier,
    },
  }
}
