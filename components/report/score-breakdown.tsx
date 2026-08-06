"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { deriveOverallFromSections } from "@/lib/audit/derive-overall-from-sections"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { PAID_TAB_IDS, SECTION_TAB_ORDER } from "@/lib/report/display-helpers"
import { REPORT_DIAGNOSTIC_DISCLAIMER } from "@/lib/report/outcome-copy"
import { getHubUpgradeUrl } from "@/lib/urls"

type ScoreBreakdownProps = {
  report: LevelstackReportJson
  reportId?: string
}

function rptScoreBarColor(score: number): string {
  if (score < 55) return "var(--rpt-red, #d9534f)"
  if (score < 75) return "var(--rpt-orange, #f0ad4e)"
  return "var(--rpt-green, #5cb85c)"
}

function formatMeanExplanation(
  scores: number[],
  overall: number,
): string | null {
  if (scores.length === 0) return null
  if (scores.length === 1) return `Based on 1 section score (${scores[0]}).`
  const sum = scores.reduce((a, b) => a + b, 0)
  const parts = scores.join(" + ")
  return `Rounded average: (${parts}) ÷ ${scores.length} = ${(sum / scores.length).toFixed(1)} → ${overall}.`
}

export function ScoreBreakdown({ report, reportId }: ScoreBreakdownProps) {
  const [open, setOpen] = useState(false)
  const { meta, sections } = report
  const isFree = meta.reportTier === "free_snapshot"
  const contentSections = sections.filter((s) => s.id !== "action_plan")
  const sectionById = new Map(contentSections.map((s) => [s.id, s]))
  const derived = deriveOverallFromSections(contentSections)

  const scoredValues = derived.includedSectionIds
    .map((id) => sectionById.get(id)?.score)
    .filter((s): s is number => typeof s === "number" && Number.isFinite(s))

  const meanExplanation = formatMeanExplanation(scoredValues, meta.overallScore)

  const diagnosticTabs = SECTION_TAB_ORDER.filter((t) => t.id !== "executive_summary")

  return (
    <div className="rpt-score-breakdown">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-6 py-3 text-left text-sm font-medium hover:opacity-90 transition-colors"
        style={{ color: "var(--rpt-heading, #111827)" }}
        aria-expanded={open}
      >
        <span>How your score was calculated</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 rpt-muted-text" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 rpt-muted-text" aria-hidden />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 space-y-3">
          <p className="rpt-body-text">
            Your overall readiness score of{" "}
            <strong style={{ color: "var(--rpt-heading)" }}>{meta.overallScore}/100</strong> (
            grade <strong style={{ color: "var(--rpt-heading)" }}>{meta.letterGrade}</strong>) is
            the rounded average of the scored diagnostic sections listed below — not a separate
            hidden formula.
          </p>
          {isFree ? (
            <p className="rpt-caption normal-case tracking-normal">
              Free {meta.reportTier === "free_snapshot" ? "Visibility Snapshot" : "reports"} average{" "}
              Google visibility and Social &amp; off-site only. Paid Action Roadmap scores include
              every unlocked diagnostic section.
            </p>
          ) : null}
          {meanExplanation ? (
            <p className="rpt-caption normal-case tracking-normal font-medium text-[var(--rpt-heading)]">
              {meanExplanation}
            </p>
          ) : null}
          <ul className="space-y-2 list-none pl-0">
            {diagnosticTabs.map((tab) => {
              const section = sectionById.get(tab.id)
              const locked = isFree && PAID_TAB_IDS.has(tab.id)
              const included = derived.includedSectionIds.includes(tab.id)

              if (locked) {
                return (
                  <li key={tab.id} className="flex items-center gap-3 text-sm">
                    <span className="w-36 shrink-0 truncate rpt-muted-text">{tab.label}</span>
                    <span
                      className="h-2 flex-1 max-w-[200px] rounded-full overflow-hidden blur-[3px] opacity-50"
                      style={{ background: "color-mix(in srgb, var(--rpt-muted) 20%, white)" }}
                      aria-hidden
                    >
                      <span className="block h-full w-1/2 rounded-full bg-muted" />
                    </span>
                    <Link
                      href={getHubUpgradeUrl({ reportId, source: "levelstack_report" })}
                      className="text-[10px] font-medium uppercase tracking-wide text-brand-orange shrink-0"
                    >
                      Locked
                    </Link>
                  </li>
                )
              }

              if (!section) return null

              const hasScore =
                section.status !== "insufficient_data" &&
                typeof section.score === "number" &&
                Number.isFinite(section.score)

              return (
                <li key={tab.id} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 truncate rpt-muted-text">{tab.label}</span>
                  <span
                    className="h-2 flex-1 max-w-[200px] rounded-full overflow-hidden"
                    style={{ background: "color-mix(in srgb, var(--rpt-muted) 20%, white)" }}
                    aria-hidden
                  >
                    {hasScore ? (
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${section.score as number}%`,
                          backgroundColor: rptScoreBarColor(section.score as number),
                        }}
                      />
                    ) : (
                      <span
                        className="block h-full w-full rounded-full opacity-40"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg, transparent, transparent 4px, color-mix(in srgb, var(--rpt-muted) 40%, white) 4px, color-mix(in srgb, var(--rpt-muted) 40%, white) 8px)",
                        }}
                      />
                    )}
                  </span>
                  <span
                    className="min-w-8 text-right font-medium tabular-nums"
                    style={{ color: "var(--rpt-heading)" }}
                  >
                    {hasScore ? section.score : "—"}
                  </span>
                  {included ? (
                    <span className="text-[10px] uppercase tracking-wide text-emerald-700 shrink-0">
                      In average
                    </span>
                  ) : hasScore ? null : (
                    <span className="text-[10px] uppercase tracking-wide rpt-muted-text shrink-0">
                      Insufficient data
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="rpt-caption normal-case tracking-normal italic">
            {REPORT_DIAGNOSTIC_DISCLAIMER}
          </p>
        </div>
      )}
    </div>
  )
}
