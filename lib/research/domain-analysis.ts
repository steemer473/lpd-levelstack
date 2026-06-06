import type { NameCollision, SubdomainFinding, InfrastructureLeakInstance } from "@/lib/pipeline/research-types"
import type { SerpOrganicResult } from "@/lib/research/serp"
import type { InsightSeverity } from "@/lib/audit/types"

const LEAK_PATTERNS: Array<{
  pattern: RegExp
  finding: string
  severity: "low" | "medium" | "high"
  remediation: string
}> = [
  {
    pattern: /whmcs|cpanel|plesk|webmail|phpmyadmin/i,
    finding: "Admin/login panel indexed",
    severity: "high",
    remediation: "Block in robots.txt and add noindex; restrict via IP allowlist",
  },
  {
    pattern: /staging\.|dev\.|test\.|demo\./i,
    finding: "Staging or dev environment indexed",
    severity: "high",
    remediation: "Add noindex, password-protect, or decommission the environment",
  },
  {
    pattern: /wp-content\/uploads\/.*default|hello world|sample page/i,
    finding: "Default CMS content visible",
    severity: "medium",
    remediation: "Remove default pages and request re-crawl in Search Console",
  },
  {
    pattern: /^http:\/\//i,
    finding: "Non-SSL URL indexed",
    severity: "medium",
    remediation: "Enforce HTTPS redirects and update canonical URLs",
  },
]

export async function enumerateSubdomains(domain: string): Promise<string[]> {
  const bare = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  if (!bare) return []

  try {
    const res = await fetch(`https://crt.sh/?q=%.${bare}&output=json`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return []

    const data = (await res.json()) as Array<{ name_value?: string }>
    const hosts = new Set<string>()
    for (const row of data.slice(0, 100)) {
      const names = row.name_value?.split("\n") ?? []
      for (const name of names) {
        const clean = name.replace(/^\*\./, "").toLowerCase()
        if (clean.endsWith(bare) && clean !== bare && clean !== `www.${bare}`) {
          hosts.add(clean)
        }
      }
    }
    return [...hosts].slice(0, 20)
  } catch {
    return []
  }
}

export function analyzeSubdomains(
  subdomains: string[],
  serpResults: SerpOrganicResult[],
): SubdomainFinding[] {
  const findings: SubdomainFinding[] = []

  for (const host of subdomains) {
    const inSerp = serpResults.some((r) => r.link.includes(host))
    if (!inSerp) continue

    let severity: SubdomainFinding["severity"] = "low"
    let reason = "Indexed subdomain detected"

    if (/staging|dev|test|admin|login|cpanel|whmcs/i.test(host)) {
      severity = "high"
      reason = "Potentially sensitive subdomain indexed"
    } else if (/blog|shop|old|legacy/i.test(host)) {
      severity = "medium"
      reason = "Secondary subdomain may be orphaned"
    }

    findings.push({ hostname: host, reason, severity })
  }

  return findings
}

export function detectNameCollisionsFromSerp(
  brandName: string,
  ownedHost: string | null,
  results: SerpOrganicResult[],
): { collisions: NameCollision[]; severity: InsightSeverity } {
  const brandLower = brandName.toLowerCase()
  const collisions: NameCollision[] = []

  for (const result of results.slice(0, 10)) {
    if (ownedHost && result.link.includes(ownedHost)) continue
    const titleLower = result.title.toLowerCase()
    if (!titleLower.includes(brandLower.split(" ")[0] ?? brandLower)) continue

    let type: NameCollision["type"] = "adjacent_brand"
    if (/inc|llc|corp|company|services|agency|group/i.test(result.title)) {
      type = "direct_competitor"
    } else if (titleLower.split(/\s+/).length <= 2) {
      type = "generic_term"
    }

    collisions.push({ title: result.title, link: result.link, type })
  }

  const count = collisions.length
  const severity: InsightSeverity =
    count <= 1 ? "low" : count <= 3 ? "medium" : "high"

  return { collisions, severity }
}

export function detectInfrastructureFromSerp(
  results: SerpOrganicResult[],
): InfrastructureLeakInstance[] {
  const instances: InfrastructureLeakInstance[] = []
  const seen = new Set<string>()

  for (const result of results) {
    for (const rule of LEAK_PATTERNS) {
      if (
        (rule.pattern.test(result.link) || rule.pattern.test(result.snippet)) &&
        !seen.has(result.link)
      ) {
        seen.add(result.link)
        instances.push({
          url: result.link,
          finding: rule.finding,
          severity: rule.severity,
          remediation: rule.remediation,
        })
      }
    }
  }

  return instances
}
