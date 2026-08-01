// Fallback default only — the runtime value lives in the `site_config` DB
// table (key "currentBatch") and is read via getCurrentBatch(). Keep this in
// sync with the seeded value.
export const CURRENT_BATCH = 68 as const;

export const SITE_NAME = "CSE Students Portal";
export const SITE_DESCRIPTION = "Department of Computer Science & Engineering";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SECTIONS = ["A", "B", "C", "D", "E", "F"] as const;