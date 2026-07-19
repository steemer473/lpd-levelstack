"use client"

import { useState } from "react"

import { SapWaitlistModal } from "@/components/report/sap-waitlist-modal"
import type { RecommendationObject } from "@/lib/pipeline/recommendation-types"
import { ACTION_ITEM_SAP_MICRO_CTA } from "@/lib/report/outcome-copy"
import { ownerRoleLabel } from "@/lib/report/roadmap-from-recommendations"

type RecommendationMatrixRowProps = {
  recommendation: RecommendationObject
  itemNumber: number
  reportId?: string
}

export function RecommendationMatrixRow({
  recommendation,
  itemNumber,
  reportId,
}: RecommendationMatrixRowProps) {
  const [sapModalOpen, setSapModalOpen] = useState(false)
  const whyNow =
    recommendation.urgency ||
    recommendation.summary ||
    "High-priority trust and visibility gap in your snapshot."
  const effort = recommendation.effortHint ?? "—"
  const showArtifact =
    recommendation.artifact.kind !== "none" &&
    Boolean(recommendation.artifact.content)
  const evidenceWithUrl = recommendation.evidence.filter((e) => e.url)

  return (
    <>
      <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {recommendation.priority}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Confidence: {recommendation.confidence.band}
          </span>
          {recommendation.roi.rangeLabel ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ROI: {recommendation.roi.rangeLabel}
            </span>
          ) : null}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-[120px_1fr]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Action {itemNumber}
          </p>
          <p className="font-medium leading-snug text-[var(--rpt-heading)]">
            {recommendation.title}
          </p>

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Why now
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">
            {whyNow}
          </p>

          {recommendation.consequenceOfInaction ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                If ignored
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">
                {recommendation.consequenceOfInaction}
              </p>
            </>
          ) : null}

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Owner
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">
            {ownerRoleLabel(recommendation.owner.role)}
          </p>

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Time
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">
            {effort}
          </p>
        </div>

        {recommendation.summary && recommendation.summary !== whyNow ? (
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--rpt-body)]">
            {recommendation.summary}
          </p>
        ) : null}

        {showArtifact ? (
          <div className="mt-3 rounded-md border border-border/60 bg-muted/40 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {recommendation.artifact.kind.replaceAll("_", " ")}
            </p>
            <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-[var(--rpt-body)]">
              {recommendation.artifact.content}
            </pre>
          </div>
        ) : null}

        {evidenceWithUrl.length > 0 ? (
          <ul className="mt-3 list-none space-y-1 pl-0">
            {evidenceWithUrl.slice(0, 4).map((ev, i) => (
              <li key={`${ev.url}-${i}`} className="text-[11px]">
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-orange underline underline-offset-2"
                >
                  {ev.sourceLabel || "Evidence"}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
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
      <SapWaitlistModal
        open={sapModalOpen}
        onOpenChange={setSapModalOpen}
        reportId={reportId}
      />
    </>
  )
}
