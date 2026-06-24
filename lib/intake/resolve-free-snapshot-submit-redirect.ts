export type FreeSnapshotSubmitResult = {
  existingUser?: boolean
  reportId?: string
  signInUrl?: string
  redirectImmediately?: boolean
}

export type FreeSnapshotRedirectAction =
  | { type: "redirect_report"; reportId: string }
  | { type: "redirect_magic_link"; signInUrl: string }
  | { type: "welcome_back"; signInUrl?: string }
  | { type: "redirect_report_fallback"; reportId: string }

export function resolveFreeSnapshotSubmitRedirect(
  result: FreeSnapshotSubmitResult,
): FreeSnapshotRedirectAction | null {
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
