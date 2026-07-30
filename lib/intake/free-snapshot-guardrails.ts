/** Soft-reuse window for a ready free Visibility Snapshot (ms). */
export const FREE_SNAPSHOT_READY_COOLDOWN_MS = 24 * 60 * 60 * 1000

export type FreeSnapshotReportLite = {
  id: string
  status: string
  report_tier?: string | null
  created_at?: string | null
  intake_id?: string | null
}

export type FreeSnapshotGuardrailDecision =
  | { action: "proceed" }
  | {
      action: "reuse_in_progress"
      reportId: string
      intakeId: string | null
      message: string
    }
  | {
      action: "reuse_ready"
      reportId: string
      intakeId: string | null
      message: string
    }

const IN_PROGRESS_MESSAGE =
  "Your Visibility Snapshot is still generating. Opening your existing progress screen."

const READY_REUSE_MESSAGE =
  "You already have a recent Visibility Snapshot. Open it below, or run a new snapshot if your site has changed."

/**
 * Decide whether to create a new free report or reuse the latest free row.
 * Skipped when `forceRefresh` is true (explicit ?refresh=1).
 */
export function decideFreeSnapshotGuardrail(params: {
  latestFreeReport: FreeSnapshotReportLite | null
  forceRefresh: boolean
  nowMs?: number
  cooldownMs?: number
}): FreeSnapshotGuardrailDecision {
  const {
    latestFreeReport,
    forceRefresh,
    nowMs = Date.now(),
    cooldownMs = FREE_SNAPSHOT_READY_COOLDOWN_MS,
  } = params

  if (forceRefresh || !latestFreeReport) {
    return { action: "proceed" }
  }

  if (
    latestFreeReport.status === "pending" ||
    latestFreeReport.status === "generating"
  ) {
    return {
      action: "reuse_in_progress",
      reportId: latestFreeReport.id,
      intakeId: latestFreeReport.intake_id ?? null,
      message: IN_PROGRESS_MESSAGE,
    }
  }

  if (latestFreeReport.status === "ready") {
    const createdAt = latestFreeReport.created_at
      ? Date.parse(latestFreeReport.created_at)
      : Number.NaN
    const withinCooldown =
      Number.isFinite(createdAt) && nowMs - createdAt < cooldownMs

    if (withinCooldown) {
      return {
        action: "reuse_ready",
        reportId: latestFreeReport.id,
        intakeId: latestFreeReport.intake_id ?? null,
        message: READY_REUSE_MESSAGE,
      }
    }
  }

  return { action: "proceed" }
}
