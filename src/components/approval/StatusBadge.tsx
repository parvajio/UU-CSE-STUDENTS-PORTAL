import { cn } from "@/lib/utils"

export type ProfileStatus = "pending" | "approved" | "rejected"

const STATUS_LABELS: Record<ProfileStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
}

export function StatusBadge({
  status,
  className,
}: {
  status: ProfileStatus
  className?: string
}) {
  return (
    <span className={cn("soft-tag", `soft-tag--${status}`, className)}>
      {STATUS_LABELS[status]}
    </span>
  )
}
