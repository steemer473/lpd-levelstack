"use client"

import { useState } from "react"
import { Lock } from "lucide-react"

import { LockedSectionUnlockModal } from "@/components/report/locked-section-unlock-modal"
import { SapBridgeBlock } from "@/components/report/sap-bridge-block"
import { Button } from "@/components/ui/button"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { LOCKED_SECTION_LABELS } from "@/lib/report/display-helpers"
import {
  resolveCompetitiveSnapshot,
  resolveExecutiveContent,
} from "@/lib/report/executive-summary-resolve"
import { cn } from "@/lib/utils"

const LOCKED_SECTION_FALLBACK: Record<string, string> = {
  revenue_funnel:
    "See how your ad spend, landing pages, and offer clarity affect conversion — and where you're leaking leads.",
  competitive_context:
    "See who ranks above you, how you compare on reviews and authority, and where to close the gap.",
  action_plan:
    "Get your full prioritized backlog — who owns each task, time estimates, and what to fix this week, month, and quarter.",
}

type LockedSectionPreviewProps = {
  sectionId: string
  report: LevelstackReportJson
  reportId?: string
}

function BlurredTeaser({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none blur-[4px] opacity-70 rounded-lg border border-border/60 bg-muted/30 p-4",
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  )
}

function RevenueFunnelPreview({ report }: { report: LevelstackReportJson }) {
  const content = resolveExecutiveContent(report)
  const teaser =
    content.insights.revenueRisk.trim() ||
    report.meta.upgradeTeasers?.competitivePositionAlert ||
    LOCKED_SECTION_FALLBACK.revenue_funnel

  return (
    <div className="space-y-3 max-w-lg mx-auto text-left">
      <BlurredTeaser>
        <p className="text-sm font-medium text-foreground">{teaser}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Funnel readiness: landing page clarity, offer alignment, ad spend efficiency…
        </p>
      </BlurredTeaser>
    </div>
  )
}

function CompetitiveContextPreview({ report }: { report: LevelstackReportJson }) {
  const competitive = resolveCompetitiveSnapshot(report)
  const competitiveSection = report.sections.find((s) => s.id === "competitive_context")
  const topRow = competitive?.rows[0]

  if (!topRow && !competitiveSection?.competitiveGrid) {
    return (
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        {LOCKED_SECTION_FALLBACK.competitive_context}
      </p>
    )
  }

  return (
    <div className="space-y-3 max-w-2xl mx-auto text-left">
      {topRow ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
            #1 competitor preview
          </p>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground truncate">{topRow.domain}</span>
            <span className="text-muted-foreground shrink-0">
              SERP #{topRow.serpPosition}
            </span>
          </div>
          {competitive?.previewTitle ? (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {competitive.previewTitle}
            </p>
          ) : null}
        </div>
      ) : null}
      {competitiveSection?.competitiveGrid ? (
        <BlurredTeaser>
          <div className="space-y-2">
            {competitiveSection.competitiveGrid.rows.slice(0, 3).map((row) => (
              <div key={row.label} className="flex gap-2 text-xs">
                <span className="w-24 shrink-0 font-medium">{row.label}</span>
                <span className="text-muted-foreground truncate">
                  {row.cells.filter(Boolean).join(" · ")}
                </span>
              </div>
            ))}
          </div>
        </BlurredTeaser>
      ) : (
        <BlurredTeaser>
          <p className="text-sm text-muted-foreground">
            Full competitive grid with reviews, authority, and gap analysis…
          </p>
        </BlurredTeaser>
      )}
    </div>
  )
}

function ActionPlanPreview({ report }: { report: LevelstackReportJson }) {
  const count = report.meta.teaserActionCount ?? 0
  const teaserItems = report.actionPlan.thisWeek.slice(0, 3)

  if (count <= 0 && teaserItems.length === 0) {
    return (
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        Your prioritized action plan unlocks with the Action Roadmap.
      </p>
    )
  }

  const headline =
    count > 0
      ? `${count} prioritized action${count === 1 ? "" : "s"} ready — unlock to see Who, Time, and Impact`
      : "Your prioritized action plan unlocks with the Action Roadmap."

  return (
    <div className="space-y-3 max-w-lg mx-auto text-left">
      <p className="text-sm font-medium text-center">{headline}</p>
      {teaserItems.length > 0 ? (
        <BlurredTeaser>
          <ul className="space-y-2 list-none pl-0">
            {teaserItems.map((item, i) => (
              <li key={i} className="text-sm text-foreground">
                {item.task}
              </li>
            ))}
            <li className="text-sm text-muted-foreground">+ more in Action Roadmap…</li>
          </ul>
        </BlurredTeaser>
      ) : null}
    </div>
  )
}

export function LockedSectionPreview({
  sectionId,
  report,
  reportId,
}: LockedSectionPreviewProps) {
  const label = LOCKED_SECTION_LABELS[sectionId] ?? "This section"
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)

  return (
    <div className="px-6 py-8 text-center">
      <Lock className="h-5 w-5 text-brand-orange mx-auto mb-3" aria-hidden />
      <p className="text-lg font-semibold mb-4">{label}</p>

      {sectionId === "revenue_funnel" ? (
        <RevenueFunnelPreview report={report} />
      ) : sectionId === "competitive_context" ? (
        <CompetitiveContextPreview report={report} />
      ) : sectionId === "action_plan" ? (
        <ActionPlanPreview report={report} />
      ) : (
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
          {LOCKED_SECTION_FALLBACK[sectionId] ??
            "Included in the Full LevelStack Report ($97)."}
        </p>
      )}

      <Button variant="brand" className="mt-6" onClick={() => setUnlockModalOpen(true)}>
        Unlock Action Roadmap — $97
      </Button>

      <SapBridgeBlock placement="freeLocked" reportId={reportId} />
      <LockedSectionUnlockModal
        open={unlockModalOpen}
        onOpenChange={setUnlockModalOpen}
        reportId={reportId}
      />
    </div>
  )
}
