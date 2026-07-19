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
      className={cn(
        "rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
      open={defaultOpen || undefined}
    >
      <summary className="cursor-pointer font-medium text-foreground list-inside">
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
