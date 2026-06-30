"use client"

import { useState } from "react"

import { SapWaitlistModal } from "@/components/report/sap-waitlist-modal"
import { SnippetBeforeAfter } from "@/components/report/snippet-before-after"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { ACTION_ITEM_SAP_MICRO_CTA } from "@/lib/report/outcome-copy"

type ActionItem = LevelstackReportJson["actionPlan"]["thisWeek"][number]

type ActionItemMatrixRowProps = {
  item: ActionItem
  itemNumber: number
  snippetBefore?: string
  snippetAfter?: string
}

export function ActionItemMatrixRow({
  item,
  itemNumber,
  snippetBefore,
  snippetAfter,
}: ActionItemMatrixRowProps) {
  const [sapModalOpen, setSapModalOpen] = useState(false)

  return (
    <>
      <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
        <div className="grid gap-2 text-sm sm:grid-cols-[120px_1fr]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Action {itemNumber}
          </p>
          <p className="font-medium leading-snug text-[var(--rpt-heading)]">{item.task}</p>

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Why now
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">
            {item.sub ?? "High-priority trust and visibility gap in your snapshot."}
          </p>

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Owner
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">{item.who}</p>

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Time
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">{item.time}</p>
        </div>

        {snippetBefore && snippetAfter ? (
          <SnippetBeforeAfter
            className="mt-3"
            snippetBefore={snippetBefore}
            snippetAfter={snippetAfter}
          />
        ) : null}

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
      </div>
      <SapWaitlistModal open={sapModalOpen} onOpenChange={setSapModalOpen} />
    </>
  )
}
