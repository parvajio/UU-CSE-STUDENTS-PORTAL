"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCircle2, Inbox, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import type { NotificationItem } from "@/lib/db/queries/notifications"

type BellState = {
  unreadCount: number
  notifications: NotificationItem[]
}

const POLL_INTERVAL_MS = 30_000
const MAX_BADGE = 99

function notificationHref(notification: NotificationItem): string {
  switch (notification.resourceType) {
    case "question":
      return "/question-bank"
    case "project":
      return "/projects"
    default:
      return "/my-submissions"
  }
}

function TypeIcon({ type }: { type: string }) {
  if (type === "approval") {
    return <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400" strokeWidth={1.5} />
  }
  if (type === "rejection") {
    return <XCircle className="size-4 shrink-0 text-destructive" strokeWidth={1.5} />
  }
  return null
}

export function NotificationBell() {
  const router = useRouter()
  const [state, setState] = useState<BellState>({
    unreadCount: 0,
    notifications: [],
  })

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (!res.ok) return
      const data: BellState = await res.json()
      setState(data)
    } catch {
      // keep last known state on transient network errors
    }
  }, [])

  useEffect(() => {
    const firstTick = setTimeout(() => void load(), 0)
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      clearTimeout(firstTick)
      clearInterval(interval)
    }
  }, [load])

  function handleOpen(notification: NotificationItem) {
    const id = notification.id
    void fetch(`/api/notifications?markRead=${id}`, { cache: "no-store" }).catch(() => {})
    setState((prev) => ({
      unreadCount: Math.max(0, prev.unreadCount - (notification.read ? 0 : 1)),
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
    router.push(notificationHref(notification))
  }

  const badge =
    state.unreadCount > MAX_BADGE ? `${MAX_BADGE}+` : String(state.unreadCount)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications (${state.unreadCount} unread)`}
        >
          <span className="relative">
            <Bell className="size-[1.2rem]" strokeWidth={1.5} />
            {state.unreadCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {badge}
              </span>
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {state.notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Inbox className="size-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {state.notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => handleOpen(notification)}
                className="flex cursor-pointer items-start gap-3 py-2.5"
              >
                <span className="mt-0.5">
                  <TypeIcon type={notification.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {notification.title}
                    </span>
                    {!notification.read ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </span>
                  {notification.message ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {notification.message}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
