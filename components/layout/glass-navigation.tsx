"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { SignOutButton } from "@/components/layout/sign-out-button"
import { buildReportResendSignInUrl } from "@/lib/auth/magic-link-callback"
import type { NavVariant } from "@/lib/nav-variant"
import { LEVELSTACK_UNLOCK_97_CTA } from "@/lib/reports/paid-owner-report-chrome"
import { cn } from "@/lib/utils"
import { getHubCartUrl, getHubPricingUrl } from "@/lib/urls"

type GlassNavigationProps = {
  showSignOut?: boolean
  productLabel?: string
  navVariant?: NavVariant
  reportId?: string
  /** Ready paid Action Roadmap id (paidOwnerFree nav CTA). */
  actionRoadmapReportId?: string
}

const navLinkClass = (active: boolean) =>
  cn(
    "text-sm font-medium transition-colors whitespace-nowrap",
    active
      ? "text-brand-blue font-semibold"
      : "text-muted-foreground hover:text-foreground",
  )

export function GlassNavigation({
  showSignOut = false,
  productLabel = "LevelStack",
  navVariant = "default",
  reportId,
  actionRoadmapReportId,
}: GlassNavigationProps) {
  const pathname = usePathname()
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollProgress(Math.min(window.scrollY / 300, 1))
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const bgOpacity = 0.05 + scrollProgress * 0.9
  const borderOpacity = 0.2 + scrollProgress * 0.2
  const isScrolled = scrollProgress > 0.1

  const isIntakeActive = pathname.startsWith("/intake")
  const unlockUrl = getHubCartUrl({
    reportId,
    source: "levelstack_report",
  })
  const resendUrl = reportId ? buildReportResendSignInUrl(reportId) : null
  const intakeUrl = reportId
    ? `/intake?from=upgrade&reportId=${reportId}`
    : "/intake"

  return (
    <nav
      role="navigation"
      aria-label="LevelStack"
      className={cn(
        "fixed top-0 z-50 w-full backdrop-blur-xl transition-all duration-300",
        isScrolled && "shadow-lg",
      )}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        borderBottom: `1px solid rgba(203, 213, 225, ${borderOpacity})`,
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-report items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href={getHubPricingUrl()}
          className="gradient-text shrink-0 text-lg font-bold transition-opacity hover:opacity-80 sm:text-xl"
        >
          Level Play Digital · {productLabel}
        </a>
        <ul className="flex min-w-0 items-center justify-end gap-3 sm:gap-4">
          {navVariant === "freeReport" ? (
            <>
              <li>
                <a
                  href={unlockUrl}
                  className="inline-flex items-center rounded-md bg-brand-orange px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:px-3 sm:text-sm"
                >
                  {LEVELSTACK_UNLOCK_97_CTA}
                </a>
              </li>
              <li>
                <a href="#action-roadmap-faqs" className={navLinkClass(false)}>
                  Questions
                </a>
              </li>
              {resendUrl ? (
                <li className="hidden sm:list-item">
                  <Link href={resendUrl} className={navLinkClass(false)}>
                    Get a new link
                  </Link>
                </li>
              ) : null}
            </>
          ) : navVariant === "paidOwnerFree" && actionRoadmapReportId ? (
            <>
              <li>
                <Link
                  href={`/reports/${actionRoadmapReportId}`}
                  className="inline-flex items-center rounded-md bg-brand-orange px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:px-3 sm:text-sm"
                >
                  View your Action Roadmap
                </Link>
              </li>
              <li>
                <a href="#action-roadmap-faqs" className={navLinkClass(false)}>
                  Questions
                </a>
              </li>
            </>
          ) : navVariant === "paidPendingIntake" ? (
            <>
              <li>
                <Link
                  href={intakeUrl}
                  className="inline-flex items-center rounded-md bg-brand-orange px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:px-3 sm:text-sm"
                >
                  Complete intake
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/" className={navLinkClass(pathname === "/")}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/intake" className={navLinkClass(isIntakeActive)}>
                  Intake
                </Link>
              </li>
              {showSignOut ? (
                <li>
                  <SignOutButton />
                </li>
              ) : null}
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}
