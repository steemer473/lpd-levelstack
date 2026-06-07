import { Check, Minus } from "lucide-react"
import { PRICING_FEATURES, PRICING_PLANS, type PlanId } from "./pricing-data"
import { PricingCta } from "./pricing-cta"
import { cn } from "@/lib/utils"

/**
 * Variation A — Column-emphasis matrix.
 * Preserves the live table look (bordered grid, muted header, brand-primary
 * checks) but elevates the "Most Popular" plan into a full-height highlighted
 * column with a brand-tinted band, ring, and pinned CTA per column.
 */
export function PricingMatrixVariationA() {
  return (
    <section id="pricing-variation-a" className="scroll-mt-24">
      <h2 className="gradient-text mb-2 text-2xl font-bold sm:text-4xl">
        LevelStack pricing
      </h2>
      <p className="mb-6 text-base leading-relaxed text-muted-foreground">
        Column emphasis — the full report stays front and center.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th scope="col" className="w-[34%] p-3" />
              {PRICING_PLANS.map((plan) => (
                <th
                  key={plan.id}
                  scope="col"
                  className={cn(
                    "relative border-b border-border p-4 text-left align-bottom font-semibold",
                    plan.highlight &&
                      "rounded-t-lg border-x border-t border-[var(--accent-orange)] bg-[color-mix(in_srgb,var(--accent-orange)_8%,white)]",
                  )}
                >
                  {plan.highlight ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  ) : null}
                  <div className="text-base">{plan.name}</div>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {plan.price}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICING_FEATURES.map((feature, rowIndex) => (
              <tr
                key={feature.label}
                className={rowIndex % 2 === 1 ? "bg-muted/20" : "bg-background"}
              >
                <th
                  scope="row"
                  className="border-b border-border p-3 text-left font-medium"
                >
                  {feature.label}
                </th>
                {PRICING_PLANS.map((plan) => (
                  <CellA
                    key={plan.id}
                    available={feature.availability[plan.id]}
                    highlight={plan.highlight}
                  />
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-3" />
              {PRICING_PLANS.map((plan) => (
                <td
                  key={plan.id}
                  className={cn(
                    "p-4 text-center align-top",
                    plan.highlight &&
                      "rounded-b-lg border-x border-b border-[var(--accent-orange)] bg-[color-mix(in_srgb,var(--accent-orange)_8%,white)]",
                  )}
                >
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
        Not sure which to start with? The free snapshot takes two minutes and
        shows you the three most common gaps — no credit card required.
      </p>
    </section>
  )
}

function CellA({
  available,
  highlight,
}: {
  available: boolean
  highlight?: boolean
}) {
  return (
    <td
      className={cn(
        "border-b border-border p-3 text-center",
        highlight &&
          "border-x border-[var(--accent-orange)] bg-[color-mix(in_srgb,var(--accent-orange)_8%,white)]",
      )}
    >
      {available ? (
        <Check className="mx-auto size-4 text-primary" aria-label="Included" />
      ) : (
        <Minus
          className="mx-auto size-4 text-muted-foreground/60"
          aria-label="Not included"
        />
      )}
    </td>
  )
}
