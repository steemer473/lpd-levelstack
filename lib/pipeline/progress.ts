import {
  FREE_TIER_OPERATION_IDS,
  FULL_TIER_OPERATION_IDS,
  PIPELINE_STEPS,
  type PipelineStepId,
} from "@/lib/pipeline/constants"
import type { ReportTier } from "@/lib/levelstack-plans"

export function pipelineStepsForTier(reportTier: ReportTier) {
  if (reportTier === "free_snapshot") {
    return PIPELINE_STEPS.filter((s) =>
      ["search_footprint", "online_reputation", "digital_presence"].includes(s.id),
    )
  }
  return PIPELINE_STEPS
}

export function operationCountForTier(reportTier: ReportTier): number {
  return reportTier === "free_snapshot"
    ? FREE_TIER_OPERATION_IDS.length
    : FULL_TIER_OPERATION_IDS.length
}

/** Map completed audit-op count to section-based progress for the UI. */
export function sectionProgressFromOps(
  completedOpCount: number,
  reportTier: ReportTier,
): {
  currentStep: PipelineStepId | null
  completedSteps: PipelineStepId[]
} {
  const uiSteps = pipelineStepsForTier(reportTier)
  const totalOps = operationCountForTier(reportTier)

  if (uiSteps.length === 0) {
    return { currentStep: null, completedSteps: [] }
  }

  const clamped = Math.min(Math.max(completedOpCount, 0), totalOps)
  const sectionIndex = Math.min(
    Math.floor((clamped / totalOps) * uiSteps.length),
    uiSteps.length - 1,
  )

  const completedSteps = uiSteps.slice(0, sectionIndex).map((s) => s.id)
  const currentStep = uiSteps[sectionIndex]?.id ?? null

  return { currentStep, completedSteps }
}

/** Progress percent during audit ops (0–85); synthesis uses 85–99. */
export function auditProgressPercent(
  completedOpCount: number,
  reportTier: ReportTier,
): number {
  const totalOps = operationCountForTier(reportTier)
  if (totalOps === 0) return 0
  return Math.round((Math.min(completedOpCount, totalOps) / totalOps) * 85)
}
