export const CURRENT_BATCH = 67 as const;

export const SITE_NAME = "CSE Students Portal";
export const SITE_DESCRIPTION = "Department of Computer Science & Engineering";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SECTIONS = ["A", "B", "C", "D", "E", "F"] as const;