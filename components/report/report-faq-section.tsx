import { ChevronDown } from "lucide-react"

import { ACTION_ROADMAP_FAQS, type ActionRoadmapFaq } from "@/data/action-roadmap-faqs"
import { cn } from "@/lib/utils"

type ReportFaqSectionProps = {
  title?: string
  intro?: string
  faqs?: ActionRoadmapFaq[]
  className?: string
}

export function ReportFaqSection({
  title = "Action Roadmap FAQs",
  intro = "Questions business owners ask before unlocking the full roadmap.",
  faqs = ACTION_ROADMAP_FAQS,
  className,
}: ReportFaqSectionProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{intro}</p>
      <div className="mt-4 space-y-2">
        {faqs.map((faq) => (
          <details
            key={faq.id}
            className="group rounded-lg border border-border/80 bg-background p-3"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-medium text-foreground">
              <span>{faq.question}</span>
              <ChevronDown
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[var(--rpt-body)]">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
