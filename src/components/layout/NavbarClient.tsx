"use client"

import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { SITE_NAME } from "../../../config/site"
import { Button } from "@/components/ui/button"
import { MobileNav } from "./MobileNav"
import { NavLinks } from "./NavLinks"
import { NotificationBell } from "./NotificationBell"
import { ThemeToggle } from "./ThemeToggle"
import { UserMenu } from "./UserMenu"
import type { NavbarUser } from "./types"

export function NavbarClient({ user }: { user: NavbarUser | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-glass backdrop-blur-[16px]">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 md:gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" strokeWidth={1.5} />
            </span>
            <span className="hidden font-heading text-lg font-semibold text-foreground sm:inline">
              {SITE_NAME}
            </span>
          </Link>
          <MobileNav user={user} />
          <NavLinks />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />
              <UserMenu user={user} />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
