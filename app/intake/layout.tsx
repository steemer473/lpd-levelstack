import { CheckCircle2, Clock, Shield } from "lucide-react"
import { redirect } from "next/navigation"

import { ProductShell } from "@/components/layout/product-shell"
import { hasLevelStackAccess } from "@/lib/levelstack-access"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function IntakeLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  const hasAccess = await hasLevelStackAccess(supabase, user.id)
  if (!hasAccess) {
    redirect("/purchase-required")
  }

  return (
    <ProductShell
      maxWidth="lg"
      showSignOut
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: "Complete your business intake questionnaire",
        headingHighlight: "business intake",
        description:
          "Plan for 10–15 minutes. Your answers anchor automated research across six readiness sections.",
        badges: [
          { icon: Clock, label: "10–15 minutes" },
          { icon: Shield, label: "Secure & private" },
          { icon: CheckCircle2, label: "One-time submit" },
        ],
      }}
    >
      {children}
    </ProductShell>
  )
}
