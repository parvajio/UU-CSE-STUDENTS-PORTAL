"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  GraduationCap,
  Users,
  FileText,
  Shield,
  Calendar,
  UserRound,
  ClipboardList,
  ShieldCheck,
  BookOpen,
  Settings2,
  LogIn,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { NAV_LINKS } from "./NavLinks"
import { SITE_NAME } from "../../../config/site"
import type { NavbarUser } from "./types"

const LINK_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "/experts": Users,
  "/faculty": GraduationCap,
  "/question-bank": FileText,
  "/clubs": Shield,
  "/events": Calendar,
}

export function MobileNav({ user }: { user: NavbarUser | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          className="md:hidden"
        >
          <Menu className="size-5" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-80 flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" strokeWidth={1.5} />
            </span>
            <span className="font-heading text-lg font-semibold text-foreground tracking-tight">
              {SITE_NAME}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Navigation
            </p>
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`)
              const Icon = LINK_ICONS[link.href] || FileText
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* User Quick Links or Login */}
          {user ? (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <Avatar className="size-9 border border-border">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name ?? "User"} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initial}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-semibold text-foreground">{user.name ?? user.email}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">{user.role}</span>
                  </div>
                </div>

                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                  My Account
                </p>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    pathname === "/profile" && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <UserRound className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  My Profile
                </Link>
                <Link
                  href="/upload-question"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    pathname === "/upload-question" && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <ClipboardList className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  Upload Question
                </Link>
                <Link
                  href="/my-submissions"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    pathname === "/my-submissions" && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <ClipboardList className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  My Submissions
                </Link>

                {(user.role === "moderator" || user.role === "admin") && (
                  <>
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                      Moderation
                    </p>
                    <Link
                      href="/approve"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        pathname === "/approve" && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <ShieldCheck className="size-4 text-muted-foreground" strokeWidth={1.5} />
                      Approvals
                    </Link>
                  </>
                )}

                {user.role === "admin" && (
                  <>
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                      Admin
                    </p>
                    <Link
                      href="/manage/courses"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        pathname === "/manage/courses" && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <BookOpen className="size-4 text-muted-foreground" strokeWidth={1.5} />
                      Manage Courses
                    </Link>
                    <Link
                      href="/manage/settings"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        pathname === "/manage/settings" && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <Settings2 className="size-4 text-muted-foreground" strokeWidth={1.5} />
                      Site Settings
                    </Link>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Separator />
              <div className="pt-2">
                <Button asChild className="w-full gap-2 shadow-sm" size="default">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <LogIn className="size-4" strokeWidth={1.5} />
                    Log in to portal
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {user && (
          <div className="border-t border-border p-4 bg-muted/30">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                setOpen(false)
                signOut({ callbackUrl: "/" })
              }}
            >
              <LogOut className="size-4" strokeWidth={1.5} />
              Sign out
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
