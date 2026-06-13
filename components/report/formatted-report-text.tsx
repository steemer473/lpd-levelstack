import { splitReportCopyParagraphs } from "@/lib/report/format-report-copy"
import { cn } from "@/lib/utils"

type FormattedReportTextProps = {
  text: string
  className?: string
  paragraphClassName?: string
  /** Bold short lead-in before the first colon (e.g. "From public research so far:"). */
  emphasizeLeadIn?: boolean
}

function ReportParagraph({
  text,
  className,
  emphasizeLeadIn,
}: {
  text: string
  className?: string
  emphasizeLeadIn?: boolean
}) {
  if (!emphasizeLeadIn) {
    return <p className={className}>{text}</p>
  }

  const colonIndex = text.indexOf(":")
  const hasLeadIn =
    colonIndex > 0 &&
    colonIndex < 72 &&
    !text.slice(0, colonIndex).includes(".") &&
    text.slice(colonIndex + 1).trim().length > 0

  if (!hasLeadIn) {
    return <p className={className}>{text}</p>
  }

  const leadIn = text.slice(0, colonIndex + 1)
  const rest = text.slice(colonIndex + 1).trim()

  return (
    <p className={className}>
      <span className="font-semibold text-inherit">{leadIn}</span> {rest}
    </p>
  )
}

export function FormattedReportText({
  text,
  className,
  paragraphClassName,
  emphasizeLeadIn = true,
}: FormattedReportTextProps) {
  const paragraphs = splitReportCopyParagraphs(text)

  if (paragraphs.length === 0) return null

  if (paragraphs.length === 1) {
    return (
      <ReportParagraph
        text={paragraphs[0]!}
        className={cn(className, paragraphClassName)}
        emphasizeLeadIn={emphasizeLeadIn}
      />
    )
  }

  return (
    <div className={cn("rpt-formatted-copy space-y-2.5", className)}>
      {paragraphs.map((paragraph, index) => (
        <ReportParagraph
          key={`${index}-${paragraph.slice(0, 24)}`}
          text={paragraph}
          className={paragraphClassName}
          emphasizeLeadIn={emphasizeLeadIn}
        />
      ))}
    </div>
  )
}
