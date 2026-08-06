"use client"

import { Lock, Menu } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useState } from "react"

import { SignOutButton } from "@/components/layout/sign-out-button"
import { useReportMobileMenu } from "@/components/report/report-mobile-menu-context"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { buildReportResendSignInUrl } from "@/lib/auth/magic-link-callback"
import type { NavVariant } from "@/lib/nav-variant"
import { TAB_ICONS } from "@/lib/report/display-helpers"
import {
  LEVELSTACK_UNLOCK_97_CTA,
  LEVELSTACK_UNLOCK_97_CTA_MOBILE,
} from "@/lib/reports/paid-owner-report-chrome"
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

const mobileNavLinkClass =
  "ls-glass-nav-item flex min-h-11 w-full items-center px-3 py-2.5 text-sm font-medium text-white/75"

const mobileSectionLinkClass =
  "ls-glass-nav-item flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-white/75"

const primaryCtaClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-orange px-3 py-2.5 text-center text-sm font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90 md:w-auto md:min-h-0 md:px-3 md:py-1.5 md:text-sm sm:px-3"

function GlassNavList({ children }: { children: React.ReactNode[] }) {
  const items = children.filter(Boolean)
  return <div className="flex flex-col gap-1.5">{items}</div>
}

export function GlassNavigation({
  showSignOut = false,
  productLabel = "LevelStack",
  navVariant = "default",
  reportId,
  actionRoadmapReportId,
}: GlassNavigationProps) {
  const pathname = usePathname()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuId = useId()
  const { registration } = useReportMobileMenu()

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

  const closeMobile = () => setMobileOpen(false)

  const desktopLinks = (() => {
    if (navVariant === "freeReport") {
      return (
        <>
          <li>
            <a
              href={unlockUrl}
              className={cn(
                primaryCtaClass,
                "w-auto px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm",
              )}
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
      )
    }
    if (navVariant === "paidOwnerFree" && actionRoadmapReportId) {
      return (
        <>
          <li>
            <Link
              href={`/reports/${actionRoadmapReportId}`}
              className={cn(
                primaryCtaClass,
                "w-auto px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm",
              )}
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
      )
    }
    if (navVariant === "paidPendingIntake") {
      return (
        <li>
          <Link
            href={intakeUrl}
            className={cn(
              primaryCtaClass,
              "w-auto px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm",
            )}
          >
            Complete intake
          </Link>
        </li>
      )
    }
    return (
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
    )
  })()

  const primaryCta = (() => {
    if (navVariant === "freeReport") {
      return (
        <a href={unlockUrl} className={primaryCtaClass} onClick={closeMobile}>
          {LEVELSTACK_UNLOCK_97_CTA_MOBILE}
        </a>
      )
    }
    if (navVariant === "paidOwnerFree" && actionRoadmapReportId) {
      return (
        <Link
          href={`/reports/${actionRoadmapReportId}`}
          className={primaryCtaClass}
          onClick={closeMobile}
        >
          View your Action Roadmap
        </Link>
      )
    }
    if (navVariant === "paidPendingIntake") {
      return (
        <Link href={intakeUrl} className={primaryCtaClass} onClick={closeMobile}>
          Complete intake
        </Link>
      )
    }
    return null
  })()

  const topNavSecondaryItems: React.ReactNode[] = (() => {
    if (navVariant === "freeReport") {
      return [
        <a
          key="questions"
          href="#action-roadmap-faqs"
          className={mobileNavLinkClass}
          onClick={closeMobile}
        >
          Questions
        </a>,
        resendUrl ? (
          <Link
            key="resend"
            href={resendUrl}
            className={mobileNavLinkClass}
            onClick={closeMobile}
          >
            Get a new link
          </Link>
        ) : null,
      ]
    }
    if (navVariant === "paidOwnerFree" && actionRoadmapReportId) {
      return [
        <a
          key="questions"
          href="#action-roadmap-faqs"
          className={mobileNavLinkClass}
          onClick={closeMobile}
        >
          Questions
        </a>,
      ]
    }
    if (navVariant === "paidPendingIntake") {
      return []
    }
    return [
        <Link
          key="home"
          href="/"
          className={mobileNavLinkClass}
          aria-current={pathname === "/" ? "page" : undefined}
          onClick={closeMobile}
        >
          Home
        </Link>,
        <Link
          key="intake"
          href="/intake"
          className={mobileNavLinkClass}
          aria-current={isIntakeActive ? "page" : undefined}
          onClick={closeMobile}
        >
          Intake
        </Link>,
        showSignOut ? (
          <div key="signout" className="ls-glass-nav-item px-3 py-2 text-white">
            <SignOutButton />
          </div>
        ) : null,
    ]
  })()

  const hasReportSections = Boolean(registration?.tabs.length)

  const sectionItems =
    registration?.tabs.map((tab) => {
      const Icon = TAB_ICONS[tab.id]
      const isActive = registration.activeTab === tab.id
      return (
        <button
          key={tab.id}
          type="button"
          aria-current={isActive ? "page" : undefined}
          className={cn(
            mobileSectionLinkClass,
            isActive && "text-white",
          )}
          onClick={() => {
            if (tab.locked) {
              registration.onLockedTabClick?.(tab.id)
            } else {
              registration.onSelectTab(tab.id)
            }
            closeMobile()
          }}
        >
          {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden /> : null}
          <span className="min-w-0 flex-1 truncate text-left">{tab.label}</span>
          {tab.locked ? (
            <Lock className="h-3.5 w-3.5 shrink-0 opacity-50" aria-label="Locked" />
          ) : null}
        </button>
      )
    }) ?? []

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
          className="flex min-w-0 shrink items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src="/icon.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full"
            priority
          />
          <span className="gradient-text truncate text-base font-bold sm:text-lg md:text-xl">
            Level Play Digital · {productLabel}
          </span>
        </a>

        <ul className="hidden min-w-0 items-center justify-end gap-3 min-[769px]:flex min-[769px]:gap-4">
          {desktopLinks}
        </ul>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-[769px]:hidden shrink-0"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls={menuId}
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          id={menuId}
          side="right"
          className="ls-mobile-nav-sheet gap-0 border-0 bg-[#001e46] p-0 text-white"
        >
          <SheetHeader className="border-b border-white/15 px-6 py-4">
            <SheetTitle className="text-white">Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Report sections and site navigation
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col overflow-y-auto p-4">
            {hasReportSections ? (
              <>
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                  Report sections
                </p>
                <nav aria-label="Report sections">
                  <GlassNavList>{sectionItems}</GlassNavList>
                </nav>

                <div
                  className="my-4 h-1.5 rounded-full bg-white/25"
                  role="separator"
                  aria-hidden
                />

                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                  More
                </p>
                <GlassNavList>{topNavSecondaryItems}</GlassNavList>

                {primaryCta ? (
                  <div className="mt-4 border-t-2 border-white/25 pt-4">
                    {primaryCta}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <GlassNavList>{topNavSecondaryItems}</GlassNavList>
                {primaryCta ? (
                  <div
                    className={cn(
                      topNavSecondaryItems.filter(Boolean).length > 0 &&
                        "mt-4 border-t border-white/25 pt-4",
                    )}
                  >
                    {primaryCta}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
