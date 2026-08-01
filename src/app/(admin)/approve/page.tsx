import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react"
import { auth } from "@/lib/auth/auth"
import {
  APPROVAL_PAGE_SIZE,
  getPendingCounts,
  getPendingItems,
  visibleResourceTypes,
} from "@/lib/db/queries/approval"
import { ApprovalCard } from "@/components/approval/ApprovalCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { capitalize, cn } from "@/lib/utils"
import type { ResourceType } from "@/lib/auth/permissions"

export const metadata: Metadata = {
  title: "Approvals",
}

type ApproveSearchParams = {
  type?: string
  page?: string
}

function tabHref(type: ResourceType | null): string {
  return type ? `/approve?type=${type}` : "/approve"
}

export default async function ApprovePage({
  searchParams,
}: {
  searchParams: Promise<ApproveSearchParams>
}) {
  const { type, page: pageParam } = await searchParams
  const session = await auth()

  if (!session?.user?.id) redirect("/login")
  const role = session.user.role
  if (role !== "moderator" && role !== "admin") redirect("/")

  const visible = visibleResourceTypes(role)
  const activeType = visible.includes(type as ResourceType)
    ? (type as ResourceType)
    : undefined
  const page = Math.max(Number.parseInt(pageParam ?? "1", 10) || 1, 1)

  const [counts, result] = await Promise.all([
    getPendingCounts(role),
    getPendingItems(role, { resourceType: activeType, page }),
  ])

  const allCount = visible.reduce((sum, t) => sum + (counts[t] ?? 0), 0)
  const totalPages = Math.max(Math.ceil(result.total / APPROVAL_PAGE_SIZE), 1)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Approvals
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review pending submissions before they go live.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={tabHref(null)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeType === undefined
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All ({allCount})
        </Link>
        {visible.map((t) => (
          <Link
            key={t}
            href={tabHref(t)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeType === t
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {capitalize(t)} ({counts[t] ?? 0})
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          title="No items waiting for review"
          description="New submissions will appear here as soon as students submit them."
          icon={<ShieldCheck className="size-8" strokeWidth={1.5} />}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {result.items.map((item) => (
            <ApprovalCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between border-t pt-6"
        >
          <Button
            asChild
            variant="outline"
            size="sm"
            aria-disabled={page <= 1}
            className={cn(page <= 1 && "pointer-events-none opacity-50")}
          >
            <Link href={page > 1 ? `?${queryWithPage(activeType, page - 1)}` : "#"}>
              <ChevronLeft className="size-4" strokeWidth={1.5} />
              Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            asChild
            variant="outline"
            size="sm"
            aria-disabled={page >= totalPages}
            className={cn(page >= totalPages && "pointer-events-none opacity-50")}
          >
            <Link
              href={
                page < totalPages
                  ? `?${queryWithPage(activeType, page + 1)}`
                  : "#"
              }
            >
              Next
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </Link>
          </Button>
        </nav>
      ) : null}
    </main>
  )
}

function queryWithPage(type: ResourceType | undefined, page: number): string {
  const params = new URLSearchParams()
  if (type) params.set("type", type)
  params.set("page", String(page))
  return params.toString()
}
