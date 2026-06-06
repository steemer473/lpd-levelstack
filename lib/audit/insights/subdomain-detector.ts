import type { AuditInsight } from "@/lib/audit/types"
import type { ResearchBundle } from "@/lib/pipeline/research-types"

export function detectSubdomainExposure(bundle: ResearchBundle): AuditInsight[] {
  const flagged = bundle.subdomainExposure.subdomains.filter(
    (s) => s.severity !== "low",
  )

  if (flagged.length === 0) return []

  return [
    {
      id: "subdomain_exposure",
      label: "Subdomain / Orphaned Property Detection",
      severity: flagged.some((s) => s.severity === "high") ? "high" : "medium",
      summary: `${flagged.length} subdomain(s) may be publicly indexed without active maintenance.`,
      details: flagged.map(
        (s) => `${s.hostname}: ${s.reason} (${s.severity} severity)`,
      ),
      remediation: [
        "Add noindex meta tag to unintended subdomains",
        "Block in robots.txt",
        "Request removal in Google Search Console",
        "Redirect via Cloudflare or decommission the host",
      ],
    },
  ]
}
