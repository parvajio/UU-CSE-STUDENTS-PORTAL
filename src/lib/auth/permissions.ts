import type { Role } from "./types"

export type ResourceType = "profile" | "question" | "project" | "routine_report"

const approvalMatrix: Record<ResourceType, Role[]> = {
  profile: ["admin"],
  question: ["moderator", "admin"],
  project: ["moderator", "admin"],
  routine_report: ["moderator", "admin"],
}

export function canApprove(
  userRole: Role,
  resourceType: ResourceType
): boolean {
  return approvalMatrix[resourceType]?.includes(userRole) ?? false
}
