import Link from "next/link"

import { getHubPricingUrl } from "@/lib/urls"

/** Matches seo-foundation-audit /results/[auditId] footer */
export function SiteFooter() {
  return (
    <footer className="container mx-auto w-full max-w-report px-4 sm:px-6 py-8 border-t border-border bg-background mt-auto">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Level Play Digital ·{" "}
            <span className="font-medium text-brand-orange">LevelStack</span>
          </p>
          <div className="flex gap-6">
            <Link
              href={getHubPricingUrl()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
            >
              levelplaydigital.com
            </Link>
            <a
              href="https://levelplaydigital.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href="https://levelplaydigital.com/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
            >
              Terms of Service
            </a>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Diagnostic report — you execute fixes. LevelStack does not guarantee rankings or
          revenue outcomes.
        </p>
      </div>
    </footer>
  )
}
