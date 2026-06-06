import Link from "next/link"
import { BarChart3, CheckCircle2, Shield, Target } from "lucide-react"

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
import { env } from "@/env.mjs"
import { getHubPricingUrl } from "@/lib/urls"

const HIGHLIGHTS = [
  {
    icon: Target,
    name: "Six readiness sections",
    description: "Search, reputation, presence, funnel, competitive, action plan",
  },
  {
    icon: BarChart3,
    name: "Automated research",
    description: "SERP, site signals, and synthesis tailored to your intake",
  },
  {
    icon: Shield,
    name: "Diagnostic only",
    description: "Clear priorities — no ranking or revenue guarantees",
  },
] as const

export default function Page() {
  const supabaseConfigured = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  return (
    <ProductShell
      maxWidth="full"
      overlapHero
      hero={{
        tagline: "LevelStack",
        heading: "Your six-section business readiness report",
        headingHighlight: "readiness report",
        description:
          "Start with a free snapshot or purchase the full report on Level Play Digital, then complete intake and view your diagnostic report.",
        badges: [
          { icon: CheckCircle2, label: "Free snapshot" },
          { icon: Shield, label: "Research-backed" },
          { icon: BarChart3, label: "Action plan" },
        ],
      }}
    >
      <FormPanel className="max-w-md mx-auto mb-16">
        <h2 className="text-xl font-semibold text-center mb-1">Get started</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Sign in after purchase to complete intake and open your report.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="brand" asChild className="w-full">
            <Link href="/free">Get free snapshot</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/sign-in?redirect=/intake">Sign in → full intake</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href={getHubPricingUrl()}>Upgrade — full report $97</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <a
              href="/levelstack-sample-report.html"
              target="_blank"
              rel="noreferrer"
            >
              View sample report
            </a>
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <p className="text-muted-foreground text-xs text-center mt-4">
            Supabase:{" "}
            {supabaseConfigured ? (
              <span className="text-foreground font-medium">configured</span>
            ) : (
              <span>set keys in .env.local</span>
            )}
          </p>
        )}
      </FormPanel>

      <section className="max-w-5xl mx-auto px-2 pb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 gradient-text">
          What LevelStack delivers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HIGHLIGHTS.map(({ icon: Icon, name, description }) => (
            <Card key={name} className="card-hover">
              <CardHeader>
                <Icon className="w-8 h-8 text-brand-orange mb-2" />
                <CardTitle className="text-lg">{name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </ProductShell>
  )
}
