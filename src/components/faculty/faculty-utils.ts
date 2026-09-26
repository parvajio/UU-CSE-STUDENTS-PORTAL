export function facultyInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

/** Rank-based pill color; senior ranks get hues, lecturers stay neutral. */
export function facultyDesignationTagClass(designation: string): string {
  const lower = designation.toLowerCase()
  if (lower.includes("associate professor")) return "soft-tag--web"
  if (lower.includes("assistant professor")) return "soft-tag--research"
  if (lower.includes("senior lecturer")) return "soft-tag--cp"
  if (lower.includes("professor")) return "soft-tag--ml"
  return "soft-tag--default"
}

export function facultyIsOnLeave(designation: string): boolean {
  return designation.toLowerCase().includes("study leave")
}
