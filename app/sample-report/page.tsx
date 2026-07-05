import type { Metadata } from "next"

import { ProductShell } from "@/components/layout/product-shell"
import { LevelstackReportView } from "@/components/report/levelstack-report-view"
import { SampleReportBadge } from "@/components/report/sample-report-badge"
import { SAMPLE_REPORT } from "@/lib/fixtures/sample-report"

export const metadata: Metadata = {
  title: "Sample Report",
  description:
    "See what a LevelStack Visibility Snapshot looks like — sidebar navigation, executive dashboard, and illustrative findings for a sample business.",
}

export default function SampleReportPage() {
  return (
    <ProductShell resultsStyle navVariant="freeReport">
      <div className="relative max-w-report mx-auto w-full">
        <SampleReportBadge />
        <LevelstackReportView report={SAMPLE_REPORT} />
        <p className="mt-3 px-2 text-center text-xs italic text-muted-foreground">
          Sample report — all data is illustrative
        </p>
      </div>
    </ProductShell>
  )
}
