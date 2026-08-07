import Link from "next/link"

import { SITE_FOOTER_TAGLINE } from "@/lib/report/outcome-copy"
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
          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-6">
            <Link
              href={getHubPricingUrl()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline text-center"
            >
              levelplaydigital.com
            </Link>
            <a
              href="https://levelplaydigital.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline text-center"
            >
              Privacy Policy
            </a>
            <a
              href="https://levelplaydigital.com/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline text-center"
            >
              Terms of Service
            </a>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {SITE_FOOTER_TAGLINE}
        </p>
      </div>
    </footer>
  )
}
