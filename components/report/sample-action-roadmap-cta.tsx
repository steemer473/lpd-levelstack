import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Unlock97CtaLabel } from "@/components/report/unlock-97-cta-label"
import { Button } from "@/components/ui/button"
import { SAMPLE_ACTION_ROADMAP_LINKS } from "@/lib/report/outcome-copy"
import { getHubCartUrl } from "@/lib/urls"

/**
 * Purchase CTA for the public paid sample page.
 * UpgradeBanner intentionally returns null on non-free tiers (real paid
 * customers must not see buy prompts), so the sample page owns its own band.
 */
export function SampleActionRoadmapCta() {
  const upgradeUrl = getHubCartUrl({ source: "levelstack_report" })

  return (
    <div
      className="mt-6 rounded-xl border border-border bg-card px-5 py-5"
      data-sample-cta="action-roadmap"
    >
      <p className="text-sm text-muted-foreground leading-relaxed">
        {SAMPLE_ACTION_ROADMAP_LINKS.samplePageCtaLead}
      </p>
      <Button variant="brand" asChild className="mt-3 min-h-11 w-full sm:w-auto">
        <Link href={upgradeUrl}>
          <Unlock97CtaLabel />
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">one-time, no subscription</p>
    </div>
  )
}
