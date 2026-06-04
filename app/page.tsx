import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { env } from "@/env.mjs"

export default function Page() {
  const supabaseConfigured = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>LevelStack</CardTitle>
            <Badge variant="secondary">Phase 0</Badge>
          </div>
          <CardDescription>
            Product delivery app — purchase and checkout run on the commercial
            hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p>
            Scaffold is ready. Next: configure Supabase env vars, apply{" "}
            <code className="text-xs">supabase/migrations/</code>, then Phase 1
            (entitlement + <code className="text-xs">/intake</code>).
          </p>
          <p className="text-muted-foreground">
            Supabase:{" "}
            {supabaseConfigured ? (
              <span className="text-foreground">configured</span>
            ) : (
              <span>set keys in .env.local (see .env.example)</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/auth/sign-in?redirect=/intake">Sign in → intake</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://levelplaydigital.com/platform/levelstack#pricing">
                Purchase on hub
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="/levelstack-sample-report.html" target="_blank" rel="noreferrer">
                Sample report
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
