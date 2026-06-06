import { env } from "@/env.mjs"

/** Local dev only — view /reports/:id without signing in (requires entitlement bypass). */
export function isDevReportPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" && env.LEVELSTACK_DEV_BYPASS_ENTITLEMENT
  )
}
