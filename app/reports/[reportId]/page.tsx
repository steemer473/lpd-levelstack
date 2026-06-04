import Link from "next/link"
import { redirect } from "next/navigation"

import { LevelstackReportView } from "@/components/report/levelstack-report-view"
import { RegenerateReportButton } from "@/components/report/regenerate-report-button"
import { ReportGenerating } from "@/components/report/report-generating"
import { isPlaceholderReport } from "@/lib/pipeline/placeholder-report"
import { Button } from "@/components/ui/button"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"
import { getReportForUser } from "@/lib/reports/get-report"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ reportId: string }> }

export default async function ReportPage({ params }: PageProps) {
  const { reportId } = await params
  const supabase = await createClient()
  if (!supabase) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/sign-in?redirect=/reports/${reportId}`)
  }

  const report = await getReportForUser(reportId, user.id)
  if (!report) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center space-y-4">
        <h1 className="text-xl font-semibold">Report not found</h1>
        <p className="text-muted-foreground text-sm">
          This report does not exist or you do not have access.
        </p>
        <Button asChild variant="outline">
          <Link href="/intake">Back to intake</Link>
        </Button>
      </div>
    )
  }

  if (report.status === "failed") {
    return (
      <div className="mx-auto max-w-lg py-16 space-y-4">
        <h1 className="text-xl font-semibold">Report generation failed</h1>
        <p className="text-muted-foreground text-sm">
          {report.error_message ?? "Something went wrong while building your report."}
        </p>
        <Button asChild variant="outline">
          <Link href="/intake">Back to intake</Link>
        </Button>
      </div>
    )
  }

  const { data: intake } = await supabase
    .from("levelstack_intakes")
    .select("form_data")
    .eq("id", report.intake_id)
    .maybeSingle()

  const businessLabel =
    (intake?.form_data as { primaryBusinessName?: string } | null)
      ?.primaryBusinessName ?? "your business"

  if (report.status === "pending" || report.status === "generating") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ReportGenerating reportId={reportId} businessLabel={businessLabel} />
      </div>
    )
  }

  const parsed = levelstackReportJsonSchema.safeParse(report.report_json)
  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted-foreground text-sm">
          Report data is unavailable. Please contact support.
        </p>
      </div>
    )
  }

  const isDev = process.env.NODE_ENV === "development"
  const isStalePlaceholder = isPlaceholderReport(parsed.data)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {isDev && (
        <RegenerateReportButton
          reportId={reportId}
          isStalePlaceholder={isStalePlaceholder}
        />
      )}
      <LevelstackReportView report={parsed.data} />
    </div>
  )
}
