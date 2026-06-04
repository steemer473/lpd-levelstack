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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intake received</CardTitle>
        <CardDescription>
          We&apos;re generating your LevelStack report. Progress updates will appear
          in your account when the report is ready — we don&apos;t guarantee a fixed
          public turnaround time.
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
          <Link href="/">Back to home</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
