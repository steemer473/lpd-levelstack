"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

type ScoreBreakdownProps = {
  report: LevelstackReportJson
}

function rptScoreBarColor(score: number): string {
  if (score < 55) return "var(--rpt-red, #d9534f)"
  if (score < 75) return "var(--rpt-orange, #f0ad4e)"
  return "var(--rpt-green, #5cb85c)"
}

export function ScoreBreakdown({ report }: ScoreBreakdownProps) {
  const [open, setOpen] = useState(false)
  const { meta, sections } = report
  const contentSections = sections.filter((s) => s.id !== "action_plan")

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
            the rounded average of your five section scores below. Each section score reflects
            finding severity in that area — not a guarantee of rankings or revenue.
          </p>
          <ul className="space-y-2 list-none pl-0">
            {contentSections.map((s) => (
              <li key={s.id} className="flex items-center gap-3 text-sm">
                <span className="w-36 shrink-0 truncate rpt-muted-text">{s.label}</span>
                <span
                  className="h-2 flex-1 max-w-[200px] rounded-full overflow-hidden"
                  style={{ background: "color-mix(in srgb, var(--rpt-muted) 20%, white)" }}
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${s.score}%`,
                      backgroundColor: rptScoreBarColor(s.score),
                    }}
                  />
                </span>
                <span
                  className="w-8 text-right font-medium tabular-nums"
                  style={{ color: "var(--rpt-heading)" }}
                >
                  {s.score}
                </span>
              </li>
            ))}
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
