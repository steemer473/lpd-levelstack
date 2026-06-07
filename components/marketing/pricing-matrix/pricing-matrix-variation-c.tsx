import { Check, Minus } from "lucide-react"
import { PRICING_FEATURES, PRICING_PLANS } from "./pricing-data"
import { PricingCta } from "./pricing-cta"
import { cn } from "@/lib/utils"

/**
 * Variation C — Card-grid matrix.
 * Same data and tokens, but the matrix is restructured from a grid into three
 * comparison cards. Each card lists every feature with an inline check / dash,
 * and the highlighted plan gets a brand ring + "Most Popular" ribbon.
 */
export function PricingMatrixVariationC() {
  return (
    <section id="pricing-variation-c" className="scroll-mt-24">
      <h2 className="gradient-text mb-2 text-2xl font-bold sm:text-4xl">
        LevelStack pricing
      </h2>
      <p className="mb-6 text-base leading-relaxed text-muted-foreground">
        The same comparison matrix, restructured into side-by-side plan cards.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]",
              plan.highlight &&
                "border-[var(--accent-orange)] ring-1 ring-[var(--accent-orange)]",
            )}
          >
            {plan.highlight ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Most Popular
              </span>
            ) : null}

            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">
                {plan.name}
              </h3>
              <div className="mt-1 text-3xl font-bold text-foreground">
                {plan.price}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {plan.tagline}
              </p>
            </div>

            <ul className="mb-5 flex-1 space-y-2.5 border-t border-border pt-4">
              {PRICING_FEATURES.map((feature) => {
                const included = feature.availability[plan.id]
                return (
                  <li
                    key={feature.label}
                    className={cn(
                      "flex items-start gap-2.5 text-sm",
                      included ? "text-foreground" : "text-muted-foreground/70",
                    )}
                  >
                    {included ? (
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <Minus
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                    )}
                    <span className={cn(!included && "line-through")}>
                      {feature.label}
                    </span>
                  </li>
                )
              })}
            </ul>

            <PricingCta href={plan.href} ariaLabel={plan.ariaLabel}>
              {plan.cta}
            </PricingCta>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
        Start free. Upgrade when you&apos;re ready. No subscription, ever —
        every tier is a one-time purchase.
      </p>
    </section>
  )
}
