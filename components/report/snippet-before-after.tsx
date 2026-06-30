import { cn } from "@/lib/utils"

type SnippetBeforeAfterProps = {
  snippetBefore: string
  snippetAfter: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

function SnippetPanel({
  label,
  body,
  tone,
}: {
  label: string
  body: string
  tone: "before" | "after"
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "before"
          ? "border-red-200 bg-red-50/70"
          : "border-emerald-200 bg-emerald-50/70",
      )}
    >
      <p
        className={cn(
          "mb-1 text-[10px] font-semibold uppercase tracking-wide",
          tone === "before" ? "text-red-700" : "text-emerald-700",
        )}
      >
        {label}
      </p>
      <p className="text-xs leading-relaxed text-[var(--rpt-body)] whitespace-pre-wrap">{body}</p>
    </div>
  )
}

export function SnippetBeforeAfter({
  snippetBefore,
  snippetAfter,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: SnippetBeforeAfterProps) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <SnippetPanel label={beforeLabel} body={snippetBefore} tone="before" />
      <SnippetPanel label={afterLabel} body={snippetAfter} tone="after" />
    </div>
  )
}
