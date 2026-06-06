"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { SignOutButton } from "@/components/layout/sign-out-button"
import { cn } from "@/lib/utils"
import { getHubPricingUrl } from "@/lib/urls"

type GlassNavigationProps = {
  showSignOut?: boolean
  productLabel?: string
}

export function GlassNavigation({
  showSignOut = false,
  productLabel = "LevelStack",
}: GlassNavigationProps) {
  const pathname = usePathname()
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollProgress(Math.min(window.scrollY / 300, 1))
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const bgOpacity = 0.05 + scrollProgress * 0.9
  const borderOpacity = 0.2 + scrollProgress * 0.2
  const isScrolled = scrollProgress > 0.1

  const isIntakeActive = pathname.startsWith("/intake")

  return (
    <nav
      role="navigation"
      aria-label="LevelStack"
      className={cn(
        "fixed top-0 z-50 w-full backdrop-blur-xl transition-all duration-300",
        isScrolled && "shadow-lg",
      )}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        borderBottom: `1px solid rgba(203, 213, 225, ${borderOpacity})`,
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-report items-center justify-between px-4 sm:px-6">
        <a
          href={getHubPricingUrl()}
          className="gradient-text text-lg sm:text-xl font-bold transition-opacity hover:opacity-80"
        >
          Level Play Digital · {productLabel}
        </a>
        <ul className="flex items-center gap-4 sm:gap-6">
          <li>
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === "/"
                  ? "text-brand-blue font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/intake"
              className={cn(
                "text-sm font-medium transition-colors",
                isIntakeActive
                  ? "text-brand-blue font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Intake
            </Link>
          </li>
          {showSignOut && (
            <li>
              <SignOutButton />
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}
