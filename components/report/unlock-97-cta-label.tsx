import {
  LEVELSTACK_UNLOCK_97_CTA,
  LEVELSTACK_UNLOCK_97_CTA_MOBILE,
} from "@/lib/reports/paid-owner-report-chrome"

/**
 * Responsive Unlock CTA label: short on mobile, full from `md` up.
 * Hidden span uses `display: none` so assistive tech reads the visible label only.
 */
export function Unlock97CtaLabel({
  mobileBreakpoint = "md",
}: {
  /** Tailwind breakpoint where the full label appears. */
  mobileBreakpoint?: "sm" | "md"
}) {
  const mobileClass =
    mobileBreakpoint === "sm" ? "sm:hidden" : "md:hidden"
  const desktopClass =
    mobileBreakpoint === "sm" ? "hidden sm:inline" : "hidden md:inline"

  return (
    <>
      <span className={mobileClass}>{LEVELSTACK_UNLOCK_97_CTA_MOBILE}</span>
      <span className={desktopClass}>{LEVELSTACK_UNLOCK_97_CTA}</span>
    </>
  )
}
