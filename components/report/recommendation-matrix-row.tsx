"use client"

import { CheckSquare } from "lucide-react"
import { useState } from "react"

import { ReportFieldHint } from "@/components/report/report-field-hint"
import { SapWaitlistModal } from "@/components/report/sap-waitlist-modal"
import type { RecommendationObject } from "@/lib/pipeline/recommendation-types"
import { expandAcronymsInCustomerCopy } from "@/lib/report/customer-terms"
import { ACTION_ITEM_SAP_MICRO_CTA } from "@/lib/report/outcome-copy"
import {
  CONFIDENCE_HINT,
  ROI_HINT,
  priorityHint,
} from "@/lib/report/roadmap-field-hints"
import { ownerRoleLabel } from "@/lib/report/roadmap-from-recommendations"

type RecommendationMatrixRowProps = {
  recommendation: RecommendationObject
  itemNumber: number
  reportId?: string
}

function evidenceLinkLabel(ev: RecommendationObject["evidence"][number]): string {
  const base = expandAcronymsInCustomerCopy(
    ev.sourceLabel?.trim() || "Public search evidence",
  )
  if (ev.query?.trim()) {
    const q = ev.query.trim()
    const short = q.length > 64 ? `${q.slice(0, 61)}…` : q
    return `${base}: ${short}`
  }
  return base
}

function ArtifactBlock({
  artifact,
}: {
  artifact: RecommendationObject["artifact"]
}) {
  if (artifact.kind === "none" || !artifact.content) return null

  const content = expandAcronymsInCustomerCopy(artifact.content)
  const kindLabel =
    artifact.kind === "checklist"
      ? "Checklist"
      : artifact.kind.replaceAll("_", " ")

  if (artifact.kind === "checklist") {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    return (
      <div className="mt-3 rounded-md border border-border/60 bg-muted/40 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {kindLabel}
        </p>
        <ul className="space-y-2">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-[var(--rpt-body)]">
              <CheckSquare
                className="mt-0.5 size-3.5 shrink-0 text-brand-orange"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-md border border-border/60 bg-muted/40 p-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {kindLabel}
      </p>
      <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-[var(--rpt-body)]">
        {content}
      </pre>
    </div>
  )
}

export function RecommendationMatrixRow({
  recommendation,
  itemNumber,
  reportId,
}: RecommendationMatrixRowProps) {
  const [sapModalOpen, setSapModalOpen] = useState(false)
  const whyNow = expandAcronymsInCustomerCopy(
    recommendation.urgency ||
      recommendation.summary ||
      "High-priority trust and visibility gap in your snapshot.",
  )
  const effort = recommendation.effortHint ?? "—"
  const priority = priorityHint(recommendation.priority)
  const evidenceWithUrl = recommendation.evidence.filter((e) => e.url)
  const summary = recommendation.summary
    ? expandAcronymsInCustomerCopy(recommendation.summary)
    : null
  const consequence = recommendation.consequenceOfInaction
    ? expandAcronymsInCustomerCopy(recommendation.consequenceOfInaction)
    : null
  const roiLabel = recommendation.roi.rangeLabel
    ? expandAcronymsInCustomerCopy(recommendation.roi.rangeLabel)
    : null

  return (
    <>
      <div className="rounded-lg border border-border/70 bg-card p-3 shadow-xs">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
            {priority.label}
            <ReportFieldHint label={priority.label} detail={priority.detail} />
          </span>
          <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Confidence: {recommendation.confidence.band}
            <ReportFieldHint
              label={`Confidence: ${recommendation.confidence.band}`}
              detail={
                recommendation.confidence.rationale
                  ? `${CONFIDENCE_HINT} ${recommendation.confidence.rationale}`
                  : CONFIDENCE_HINT
              }
            />
          </span>
          {roiLabel ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ROI: {roiLabel}
              <ReportFieldHint label="ROI (directional)" detail={ROI_HINT} />
            </span>
          ) : null}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-[120px_1fr]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Action {itemNumber}
          </p>
          <p className="font-medium leading-snug text-[var(--rpt-heading)]">
            {expandAcronymsInCustomerCopy(recommendation.title)}
          </p>

          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Why now
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">
            {whyNow}
          </p>

          {consequence ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                If ignored
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--rpt-body)]">
                {consequence}
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

        {summary && summary !== whyNow ? (
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--rpt-body)]">
            {summary}
          </p>
        ) : null}

        <ArtifactBlock artifact={recommendation.artifact} />

        {evidenceWithUrl.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Evidence from public search
            </p>
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
              These links open the public search results (or pages) we used for this
              recommendation — not a separate product feature.
            </p>
            <ul className="list-none space-y-1.5 pl-0">
              {evidenceWithUrl.slice(0, 4).map((ev, i) => (
                <li key={`${ev.url}-${i}`} className="text-[11px]">
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-orange underline underline-offset-2"
                  >
                    {evidenceLinkLabel(ev)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
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
