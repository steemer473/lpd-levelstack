import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { getHubPricingUrl } from "@/lib/urls"

type LevelstackLogoProps = {
  className?: string
  href?: string
  showWordmark?: boolean
}

export function LevelstackLogo({
  className,
  href = getHubPricingUrl(),
  showWordmark = true,
}: LevelstackLogoProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 shrink-0", className)}
    >
      <Image
        src="/images/level-play-digital-logo-gradient-full.svg"
        alt="Level Play Digital"
        width={140}
        height={32}
        className="h-8 w-auto"
        priority
      />
      {showWordmark && (
        <span className="hidden sm:flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            LevelStack
          </span>
          <span className="text-[10px] text-muted-foreground">by Level Play Digital</span>
        </span>
      )}
    </Link>
  )
}
