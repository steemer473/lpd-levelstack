import type { ReactNode } from "react"

import { AuditHero, type HeroBadge } from "@/components/marketing/audit-hero"
import { GlassNavigation } from "@/components/layout/glass-navigation"
import { SiteFooter } from "@/components/layout/site-footer"
import type { NavVariant } from "@/lib/nav-variant"
import { cn } from "@/lib/utils"

type ProductShellProps = {
  children: ReactNode
  maxWidth?: "md" | "lg" | "xl" | "full"
  showSignOut?: boolean
  navVariant?: NavVariant
  reportId?: string
  actionRoadmapReportId?: string
  className?: string
  /** Marketing pages: navy hero band (seo /results/ report hero uses --hero-bg inside report card) */
  hero?: {
    tagline: string
    heading: string
    headingHighlight: string
    description: string
    badges?: HeroBadge[]
  }
  overlapHero?: boolean
  /** Report + status pages: same light shell as /results/ (no dark brandDark page chrome) */
  resultsStyle?: boolean
}

const maxWidthClass = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  full: "max-w-6xl",
} as const

export function ProductShell({
  children,
  maxWidth = "lg",
  showSignOut = false,
  navVariant = "default",
  reportId,
  actionRoadmapReportId,
  className,
  hero,
  overlapHero = false,
  resultsStyle = false,
}: ProductShellProps) {
  return (
    <div
      className={cn(
        "min-h-svh flex flex-col",
        resultsStyle
          ? "bg-white"
          : "bg-gradient-to-b from-background to-muted/20",
        className,
      )}
    >
      <GlassNavigation
        showSignOut={showSignOut}
        navVariant={navVariant}
        reportId={reportId}
        actionRoadmapReportId={actionRoadmapReportId}
      />

      {hero && (
        <AuditHero
          tagline={hero.tagline}
          heading={hero.heading}
          headingHighlight={hero.headingHighlight}
          description={hero.description}
          badges={hero.badges}
        />
      )}

      <main
        className={cn(
          "flex-1 w-full mx-auto px-4 sm:px-6 pb-12",
          resultsStyle ? "max-w-report pt-24" : maxWidthClass[maxWidth],
          hero && !resultsStyle
            ? overlapHero
              ? "-mt-16 md:-mt-20 relative z-10 pt-0"
              : "pt-8"
            : !hero && "pt-24",
        )}
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  )
}
