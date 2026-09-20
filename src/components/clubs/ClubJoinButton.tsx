"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Check,
  Globe,
  Loader2,
  LogOut,
  MessagesSquare,
  Share2,
  UserPlus,
} from "lucide-react"
import type { ClubMember } from "./ClubMembers"

export interface ViewerInfo {
  userId: string
  profileId: string | null
  fullName: string | null
  avatarUrl: string | null
}

interface ClubJoinButtonProps {
  clubId: string
  clubName: string
  signedIn: boolean
  initialIsMember: boolean
  viewer: ViewerInfo | null
  groupLinks: {
    msgGroupUrl: string | null
    pageUrl: string | null
    fbGroupUrl: string | null
  }
  onMembershipChange: (member: ClubMember | null) => void
}

type DialogState = null | "confirm-join" | "confirm-leave" | "joined-groups"

export function ClubJoinButton({
  clubId,
  clubName,
  signedIn,
  initialIsMember,
  viewer,
  groupLinks,
  onMembershipChange,
}: ClubJoinButtonProps) {
  const [isMember, setIsMember] = useState(initialIsMember)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!signedIn) {
    return (
      <Button asChild size="sm" className="rounded-full">
        <Link href={`/login?callbackUrl=/clubs/${clubId}`}>
          <UserPlus className="size-4" strokeWidth={1.5} />
          Join Club
        </Link>
      </Button>
    )
  }

  async function handleJoin() {
    setIsBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/clubs/${clubId}/membership`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (data?.code === "ALREADY_MEMBER") {
        setIsMember(true)
        setDialog("joined-groups")
        return
      }
      if (!res.ok) throw new Error(data?.error || "Failed to join the club.")
      setIsMember(true)
      if (viewer) {
        onMembershipChange({
          id: `pending-${viewer.userId}`,
          userId: viewer.userId,
          profileId: viewer.profileId,
          avatarUrl: viewer.avatarUrl,
          fullName: viewer.fullName,
          roleInClub: "member",
          position: null,
          designation: null,
        })
      }
      setDialog("joined-groups")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join the club.")
    } finally {
      setIsBusy(false)
    }
  }

  async function handleLeave() {
    setIsBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/clubs/${clubId}/membership`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to leave the club.")
      setIsMember(false)
      onMembershipChange(null)
      setDialog(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave the club.")
    } finally {
      setIsBusy(false)
    }
  }

  const groupButtons = [
    groupLinks.msgGroupUrl && {
      href: groupLinks.msgGroupUrl,
      icon: MessagesSquare,
      label: "Chat group",
      hint: "Join the conversation",
    },
    groupLinks.fbGroupUrl && {
      href: groupLinks.fbGroupUrl,
      icon: Share2,
      label: "Facebook group",
      hint: "Join the community",
    },
    groupLinks.pageUrl && {
      href: groupLinks.pageUrl,
      icon: Globe,
      label: "Official page",
      hint: "Follow updates",
    },
  ].filter(Boolean) as Array<{ href: string; icon: typeof Globe; label: string; hint: string }>

  return (
    <div className="flex flex-col items-start gap-1.5">
      {isMember ? (
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full"
          onClick={() => {
            setError(null)
            setDialog("confirm-leave")
          }}
        >
          <Check className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          Joined
          <span className="text-muted-foreground">·</span>
          <span className="inline-flex items-center gap-1">
            <LogOut className="size-3.5" strokeWidth={1.5} />
            Leave
          </span>
        </Button>
      ) : (
        <Button
          size="sm"
          className="rounded-full"
          disabled={isBusy}
          onClick={() => {
            setError(null)
            setDialog("confirm-join")
          }}
        >
          {isBusy ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <UserPlus className="size-4" strokeWidth={1.5} />
          )}
          Join Club
        </Button>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Confirm join — no profile needed to join */}
      <Dialog open={dialog === "confirm-join"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {clubName}?</DialogTitle>
            <DialogDescription>
              You&apos;ll be added to the club&apos;s member list as a regular member and get
              notified here about its upcoming events. No profile needed — but creating one lets
              others find you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleJoin} disabled={isBusy}>
              {isBusy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />}
              Confirm join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm leave */}
      <Dialog open={dialog === "confirm-leave"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave {clubName}?</DialogTitle>
            <DialogDescription>
              You&apos;ll be removed from the member list and stop receiving event notifications
              for this club. You can rejoin anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={isBusy}>
              Stay
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={isBusy}>
              {isBusy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />}
              Confirm leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-join: group links */}
      <Dialog open={dialog === "joined-groups"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You&apos;re on the list 🎉</DialogTitle>
            <DialogDescription>
              To actually be part of {clubName}, join{" "}
              {groupButtons.length > 0 ? "its groups below" : "its groups (links coming soon)"} —
              that&apos;s where everything happens. We&apos;ll also notify you here about upcoming
              events.
            </DialogDescription>
          </DialogHeader>
          {groupButtons.length > 0 && (
            <ul className="space-y-2">
              {groupButtons.map((g) => (
                <li key={g.href}>
                  <a
                    href={g.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <g.icon className="size-4 text-primary" strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {g.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{g.hint}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button onClick={() => setDialog(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
