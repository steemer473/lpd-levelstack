"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Shield } from "lucide-react"
import { Suspense, useEffect, useState } from "react"

import { AuthFooterLinks } from "@/components/auth/auth-footer-links"
import { ProductShell } from "@/components/layout/product-shell"
import { Button } from "@/components/ui/button"
import { FormPanel } from "@/components/ui/form-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const MIN_PASSWORD_LENGTH = 6

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <ProductShell maxWidth="md">
          <p className="text-muted-foreground text-sm text-center py-12">Loading…</p>
        </ProductShell>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  )
}

function UpdatePasswordForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/intake"
  const supabase = createClient()

  if (!supabase) {
    return <UpdatePasswordNoSession redirect={redirect} />
  }

  return <UpdatePasswordFormInner redirect={redirect} supabase={supabase} />
}

function UpdatePasswordNoSession({ redirect }: { redirect: string }) {
  return (
    <ProductShell
      maxWidth="md"
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: "Set your password",
        headingHighlight: "password",
        description: "Your reset link may have expired.",
        badges: [{ icon: Shield, label: "Secure sign-in" }],
      }}
    >
      <FormPanel className="max-w-md mx-auto">
        <p className="text-sm text-muted-foreground mb-4" role="alert">
          Authentication is not configured. Request a new password link to continue.
        </p>
        <Link
          href={`/auth/forgot-password?redirect=${encodeURIComponent(redirect)}`}
          className="text-primary font-medium hover:underline"
        >
          Request a new password link
        </Link>
        <AuthFooterLinks />
      </FormPanel>
    </ProductShell>
  )
}

function UpdatePasswordFormInner({
  redirect,
  supabase,
}: {
  redirect: string
  supabase: NonNullable<ReturnType<typeof createClient>>
}) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user))
      setSessionChecked(true)
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  if (!sessionChecked) {
    return (
      <ProductShell maxWidth="md">
        <p className="text-muted-foreground text-sm text-center py-12">Loading…</p>
      </ProductShell>
    )
  }

  if (!hasSession) {
    return (
      <ProductShell
        maxWidth="md"
        overlapHero
        hero={{
          tagline: "LevelStack",
          heading: "Set your password",
          headingHighlight: "password",
          description: "Your reset link may have expired.",
          badges: [{ icon: Shield, label: "Secure sign-in" }],
        }}
      >
        <FormPanel className="max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-4" role="alert">
            No active session. Request a new password link to continue.
          </p>
          <Link
            href={`/auth/forgot-password?redirect=${encodeURIComponent(redirect)}`}
            className="text-primary font-medium hover:underline"
          >
            Request a new password link
          </Link>
          <AuthFooterLinks />
        </FormPanel>
      </ProductShell>
    )
  }

  return (
    <ProductShell
      maxWidth="md"
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: "Set your new password",
        headingHighlight: "new password",
        description: "Choose a password for your LevelStack account.",
        badges: [{ icon: Shield, label: "Secure sign-in" }],
      }}
    >
      <FormPanel className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                disabled={loading}
                minLength={MIN_PASSWORD_LENGTH}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={MIN_PASSWORD_LENGTH}
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

          <Button type="submit" variant="brand" className="w-full h-11" disabled={loading}>
            {loading ? "Saving…" : "Save password"}
          </Button>
        </form>

        <AuthFooterLinks />
      </FormPanel>
    </ProductShell>
  )
}
