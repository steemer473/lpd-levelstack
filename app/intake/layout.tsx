import { redirect } from "next/navigation"

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
    <div className="bg-background min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="font-semibold">LevelStack intake</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  )
}
