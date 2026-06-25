import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ReportPrintClient } from "@/components/report/report-print-client"
import { reportAccessCookieName } from "@/lib/auth/report-access-token"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"
import { resolveReportAccess } from "@/lib/reports/get-report"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ reportId: string }>
  searchParams: Promise<{ auto?: string }>
}

export default async function ReportPrintPage({ params, searchParams }: PageProps) {
  const { reportId } = await params
  const { auto } = await searchParams

  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let accessToken: string | null = null
  if (!user) {
    const cookieStore = await cookies()
    accessToken = cookieStore.get(reportAccessCookieName(reportId))?.value ?? null
  }

  const report = await resolveReportAccess(reportId, user?.id ?? null, accessToken)
  if (!report) {
    if (!user) {
      redirect(`/auth/sign-in?redirect=/reports/${reportId}/print`)
    }
    redirect(`/reports/${reportId}`)
  }
  if (report.status !== "ready") {
    redirect(`/reports/${reportId}`)
  }

  const parsed = levelstackReportJsonSchema.safeParse(report.report_json)
  if (!parsed.success) {
    redirect(`/reports/${reportId}`)
  }

  return <ReportPrintClient report={parsed.data} autoPrint={auto === "1"} reportId={reportId} />
}
