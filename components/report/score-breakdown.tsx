"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { PAID_TAB_IDS, SECTION_TAB_ORDER } from "@/lib/report/display-helpers"
import { getHubUpgradeUrl } from "@/lib/urls"

type ScoreBreakdownProps = {
  report: LevelstackReportJson
}

function rptScoreBarColor(score: number): string {
  if (score < 55) return "var(--rpt-red, #d9534f)"
  if (score < 75) return "var(--rpt-orange, #f0ad4e)"
  return "var(--rpt-green, #5cb85c)"
}

export function ScoreBreakdown({
  report,
  reportId,
}: ScoreBreakdownProps & { reportId?: string }) {
  const [open, setOpen] = useState(false)
  const { meta, sections } = report
  const isFree = meta.reportTier === "free_snapshot"
  const contentSections = sections.filter((s) => s.id !== "action_plan")
  const sectionById = new Map(contentSections.map((s) => [s.id, s]))

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
            the rounded average of your section scores below. Each section score reflects finding
            severity in that area — not a guarantee of rankings or revenue.
          </p>
          <ul className="space-y-2 list-none pl-0">
            {diagnosticTabs.map((tab) => {
              const section = sectionById.get(tab.id)
              const locked = isFree && PAID_TAB_IDS.has(tab.id)

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

              return (
                <li key={tab.id} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 truncate rpt-muted-text">{tab.label}</span>
                  <span
                    className="h-2 flex-1 max-w-[200px] rounded-full overflow-hidden"
                    style={{ background: "color-mix(in srgb, var(--rpt-muted) 20%, white)" }}
                    aria-hidden
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${section.score}%`,
                        backgroundColor: rptScoreBarColor(section.score),
                      }}
                    />
                  </span>
                  <span
                    className="w-8 text-right font-medium tabular-nums"
                    style={{ color: "var(--rpt-heading)" }}
                  >
                    {section.score}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="rpt-caption normal-case tracking-normal italic">
            Diagnostic only — you or your team execute fixes. LevelStack does not guarantee
            rankings or revenue outcomes.
          </p>
        </div>
      )}
    </div>
  )
}
