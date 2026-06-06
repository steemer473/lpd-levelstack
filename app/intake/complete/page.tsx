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

  const { data: report } = await supabase
    .from("levelstack_reports")
    .select("id")
    .eq("intake_id", intake.id)
    .maybeSingle()

  return (
    <FormPanel className="max-w-lg mx-auto text-center">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Intake received</CardTitle>
          <CardDescription>
            We&apos;re generating your LevelStack report. Open your report page for
            live progress.
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
          {report?.id ? (
            <Button variant="brand" asChild className="w-full sm:w-auto">
              <Link href={`/reports/${report.id}`}>View report progress</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/intake">Back to intake</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </FormPanel>
  )
}
