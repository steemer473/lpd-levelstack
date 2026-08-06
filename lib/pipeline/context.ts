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
  const location = marketLocationLabel(intake)
  // Free-intake placeholder — omit so UI can suppress National + General.
  if (
    intake.geoMarket === "national" &&
    !location &&
    intake.primaryService === "General business services"
  ) {
    return ""
  }
  const geo =
    intake.geoMarket === "local"
      ? "Local market"
      : intake.geoMarket === "regional"
        ? "Regional market"
        : "National market"
  return location
    ? `${geo} · ${location} · ${intake.primaryService}`
    : `${geo} · ${intake.primaryService}`
}
