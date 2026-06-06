import Link from "next/link"

import { ProductShell } from "@/components/layout/product-shell"
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
import { getHubPricingUrl } from "@/lib/urls"

export const dynamic = "force-dynamic"

export default async function PurchaseRequiredPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } }

  return (
    <ProductShell
      maxWidth="md"
      showSignOut={Boolean(user)}
      overlapHero
      hero={{
        tagline: "Access",
        heading: "LevelStack purchase required",
        headingHighlight: "purchase required",
        description: user
          ? `Signed in as ${user.email}. Complete checkout on the hub to unlock intake.`
          : "Purchase LevelStack on Level Play Digital, then sign in here.",
      }}
    >
      <FormPanel className="max-w-lg mx-auto">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Unlock intake</CardTitle>
            <CardDescription>
              Intake opens when hub checkout records a completed order with plan{" "}
              <code className="text-xs">levelstack-standard</code> or{" "}
              <code className="text-xs">levelstack-review-call</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="brand" asChild>
              <a href={getHubPricingUrl()}>Purchase on hub</a>
            </Button>
            {!user ? (
              <Button variant="outline" asChild>
                <Link href="/auth/sign-in?redirect=/intake">Sign in</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/auth/sign-in?redirect=/intake">Switch account</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </FormPanel>
    </ProductShell>
  )
}
