export type FreeSnapshotSubmitResult = {
  existingUser?: boolean
  reportId?: string
  signInUrl?: string
  redirectImmediately?: boolean
  /** Paid entitlement + ready Action Roadmap — dual CTA, not welcome-back / buy again. */
  branch?: "paid_owner_refresh" | string
  actionRoadmapReportId?: string
}

export type FreeSnapshotRedirectAction =
  | { type: "redirect_report"; reportId: string }
  | { type: "redirect_magic_link"; signInUrl: string }
  | { type: "welcome_back"; signInUrl?: string }
  | { type: "redirect_report_fallback"; reportId: string }
  | {
      type: "paid_owner_refresh"
      reportId: string
      actionRoadmapReportId: string
      signInUrl?: string
      redirectImmediately?: boolean
    }

export function resolveFreeSnapshotSubmitRedirect(
  result: FreeSnapshotSubmitResult,
): FreeSnapshotRedirectAction | null {
  if (
    result.branch === "paid_owner_refresh" &&
    result.reportId &&
    result.actionRoadmapReportId
  ) {
    return {
      type: "paid_owner_refresh",
      reportId: result.reportId,
      actionRoadmapReportId: result.actionRoadmapReportId,
      signInUrl: result.signInUrl,
      redirectImmediately: result.redirectImmediately,
    }
  }

  if (result.redirectImmediately && result.reportId) {
    return { type: "redirect_report", reportId: result.reportId }
  }

  if (!result.existingUser) {
    if (result.signInUrl) {
      return { type: "redirect_magic_link", signInUrl: result.signInUrl }
    }
    if (result.reportId) {
      return { type: "redirect_report_fallback", reportId: result.reportId }
    }
    return null
  }

  return { type: "welcome_back", signInUrl: result.signInUrl }
}
