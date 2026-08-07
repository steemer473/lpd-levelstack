"use client"

import { useState } from "react"

import { PriorityBadge, PriorityCodeBadge } from "@/components/report/priority-badge"
import { ReportFieldHint } from "@/components/report/report-field-hint"
import { SapWaitlistModal } from "@/components/report/sap-waitlist-modal"
import { SnippetBeforeAfter } from "@/components/report/snippet-before-after"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { badgesForActionItem } from "@/lib/report/action-priority-badges"
import {
  ACTION_ITEM_SAP_MICRO_CTA,
  shouldShowActionItemSapMicroCta,
} from "@/lib/report/outcome-copy"
import {
  EFFORT_HINT,
  IMPACT_HINT,
  PRIORITY_HINTS,
} from "@/lib/report/roadmap-field-hints"
import type { RoadmapBucketKey } from "@/lib/report/roadmap-from-recommendations"

type ActionItem = LevelstackReportJson["actionPlan"]["thisWeek"][number]

type ActionItemMatrixRowProps = {
  item: ActionItem
  itemNumber: number
  bucket: RoadmapBucketKey
  snippetBefore?: string
  snippetAfter?: string
  reportId?: string
}

function ensureTaskSentence(task: string): string {
  const trimmed = task.trim()
  if (!trimmed) return trimmed
  if (/[.!?]$/.test(trimmed)) return trimmed
  return `${trimmed}.`
}

function priorityDetailForCode(code: string): { label: string; detail: string } {
  if (code === "P0" || code === "P1" || code === "P2" || code === "P3") {
    return PRIORITY_HINTS[code]
  }
  return {
    label: code,
    detail: "Urgency code for when this work should happen.",
  }
}

export function ActionItemMatrixRow({
  item,
  itemNumber,
  bucket,
  snippetBefore,
  snippetAfter,
  reportId,
}: ActionItemMatrixRowProps) {
  const [sapModalOpen, setSapModalOpen] = useState(false)
  const whyNow =
    item.sub ?? "High-priority trust and visibility gap in your snapshot."
  const showSapCta = shouldShowActionItemSapMicroCta(item.who, {
    automatable: item.automatorFlag === true,
  })
  const badges = badgesForActionItem({
    bucket,
    time: item.time,
    impactLabel: item.impactLevel,
  })
  const priorityMeta = priorityDetailForCode(badges.priorityCode)

  return (
    <>
      <div className="rpt-roadmap-item">
        <div className="flex items-start gap-3">
          <span className="rpt-roadmap-item-num" aria-hidden>
            {itemNumber}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug text-[var(--rpt-heading)] text-sm">
              {ensureTaskSentence(item.task)}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--rpt-body)]">
              {whyNow}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Impact
                  <PriorityBadge level={badges.impact} />
                  <ReportFieldHint label="Impact" detail={IMPACT_HINT} />
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Effort
                  <PriorityBadge level={badges.effort} />
                  <ReportFieldHint label="Effort" detail={EFFORT_HINT} />
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Priority
                  <PriorityCodeBadge code={badges.priorityCode} />
                  <ReportFieldHint
                    label={priorityMeta.label}
                    detail={priorityMeta.detail}
                  />
                </span>
              </div>
              <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span className="rpt-chip rpt-chip-blue">{item.who}</span>
                <span className="rpt-chip rpt-chip-orange">{item.time}</span>
              </div>
            </div>
          </div>
        </div>

        {snippetBefore && snippetAfter ? (
          <SnippetBeforeAfter
            className="mt-3"
            snippetBefore={snippetBefore}
            snippetAfter={snippetAfter}
          />
        ) : null}

        {showSapCta ? (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {ACTION_ITEM_SAP_MICRO_CTA.prefix}{" "}
            <button
              type="button"
              onClick={() => setSapModalOpen(true)}
              className="font-medium text-brand-orange underline underline-offset-2 hover:opacity-90"
            >
              {ACTION_ITEM_SAP_MICRO_CTA.link}
            </button>{" "}
            {ACTION_ITEM_SAP_MICRO_CTA.suffix}
          </p>
        ) : null}
      </div>
      {showSapCta ? (
        <SapWaitlistModal
          open={sapModalOpen}
          onOpenChange={setSapModalOpen}
          reportId={reportId}
        />
      ) : null}
    </>
  )
}
