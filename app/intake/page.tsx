import Link from "next/link"
import { redirect } from "next/navigation"
import { after } from "next/server"

import { ConfirmingPaymentPoll } from "@/components/intake/confirming-payment-poll"
import { LevelstackIntakeForm } from "@/components/intake/levelstack-intake-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FormPanel } from "@/components/ui/form-panel"
import { sendUpgradeNotifyEmailsIfNeeded } from "@/lib/email/upgrade-notify"
import { getLatestReportForIntake } from "@/lib/reports/get-latest-report-for-intake"
import { sanitizeFreeSnapshotPrefill } from "@/lib/intake/upgrade-prefill"
import { levelstackIntakeDefaults, type LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { getLevelStackPlanId, requirePaidIntakeAccess } from "@/lib/levelstack-access"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ from?: string; reportId?: string }>
}

export default async function IntakePage({ searchParams }: PageProps) {
  const { from, reportId: queryReportId } = await searchParams
  const fromUpgrade = from === "upgrade"

  const supabase = await createClient()
  if (!supabase) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectPath = fromUpgrade
      ? `/intake?from=upgrade${queryReportId ? `&reportId=${queryReportId}` : ""}`
      : "/intake"
    redirect(`/auth/sign-in?redirect=${encodeURIComponent(redirectPath)}`)
  }

  const paidAccess = await requirePaidIntakeAccess(supabase, user.id)

  if (fromUpgrade && !paidAccess) {
    return (
      <FormPanel className="max-w-2xl mx-auto">
        <ConfirmingPaymentPoll reportId={queryReportId} />
      </FormPanel>
    )
  }

  if (queryReportId) {
    const { data: linkedReport } = await supabase
      .from("levelstack_reports")
      .select("id, report_tier, status")
      .eq("id", queryReportId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!linkedReport) {
      return (
        <FormPanel className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle>Report not found</CardTitle>
              <CardDescription>
                We couldn&apos;t find that report on your account. You can still complete intake
                for a new Action Roadmap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="brand" asChild>
                <Link href="/intake">Continue to intake</Link>
              </Button>
            </CardContent>
          </Card>
        </FormPanel>
      )
    }
  }

  const { data: existing } = await supabase
    .from("levelstack_intakes")
    .select("id, submitted_at, form_data")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const existingReport = await getLatestReportForIntake(supabase, existing.id)

    const isFreeUpgrade =
      paidAccess && existingReport?.report_tier === "free_snapshot"

    const reportGenerating =
      existingReport?.status === "pending" || existingReport?.status === "generating"

    if (existingReport?.report_tier === "free_snapshot" && !paidAccess && existingReport.id) {
      redirect(`/reports/${existingReport.id}`)
    }

    if (!isFreeUpgrade) {
      if (existingReport?.status === "failed" && paidAccess) {
        return (
          <FormPanel className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle>Report generation failed</CardTitle>
                <CardDescription>
                  Your intake is complete. Retry generation from your report page — your purchase
                  is safe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {existingReport?.id ? (
                  <Button variant="brand" asChild>
                    <Link href={`/reports/${existingReport.id}`}>Go to your report</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </FormPanel>
        )
      }

      return (
        <FormPanel className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle>Intake already submitted</CardTitle>
              <CardDescription>
                {reportGenerating
                  ? "your Action Roadmap is generating — no need to submit again."
                  : "Your report is ready to view — no need to submit again."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingReport?.id ? (
                <Button variant="brand" asChild>
                  <Link href={`/reports/${existingReport.id}`}>View your report</Link>
                </Button>
              ) : (
                <Button variant="brand" asChild>
                  <Link href="/intake/complete">View confirmation</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </FormPanel>
      )
    }

    const defaultValues: LevelstackIntakeFormValues = sanitizeFreeSnapshotPrefill(
      existing.form_data as Partial<LevelstackIntakeFormValues>,
    )

    const formData = existing.form_data as
      | { primaryBusinessName?: string; ownerName?: string }
      | null
    const bannerReportId = queryReportId ?? existingReport?.id
    const businessName = formData?.primaryBusinessName ?? "your business"
    const ownerName = formData?.ownerName

    if (fromUpgrade && bannerReportId && user.email) {
      const planId = (await getLevelStackPlanId(supabase, user.id)) ?? "levelstack-full-report"
      after(() =>
        sendUpgradeNotifyEmailsIfNeeded({
          reportId: bannerReportId,
          userId: user.id,
          email: user.email!,
          planId,
          businessName,
          ownerName,
        }).catch((err) => console.error("[upgrade-notify]", err)),
      )
    }

    return (
      <FormPanel className="max-w-3xl mx-auto">
        {fromUpgrade && bannerReportId ? (
          <div className="mb-4 rounded-lg border border-brand-orange/30 bg-brand-orange/5 px-4 py-3 text-sm">
            <p className="font-medium">Payment received — complete intake to unlock your Action Roadmap.</p>
            <p className="text-muted-foreground mt-1">
              Your free snapshot is still available while you finish these details (~3 minutes).
            </p>
            <Link
              href={`/reports/${bannerReportId}`}
              className="text-brand-orange text-xs font-medium mt-2 inline-block hover:underline"
            >
              View your snapshot →
            </Link>
          </div>
        ) : null}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Complete your Action Roadmap intake</h2>
          <p className="text-muted-foreground text-sm mt-1">
            You already have a free snapshot. Add the details below so we can generate your full
            LevelStack report.
          </p>
        </div>
        <LevelstackIntakeForm defaultValues={defaultValues} />
      </FormPanel>
    )
  }

  return (
    <FormPanel className="max-w-3xl mx-auto">
      {fromUpgrade ? (
        <div className="mb-4 rounded-lg border border-brand-orange/30 bg-brand-orange/5 px-4 py-3 text-sm">
          <p className="font-medium">Payment received — let&apos;s build your Action Roadmap.</p>
          <p className="text-muted-foreground mt-1">
            All fields are required. This usually takes about 3 minutes.
          </p>
        </div>
      ) : null}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Start Your LevelStack Intake</h2>
        <p className="text-muted-foreground text-sm mt-1">
          All fields are required. We use this only to personalize your Action Roadmap.
        </p>
      </div>
      <LevelstackIntakeForm />
    </FormPanel>
  )
}
