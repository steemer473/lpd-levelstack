// Source: lpd-planning/COPY_BANK.md §3
// Placement 2/3 bodies live in outcome-copy.ts so free upgrade + locked gates stay in sync.

import {
  SAP_BRIDGE_PLACEMENT_3,
  UPGRADE_BANNER,
} from "@/lib/report/outcome-copy"

export type SapBridgePlacement = "freeLocked" | "fullActionPlan"

export const SAP_BRIDGE_COPY = {
  /** COPY_BANK §3 Placement 2 — Visibility Snapshot locked gates */
  freeLocked: {
    body: UPGRADE_BANNER.monitoringBridge,
    ctaLabel: UPGRADE_BANNER.monitoringCta,
  },
  /** COPY_BANK §3 Placement 3 — end of Action Plan */
  fullActionPlan: {
    body: SAP_BRIDGE_PLACEMENT_3.body,
    ctaLabel: SAP_BRIDGE_PLACEMENT_3.ctaLabel,
  },
} as const satisfies Record<SapBridgePlacement, { body: string; ctaLabel: string }>
