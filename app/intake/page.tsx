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

  const { data: existing } = await supabase
    .from("levelstack_intakes")
    .select("id, submitted_at")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { data: existingReport } = await supabase
      .from("levelstack_reports")
      .select("id")
      .eq("intake_id", existing.id)
      .maybeSingle()

    return (
      <Card>
        <CardHeader>
          <CardTitle>Intake already submitted</CardTitle>
          <CardDescription>
            Your report is being generated or is ready to view — no need to submit
            again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingReport?.id ? (
            <Button asChild>
              <Link href={`/reports/${existingReport.id}`}>View your report</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/intake/complete">View confirmation</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Business intake questionnaire
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Plan for 10–15 minutes. All fields are required. Your answers anchor the
          automated research that builds your LevelStack report.
        </p>
      </div>
      <LevelstackIntakeForm />
    </div>
  )
}
