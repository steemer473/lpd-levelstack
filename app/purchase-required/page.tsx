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
        heading: "LevelStack access required",
        headingHighlight: "access required",
        description: user
          ? `Signed in as ${user.email}. Start with a free snapshot or purchase the full report.`
          : "Get a free snapshot or purchase the full report on Level Play Digital.",
      }}
    >
      <FormPanel className="max-w-lg mx-auto">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Get started</CardTitle>
            <CardDescription>
              Free snapshot: no purchase required. Full intake requires{" "}
              <code className="text-xs">levelstack-full-report</code> ($97) or{" "}
              <code className="text-xs">levelstack-strategy-call</code> ($297) on the hub.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="brand" asChild>
              <Link href="/free">Get free snapshot</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={getHubPricingUrl()}>Full report — $97</a>
            </Button>
            {!user ? (
              <Button variant="ghost" asChild>
                <Link href="/auth/sign-in?redirect=/intake">Sign in</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </FormPanel>
    </ProductShell>
  )
}
