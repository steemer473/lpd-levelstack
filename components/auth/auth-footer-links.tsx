import Link from "next/link"

import { getHubPricingUrl } from "@/lib/urls"

export function AuthFooterLinks() {
  return (
    <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
      <p>
        <Link href="/free" className="text-brand-orange font-medium hover:underline">
          Start a new free snapshot
        </Link>
        {" — use a different email or website"}
      </p>
      <p>
        Need LevelStack?{" "}
        <Link href={getHubPricingUrl()} className="text-brand-orange font-medium hover:underline">
          View pricing
        </Link>
      </p>
    </div>
  )
}
