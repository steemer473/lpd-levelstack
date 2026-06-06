import Link from "next/link"
import { redirect } from "next/navigation"

import { ProductShell } from "@/components/layout/product-shell"
import { LevelstackReportView } from "@/components/report/levelstack-report-view"
import { RegenerateReportButton } from "@/components/report/regenerate-report-button"
import { ReportGenerating } from "@/components/report/report-generating"
import { Button } from "@/components/ui/button"
import { FormPanel } from "@/components/ui/form-panel"
import { isDevReportPreviewEnabled } from "@/lib/dev-report-preview"
import { isPlaceholderReport } from "@/lib/pipeline/placeholder-report"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"
import { getReportById, getReportForUser } from "@/lib/reports/get-report"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ reportId: string }> }

export default async function ReportPage({ params }: PageProps) {
  const { reportId } = await params
  const supabase = await createClient()
  if (!supabase) {
    return null
  }

  const devPreview = isDevReportPreviewEnabled()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !devPreview) {
    redirect(`/auth/sign-in?redirect=/reports/${reportId}`)
  }

  const report = user
    ? await getReportForUser(reportId, user.id)
    : await getReportById(reportId)
  if (!report) {
    return (
      <ProductShell maxWidth="md" showSignOut resultsStyle>
        <FormPanel className="max-w-lg mx-auto text-center">
          <h1 className="text-xl font-semibold mb-2">Report not found</h1>
          <p className="text-muted-foreground text-sm mb-4">
            This report does not exist or you do not have access.
          </p>
          <Button asChild variant="outline">
            <Link href="/intake">Back to intake</Link>
          </Button>
        </FormPanel>
      </ProductShell>
    )
  }

  if (report.status === "failed") {
    return (
      <ProductShell maxWidth="md" showSignOut resultsStyle>
        <FormPanel className="max-w-lg mx-auto">
          <h1 className="text-xl font-semibold mb-2">Report generation failed</h1>
          <p className="text-muted-foreground text-sm mb-4">
            {report.error_message ?? "Something went wrong while building your report."}
          </p>
          <Button asChild variant="brand">
            <Link href="/intake">Back to intake</Link>
          </Button>
        </FormPanel>
      </ProductShell>
    )
  }

  const intakeClient = user ? supabase : createAdminClient()
  const { data: intake } = intakeClient
    ? await intakeClient
        .from("levelstack_intakes")
        .select("form_data")
        .eq("id", report.intake_id)
        .maybeSingle()
    : { data: null }

  const businessLabel =
    (intake?.form_data as { primaryBusinessName?: string } | null)
      ?.primaryBusinessName ?? "your business"

  if (report.status === "pending" || report.status === "generating") {
    return (
      <ProductShell showSignOut={Boolean(user)} resultsStyle>
        <FormPanel className="max-w-2xl mx-auto w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Building your report</h1>
            <p className="text-muted-foreground mt-2">
              Researching digital presence for{" "}
              <span className="font-medium text-foreground">{businessLabel}</span>
            </p>
          </div>
          <ReportGenerating reportId={reportId} businessLabel={businessLabel} />
        </FormPanel>
      </ProductShell>
    )
  }

  const parsed = levelstackReportJsonSchema.safeParse(report.report_json)
  if (!parsed.success) {
    return (
      <ProductShell maxWidth="md" showSignOut resultsStyle>
        <p className="text-muted-foreground text-sm text-center py-16">
          Report data is unavailable. Please contact support.
        </p>
      </ProductShell>
    )
  }

  const isDev = process.env.NODE_ENV === "development"
  const isStalePlaceholder = isPlaceholderReport(parsed.data)

  return (
    <ProductShell showSignOut={Boolean(user)} resultsStyle>
      <div className="space-y-4 w-full">
        {isDev && user && (
          <RegenerateReportButton
            reportId={reportId}
            isStalePlaceholder={isStalePlaceholder}
          />
        )}
        <LevelstackReportView report={parsed.data} reportId={reportId} />
      </div>
    </ProductShell>
  )
}
