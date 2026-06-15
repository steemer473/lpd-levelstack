"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Shield } from "lucide-react"
import { Suspense, useState } from "react"

import { AuthFooterLinks } from "@/components/auth/auth-footer-links"
import { ProductShell } from "@/components/layout/product-shell"
import { Button } from "@/components/ui/button"
import { FormPanel } from "@/components/ui/form-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { getPasswordRecoveryCallbackUrl } from "@/lib/urls"

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <ProductShell maxWidth="md">
          <p className="text-muted-foreground text-sm text-center py-12">Loading…</p>
        </ProductShell>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  )
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/intake"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setError("Authentication is not configured.")
      setLoading(false)
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: getPasswordRecoveryCallbackUrl(redirect) },
    )

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <ProductShell
      maxWidth="md"
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: "Reset or create your password",
        headingHighlight: "password",
        description:
          "Enter the email you used for LevelStack. We'll send a link to set or reset your password.",
        badges: [{ icon: Shield, label: "Secure sign-in" }],
      }}
    >
      <FormPanel className="max-w-md mx-auto">
        {sent ? (
          <div
            className="rounded-md bg-muted border border-border p-4 space-y-2"
            role="status"
          >
            <p className="text-sm font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email.trim()}</strong>, we sent a
              password link. Open it on this device to continue.
            </p>
            <Link
              href={`/auth/sign-in?redirect=${encodeURIComponent(redirect)}`}
              className="inline-block text-sm text-primary underline underline-offset-4 hover:no-underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm mb-4">
              Don&apos;t have a password yet? Enter your free snapshot email — you&apos;ll
              set one from the link we send.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  className="h-11"
                />
              </div>

              {error && (
                <p
                  className="text-destructive text-sm rounded-md bg-destructive/10 border border-destructive/20 p-3"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="brand"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? "Sending link…" : "Send password link"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link
                href={`/auth/sign-in?redirect=${encodeURIComponent(redirect)}`}
                className="text-primary hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </>
        )}

        <AuthFooterLinks />
      </FormPanel>
    </ProductShell>
  )
}
