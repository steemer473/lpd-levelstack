import { notFound } from "next/navigation"

import { LevelstackReportView } from "@/components/report/levelstack-report-view"
import {
  MOBILE_PREVIEW_FREE_REPORT,
  MOBILE_PREVIEW_PAID_REPORT,
} from "@/lib/fixtures/mobile-preview-report"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ tier?: string; modal?: string }>
}

export default async function DevReportPreviewPage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound()
  }

  const { tier, modal } = await searchParams
  const report =
    tier === "paid" ? MOBILE_PREVIEW_PAID_REPORT : MOBILE_PREVIEW_FREE_REPORT

  return (
    <div className="report-page-bg min-h-svh px-4 py-24 sm:px-6">
      <LevelstackReportView
        report={report}
        reportId="mobile-preview"
        defaultUnlockModalOpen={modal === "unlock"}
      />
    </div>
  )
}
