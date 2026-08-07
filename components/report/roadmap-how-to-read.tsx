import { ROADMAP_HOW_TO_READ } from "@/lib/report/roadmap-field-hints"

type RoadmapHowToReadProps = {
  variant: "recommendations" | "legacy"
}

export function RoadmapHowToRead({ variant }: RoadmapHowToReadProps) {
  const items =
    variant === "recommendations"
      ? [
          ...ROADMAP_HOW_TO_READ.shared,
          ...ROADMAP_HOW_TO_READ.recommendationsOnly,
        ]
      : [...ROADMAP_HOW_TO_READ.shared]

  return (
    <div
      data-testid="roadmap-how-to-read"
      className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground"
    >
      <p className="font-medium text-foreground">{ROADMAP_HOW_TO_READ.title}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4">
        {items.map((item) => (
          <li key={item.term}>
            <span className="font-medium text-foreground">{item.term}</span>
            {" — "}
            {item.body}
          </li>
        ))}
      </ul>
    </div>
  )
}
