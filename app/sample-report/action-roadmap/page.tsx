import type { Metadata } from "next"

import { ProductShell } from "@/components/layout/product-shell"
import { LevelstackReportView } from "@/components/report/levelstack-report-view"
import { SampleActionRoadmapCta } from "@/components/report/sample-action-roadmap-cta"
import { SampleReportBadge } from "@/components/report/sample-report-badge"
import { SAMPLE_ACTION_ROADMAP } from "@/lib/fixtures/sample-action-roadmap"

export const metadata: Metadata = {
  title: "Sample Action Roadmap",
  description:
    "See what a LevelStack Action Roadmap looks like — prioritized fixes with owner and time, competitive context, and unlocked diagnostic areas for a sample business.",
}

const VALID_TABS = new Set([
  "executive_summary",
  "search_footprint",
  "social_offsite",
  "online_reputation",
  "digital_presence",
  "revenue_funnel",
  "competitive_context",
  "action_plan",
])

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function SampleActionRoadmapPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const defaultTab =
    tab && VALID_TABS.has(tab) ? tab : "executive_summary"

  return (
    <ProductShell resultsStyle navVariant="freeReport">
      <div className="relative max-w-report mx-auto w-full">
        <SampleReportBadge />
        <LevelstackReportView
          report={SAMPLE_ACTION_ROADMAP}
          defaultTab={defaultTab}
        />
        <div className="px-2 sm:px-0">
          <SampleActionRoadmapCta />
        </div>
        <p className="mt-3 px-2 text-center text-xs italic text-muted-foreground">
          Sample Action Roadmap — all data is illustrative
        </p>
      </div>
    </ProductShell>
  )
}
