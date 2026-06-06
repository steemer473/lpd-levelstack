import type { CSSProperties } from "react"

import type { PartnerBranding } from "@/lib/partner/types"

export type { PartnerBranding }

/** Apply partner accent as CSS custom property override. */
export function partnerThemeStyle(
  branding: PartnerBranding | null | undefined,
): CSSProperties | undefined {
  if (!branding?.accentColorHex) return undefined
  return {
    ["--lpd-orange" as string]: branding.accentColorHex,
  }
}

export function partnerFooterLabel(branding: PartnerBranding | null | undefined): string {
  return branding?.companyName ?? "Level Play Digital"
}

export function isWhiteLabelReport(
  branding: PartnerBranding | null | undefined,
): boolean {
  return Boolean(branding?.companyName && !branding.companyName.includes("Level Play"))
}
