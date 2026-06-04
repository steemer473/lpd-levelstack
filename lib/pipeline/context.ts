import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { marketLocationLabel } from "@/lib/intake/location"

export type PipelineContext = {
  jobId: string
  reportId: string
  intakeId: string
  userId: string
  planId: string | null
  intake: LevelstackIntakeFormValues
}

export function marketLabelFromIntake(intake: LevelstackIntakeFormValues): string {
  const geo =
    intake.geoMarket === "local"
      ? "Local market"
      : intake.geoMarket === "regional"
        ? "Regional market"
        : "National market"
  const location = marketLocationLabel(intake)
  return location
    ? `${geo} · ${location} · ${intake.primaryService}`
    : `${geo} · ${intake.primaryService}`
}
