"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export const NAV_LINKS = [
  { href: "/experts", label: "Experts" },
  { href: "/faculty", label: "Faculty" },
  { href: "/question-bank", label: "Question Bank" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
