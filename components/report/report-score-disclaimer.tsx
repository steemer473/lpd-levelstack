"use client"

import { SCORE_DISCLAIMER, scoreDisclaimerParagraphs } from "@/lib/report/outcome-copy"
import { cn } from "@/lib/utils"

type ReportScoreDisclaimerProps = {
  className?: string
  /** Compact single-line lead + expandable details (default). */
  defaultOpen?: boolean
}

export function ReportScoreDisclaimer({
  className,
  defaultOpen = false,
}: ReportScoreDisclaimerProps) {
  const paragraphs = scoreDisclaimerParagraphs()

  return (
    <details
      className={cn("rpt-score-disclaimer", className)}
      open={defaultOpen || undefined}
    >
      <summary className="cursor-pointer font-medium list-outside pl-1 ml-4">
        {SCORE_DISCLAIMER.title}
      </summary>
      <div className="mt-2 space-y-2 pl-1">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </div>
    </details>
  )
}
