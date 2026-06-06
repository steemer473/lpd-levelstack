import { cn } from "@/lib/utils"
import type { GuideSegment, SectionGuideBlock } from "@/lib/report/section-guides"

function GuideSegments({ segments }: { segments: GuideSegment[] }) {
  return (
    <>
      {segments.map((s, i) => {
        if (s.b) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {s.t}
            </strong>
          )
        }
        if (s.c === "accent") {
          return (
            <span key={i} className="font-medium text-lpd-orange">
              {s.t}
            </span>
          )
        }
        return <span key={i}>{s.t}</span>
      })}
    </>
  )
}

function GuideBlock({ block }: { block: SectionGuideBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-sm leading-relaxed text-foreground">
          <GuideSegments segments={block.segments} />
        </p>
      )
    case "ul":
      return (
        <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-foreground marker:text-lpd-orange">
          {block.items.map((item, i) => (
            <li key={i}>
              <GuideSegments segments={item} />
            </li>
          ))}
        </ul>
      )
    case "ol":
      return (
        <ol className="list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-foreground marker:font-semibold marker:text-lpd-orange">
          {block.items.map((item, i) => (
            <li key={i} className="pl-0.5">
              <GuideSegments segments={item} />
            </li>
          ))}
        </ol>
      )
    case "callout":
      return (
        <div
          className={cn(
            "rounded-md border-l-2 px-3 py-2 text-sm leading-relaxed",
            block.tone === "tip" &&
              "border-l-lpd-orange bg-muted/60 text-muted-foreground",
            block.tone === "important" &&
              "border-l-amber-500 bg-amber-50/90 text-amber-950 dark:border-l-amber-600 dark:bg-amber-950/40 dark:text-amber-100",
          )}
        >
          <GuideSegments segments={block.segments} />
        </div>
      )
    default:
      return null
  }
}

export function SectionGuideBody({
  content,
}: {
  content: string | SectionGuideBlock[]
}) {
  if (typeof content === "string") {
    return <p className="text-sm leading-relaxed text-foreground">{content}</p>
  }

  return (
    <div className="space-y-2.5">
      {content.map((block, i) => (
        <GuideBlock key={i} block={block} />
      ))}
    </div>
  )
}
