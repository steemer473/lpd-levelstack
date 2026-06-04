import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { getHubPricingUrl } from "@/lib/urls"

export const dynamic = "force-dynamic"

export default async function PurchaseRequiredPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>LevelStack purchase required</CardTitle>
          <CardDescription>
            {user
              ? `Signed in as ${user.email}. We don’t see a completed LevelStack order for this account yet.`
              : "Sign in after you purchase LevelStack on the hub."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Intake unlocks when hub checkout records a completed order with plan{" "}
            <code className="text-xs">levelstack-standard</code> or{" "}
            <code className="text-xs">levelstack-review-call</code> tied to your
            user.
          </p>
          <Button asChild>
            <a href={getHubPricingUrl()}>Purchase on hub</a>
          </Button>
          {!user && (
            <Button variant="outline" asChild>
              <Link href="/auth/sign-in?redirect=/intake">Sign in</Link>
            </Button>
          )}
          {user && (
            <Button variant="outline" asChild>
              <Link href="/auth/sign-in?redirect=/intake">Switch account</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
