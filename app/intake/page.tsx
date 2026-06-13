import Link from "next/link"
import { redirect } from "next/navigation"

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
import { requirePaidIntakeAccess } from "@/lib/levelstack-access"
import { levelstackIntakeDefaults, type LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function IntakePage() {
  const supabase = await createClient()
  if (!supabase) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in?redirect=/intake")
  }

  const paidAccess = await requirePaidIntakeAccess(supabase, user.id)

  const { data: existing } = await supabase
    .from("levelstack_intakes")
    .select("id, submitted_at, form_data")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { data: existingReport } = await supabase
      .from("levelstack_reports")
      .select("id, report_tier")
      .eq("intake_id", existing.id)
      .maybeSingle()

    const isFreeUpgrade =
      paidAccess && existingReport?.report_tier === "free_snapshot"

    if (!isFreeUpgrade) {
      return (
        <FormPanel className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle>Intake already submitted</CardTitle>
              <CardDescription>
                Your report is being generated or is ready to view — no need to submit
                again.
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

    const priorForm = existing.form_data as Partial<LevelstackIntakeFormValues> | null
    const defaultValues: LevelstackIntakeFormValues = {
      ...levelstackIntakeDefaults,
      ...priorForm,
      priorBusinessNames:
        priorForm?.priorBusinessNames?.length
          ? priorForm.priorBusinessNames
          : levelstackIntakeDefaults.priorBusinessNames,
    }

    return (
      <FormPanel className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Complete your full report intake</h2>
          <p className="text-muted-foreground text-sm mt-1">
            You already have a free snapshot. Add the details below so we can generate your
            full LevelStack report.
          </p>
        </div>
        <LevelstackIntakeForm defaultValues={defaultValues} />
      </FormPanel>
    )
  }

  return (
    <FormPanel className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Start Your LevelStack Intake</h2>
        <p className="text-muted-foreground text-sm mt-1">
          All fields are required. We use this only to build your diagnostic report.
        </p>
      </div>
      <LevelstackIntakeForm />
    </FormPanel>
  )
}
