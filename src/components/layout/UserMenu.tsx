"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { ClipboardList, LogOut, ShieldCheck, UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NavbarUser } from "./types"

export function UserMenu({ user }: { user: NavbarUser }) {
  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <Avatar className="size-8">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name ?? "User"} />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate text-sm font-medium">{user.name ?? user.email}</span>
            <span className="truncate text-xs text-muted-foreground">{user.role}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <UserRound className="size-4" strokeWidth={1.5} />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-submissions" className="cursor-pointer">
            <ClipboardList className="size-4" strokeWidth={1.5} />
            My Submissions
          </Link>
        </DropdownMenuItem>
        {user.role === "moderator" || user.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link href="/approve" className="cursor-pointer">
              <ShieldCheck className="size-4" strokeWidth={1.5} />
              Approvals
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
