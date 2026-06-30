import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ProductShell } from "@/components/layout/product-shell"
import { LevelstackReportView } from "@/components/report/levelstack-report-view"
import { RegenerateReportButton } from "@/components/report/regenerate-report-button"
import { ReportGenerating } from "@/components/report/report-generating"
import { RetryReportButton } from "@/components/report/retry-report-button"
import { Button } from "@/components/ui/button"
import { FormPanel } from "@/components/ui/form-panel"
import { reportAccessCookieName } from "@/lib/auth/report-access-token"
import { isDevReportPreviewEnabled } from "@/lib/dev-report-preview"
import { requirePaidIntakeAccess } from "@/lib/levelstack-access"
import { isPlaceholderReport } from "@/lib/pipeline/placeholder-report"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"
import { resolveReportAccess } from "@/lib/reports/get-report"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ reportId: string }>
  searchParams: Promise<{ view?: string }>
}

export default async function ReportPage({ params, searchParams }: PageProps) {
  const { reportId } = await params
  const { view } = await searchParams
  const supabase = await createClient()
  if (!supabase) {
    return null
  }

  const devPreview = isDevReportPreviewEnabled()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Possession-based access: the access route sets this HttpOnly cookie after
  // verifying an emailed token, so token recipients can view without a session.
  let accessToken: string | null = null
  if (!user) {
    const cookieStore = await cookies()
    accessToken = cookieStore.get(reportAccessCookieName(reportId))?.value ?? null
  }

  const report = await resolveReportAccess(reportId, user?.id ?? null, accessToken)
  if (!report) {
    if (!user && !devPreview) {
      redirect(`/auth/sign-in?redirect=/reports/${reportId}`)
    }
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
    const isDev = process.env.NODE_ENV === "development"
    const paidAccess = user ? await requirePaidIntakeAccess(supabase, user.id) : false
    const hasFreeBackup = Boolean(report.free_snapshot_json)

    return (
      <ProductShell maxWidth="md" showSignOut={Boolean(user)} resultsStyle>
        <FormPanel className="max-w-lg mx-auto space-y-4">
          <div>
            <h1 className="text-xl font-semibold mb-2">Report generation failed</h1>
            <p className="text-muted-foreground text-sm">
              {paidAccess
                ? "Generation hit a snag — your purchase is safe. You can retry below."
                : (report.error_message ??
                  "Something went wrong while building your report.")}
            </p>
          </div>
          {paidAccess ? <RetryReportButton reportId={reportId} /> : null}
          {hasFreeBackup ? (
            <Button asChild variant="outline">
              <Link href={`/reports/${reportId}?view=snapshot`}>View your free snapshot</Link>
            </Button>
          ) : null}
          {isDev && (devPreview || user) ? (
            <RegenerateReportButton reportId={reportId} />
          ) : null}
          {!paidAccess ? (
            <Button asChild variant="brand">
              <Link href="/intake">Back to intake</Link>
            </Button>
          ) : null}
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

  const parsed = levelstackReportJsonSchema.safeParse(
    view === "snapshot" && report.free_snapshot_json
      ? report.free_snapshot_json
      : report.report_json,
  )
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
  const paidPendingIntake =
    user &&
    report.report_tier === "free_snapshot" &&
    report.status === "ready" &&
    (await requirePaidIntakeAccess(supabase, user.id))

  return (
    <ProductShell showSignOut={Boolean(user)} resultsStyle>
      <div className="space-y-4 w-full">
        {view === "snapshot" && report.free_snapshot_json ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 px-4 py-3 text-sm">
            Viewing your free snapshot backup.{" "}
            <Link href={`/reports/${reportId}`} className="text-brand-orange font-medium hover:underline">
              Return to report status
            </Link>
          </div>
        ) : null}
        {paidPendingIntake ? (
          <div className="rounded-lg border border-brand-orange/30 bg-brand-orange/5 px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium">Payment received — complete intake to unlock your Action Roadmap.</p>
              <p className="text-muted-foreground mt-0.5">
                Takes about 3 minutes; your Action Roadmap generates automatically after submit.
              </p>
            </div>
            <Button variant="brand" asChild className="shrink-0">
              <Link href={`/intake?from=upgrade&reportId=${reportId}`}>Complete intake →</Link>
            </Button>
          </div>
        ) : null}
        {isDev && (devPreview || user) && (
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
