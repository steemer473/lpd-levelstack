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
import { getAuthCallbackUrl } from "@/lib/urls"

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

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
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/intake"
  const authError = searchParams.get("error")
  const isReportRedirect = redirect.startsWith("/reports/")
  const isUpgradeIntakeRedirect =
    redirect.startsWith("/intake") && redirect.includes("from=upgrade")

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user))
    })
  }, [])

  const authErrorMessage =
    authError === "auth"
      ? "That sign-in link expired or is invalid. Request a new one below."
      : null

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMagicLinkSent(false)

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.")
      return
    }

    setMagicLinkLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setError("Authentication is not configured.")
      setMagicLinkLoading(false)
      return
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: getAuthCallbackUrl(redirect, "email"),
      },
    })

    if (otpError) {
      setError(otpError.message)
      setMagicLinkLoading(false)
      return
    }

    setMagicLinkSent(true)
    setMagicLinkLoading(false)
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.")
      return
    }

    setPasswordLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setError("Authentication is not configured.")
      setPasswordLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setPasswordLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  async function handleSignOut() {
    setSignOutLoading(true)
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    setHasSession(false)
    setSignOutLoading(false)
    router.refresh()
  }

  const loading = passwordLoading || magicLinkLoading

  return (
    <ProductShell
      maxWidth="md"
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: isReportRedirect
          ? "Sign in to view your snapshot"
          : isUpgradeIntakeRedirect
            ? "Sign in to complete your Action Roadmap intake"
            : "Sign in with your hub account",
        headingHighlight: isReportRedirect
          ? "your snapshot"
          : isUpgradeIntakeRedirect
            ? "Action Roadmap intake"
            : "hub account",
        description: isReportRedirect
          ? "Use the email from your free snapshot — we'll send a sign-in link, or use a password if you've set one."
          : isUpgradeIntakeRedirect
            ? "Use the same email from checkout — we'll send a sign-in link to continue your paid intake."
            : "Use the same email and password as your Level Play Digital hub account.",
        badges: [{ icon: Shield, label: "Secure sign-in" }],
      }}
    >
      <FormPanel className="max-w-md mx-auto">
        {authErrorMessage && (
          <p
            className="text-destructive text-sm rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4"
            role="alert"
          >
            {authErrorMessage}
          </p>
        )}

        {hasSession && (
          <p className="text-sm rounded-md bg-muted border border-border p-3 mb-4 text-muted-foreground">
            You&apos;re already signed in.{" "}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signOutLoading}
              className="text-primary font-medium underline underline-offset-4 hover:no-underline"
            >
              {signOutLoading ? "Signing out…" : "Sign out to use a different account"}
            </button>
          </p>
        )}

        {magicLinkSent ? (
          <div
            className="rounded-md bg-muted border border-border p-4 space-y-2"
            role="status"
          >
            <p className="text-sm font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to <strong>{email.trim()}</strong>. It expires
              in 24 hours — open it on this device to continue.
            </p>
            <button
              type="button"
              onClick={() => setMagicLinkSent(false)}
              className="text-sm text-primary underline underline-offset-4 hover:no-underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleMagicLink} className="space-y-4">
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
              <Button
                type="submit"
                variant="brand"
                className="w-full h-11"
                disabled={loading}
              >
                {magicLinkLoading ? "Sending link…" : "Email me a sign-in link"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  or sign in with password
                </span>
              </div>
            </div>

            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href={`/auth/forgot-password?redirect=${encodeURIComponent(redirect)}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
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
                variant="outline"
                className="w-full h-11"
                disabled={loading}
              >
                {passwordLoading ? "Signing in…" : "Sign in with password"}
              </Button>
            </form>
          </>
        )}

        <AuthFooterLinks />
      </FormPanel>
    </ProductShell>
  )
}
