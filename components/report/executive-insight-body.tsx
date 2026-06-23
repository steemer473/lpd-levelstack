import type { ExecutiveInsightPart } from "@/lib/report/executive-insight-parts"
import { cn } from "@/lib/utils"

type ExecutiveInsightBodyProps = {
  parts: ExecutiveInsightPart[]
  paragraphClassName?: string
  highlightClassName?: string
  mutedClassName?: string
  className?: string
}

export function ExecutiveInsightBody({
  parts,
  paragraphClassName,
  highlightClassName = "font-semibold text-inherit",
  mutedClassName = "text-muted-foreground",
  className,
}: ExecutiveInsightBodyProps) {
  if (parts.length === 0) return null

  return (
    <div className={cn("rpt-insight-parts space-y-2", className)}>
      {parts.map((part, index) => {
        const key = `${part.kind}-${index}-${part.kind === "finding" ? part.text.slice(0, 24) : part.text.slice(0, 24)}`

        if (part.kind === "finding") {
          return (
            <p key={key} className={paragraphClassName}>
              {part.prefix ? <span>{part.prefix} </span> : null}
              <span className={highlightClassName}>{part.text}</span>
              {part.suffix ? <span> {part.suffix}</span> : null}
            </p>
          )
        }

        if (part.kind === "highlight") {
          return (
            <p key={key} className={cn(paragraphClassName, highlightClassName)}>
              {part.text}
            </p>
          )
        }

        if (part.kind === "muted") {
          return (
            <p key={key} className={cn(paragraphClassName, mutedClassName)}>
              {part.text}
            </p>
          )
        }

        return (
          <p key={key} className={paragraphClassName}>
            {part.text}
          </p>
        )
      })}
    </div>
  )
}
