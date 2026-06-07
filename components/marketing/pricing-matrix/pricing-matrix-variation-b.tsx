import { Check, Minus } from "lucide-react"
import { PRICING_FEATURES, PRICING_PLANS, type PricingFeature } from "./pricing-data"
import { PricingCta } from "./pricing-cta"
import { cn } from "@/lib/utils"

const GROUP_ORDER: PricingFeature["group"][] = [
  "Included in Free Snapshot",
  "Full Report",
  "Report + Call",
]

/**
 * Variation B — Grouped row-emphasis matrix.
 * Same bordered grid and tokens, but features are organized under tinted
 * section group headers (mirrors the report's "what's included" structure),
 * giving row-level emphasis rather than column highlighting.
 */
export function PricingMatrixVariationB() {
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    features: PRICING_FEATURES.filter((f) => f.group === group),
  })).filter((g) => g.features.length > 0)

  return (
    <section id="pricing-variation-b" className="scroll-mt-24">
      <h2 className="gradient-text mb-2 text-2xl font-bold sm:text-4xl">
        LevelStack pricing
      </h2>
      <p className="mb-6 text-base leading-relaxed text-muted-foreground">
        Grouped by what each tier unlocks across the six report sections.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border border-border text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th scope="col" className="border border-border p-3 text-left font-semibold" />
              {PRICING_PLANS.map((plan) => (
                <th
                  key={plan.id}
                  scope="col"
                  className="relative border border-border p-3 text-center font-semibold"
                >
                  {plan.highlight ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  ) : null}
                  {plan.name}
                  <div className="mt-1 text-sm font-normal text-muted-foreground">
                    {plan.price}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ group, features }) => (
              <GroupBlockB key={group} group={group} features={features} />
            ))}
            <tr>
              <th scope="row" className="border border-border p-3 text-left font-medium">
                {" "}
              </th>
              {PRICING_PLANS.map((plan) => (
                <td key={plan.id} className="border border-border p-3 text-center">
                  <PricingCta href={plan.href} ariaLabel={plan.ariaLabel}>
                    {plan.cta}
                  </PricingCta>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
        Three sections are free. Three unlock with the full report — most
        business owners have blind spots in more than one.
      </p>
    </section>
  )
}

function GroupBlockB({
  group,
  features,
}: {
  group: PricingFeature["group"]
  features: PricingFeature[]
}) {
  return (
    <>
      <tr>
        <th
          scope="colgroup"
          colSpan={PRICING_PLANS.length + 1}
          className="border border-border bg-[color-mix(in_srgb,var(--accent-blue)_10%,white)] p-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground"
        >
          {group}
        </th>
      </tr>
      {features.map((feature, rowIndex) => (
        <tr
          key={feature.label}
          className={rowIndex % 2 === 1 ? "bg-muted/20" : "bg-background"}
        >
          <th scope="row" className="border border-border p-3 text-left font-medium">
            {feature.label}
          </th>
          {PRICING_PLANS.map((plan) => (
            <td key={plan.id} className="border border-border p-3 text-center">
              {feature.availability[plan.id] ? (
                <Check className="mx-auto size-4 text-primary" aria-label="Included" />
              ) : (
                <Minus
                  className={cn("mx-auto size-4 text-muted-foreground/60")}
                  aria-label="Not included"
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
