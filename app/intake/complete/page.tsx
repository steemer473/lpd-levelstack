import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FormPanel } from "@/components/ui/form-panel"
import { getLatestReportForIntake } from "@/lib/reports/get-latest-report-for-intake"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function IntakeCompletePage() {
  const supabase = await createClient()
  if (!supabase) {
    redirect("/auth/sign-in?redirect=/intake")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in?redirect=/intake")
  }

  const { data: intake } = await supabase
    .from("levelstack_intakes")
    .select("id, submitted_at")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!intake) {
    redirect("/intake")
  }

  const report = await getLatestReportForIntake(supabase, intake.id, "id")

  if (report?.id) {
    redirect(`/reports/${report.id}`)
  }

  return (
    <FormPanel className="max-w-lg mx-auto text-center">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Intake received</CardTitle>
          <CardDescription>
            We&apos;re generating your LevelStack report. If progress doesn&apos;t appear
            shortly, contact support with the time below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Submitted{" "}
            {intake.submitted_at
              ? new Date(intake.submitted_at).toLocaleString()
              : "recently"}
            .
          </p>
          <Button variant="outline" asChild>
            <Link href="/free">Back to free snapshot</Link>
          </Button>
        </CardContent>
      </Card>
    </FormPanel>
  )
}
