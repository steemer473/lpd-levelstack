"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield } from "lucide-react"
import { Suspense, useState } from "react"

import { ProductShell } from "@/components/layout/product-shell"
import { Button } from "@/components/ui/button"
import { FormPanel } from "@/components/ui/form-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { getHubPricingUrl } from "@/lib/urls"

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <ProductShell maxWidth="md">
          <p className="text-muted-foreground text-sm text-center py-12">Loading…</p>
        </ProductShell>
      }
    >
      <SignInForm />
    </Suspense>
  )
}

function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/intake"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    if (!supabase) {
      setError("Authentication is not configured.")
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <ProductShell
      maxWidth="md"
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: "Sign in to your LevelStack account",
        headingHighlight: "LevelStack account",
        description:
          "Use the same email and password as your Level Play Digital hub account.",
        badges: [{ icon: Shield, label: "Secure sign-in" }],
      }}
    >
      <FormPanel className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={loading}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm rounded-md bg-destructive/10 border border-destructive/20 p-3">
              {error}
            </p>
          )}
          <Button type="submit" variant="brand" className="w-full h-11" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Need LevelStack?{" "}
          <Link
            href={getHubPricingUrl()}
            className="text-brand-orange font-medium hover:underline"
          >
            View pricing
          </Link>
        </p>
      </FormPanel>
    </ProductShell>
  )
}
