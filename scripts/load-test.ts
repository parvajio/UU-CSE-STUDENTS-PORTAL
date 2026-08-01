import { sql } from "drizzle-orm"
import { db } from "../src/lib/db"
import { users, profiles, profileSkills } from "../src/lib/db/schema"
import { searchDirectory } from "../src/lib/db/queries/directory"
import { CURRENT_BATCH, SECTIONS } from "../config/site"

const args = process.argv.slice(2)
const PROFILE_COUNT = Number(args.find((a) => a.startsWith("--profiles="))?.split("=")[1] ?? 5000)
const NO_CLEANUP = args.includes("--no-cleanup")
const EMAIL_PREFIX = "loadtest+"
const MAX_LATENCY_MS = 2000

let failures = 0

function check(label: string, ms: number) {
  const ok = ms < MAX_LATENCY_MS
  if (!ok) failures += 1
  console.log(
    `${ok ? "PASS" : "FAIL"} ${label}: ${ms.toFixed(1)}ms${ok ? "" : ` (> ${MAX_LATENCY_MS}ms)`}`
  )
}

async function time(label: string, fn: () => Promise<unknown>) {
  const t0 = performance.now()
  await fn()
  const ms = performance.now() - t0
  check(label, ms)
  return ms
}

async function seed() {
  console.log(`[load-test] seeding ${PROFILE_COUNT} approved profiles...`)

  const skillRows = await db.query.skills.findMany({ columns: { id: true } })
  if (skillRows.length === 0) {
    console.error("[load-test] no skills seeded — run `npm run db:seed` first.")
    process.exit(1)
  }
  const skillIds = skillRows.map((s) => s.id)

  const chunkSize = 1000
  let seededUsers = 0
  let seededProfiles = 0
  let seededJoins = 0

  for (let start = 0; start < PROFILE_COUNT; start += chunkSize) {
    const end = Math.min(start + chunkSize, PROFILE_COUNT)
    const userRows = Array.from({ length: end - start }, (_, offset) => {
      const i = start + offset
      return {
        id: crypto.randomUUID(),
        email: `${EMAIL_PREFIX}${i}@example.test`,
        authProvider: "unclaimed" as const,
        role: "user" as const,
      }
    })
    await db.insert(users).values(userRows)
    seededUsers += userRows.length
  }

  const allUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(sql`${users.email} LIKE ${`${EMAIL_PREFIX}%`}`)
  const userByIndex = new Map<number, string>()
  for (const u of allUsers) {
    userByIndex.set(Number(u.email.slice(EMAIL_PREFIX.length, u.email.indexOf("@"))), u.id)
  }

  for (let start = 0; start < PROFILE_COUNT; start += chunkSize) {
    const end = Math.min(start + chunkSize, PROFILE_COUNT)
    const profileRows = []
    const joinRows = []
    for (let offset = 0; offset < end - start; offset++) {
      const i = start + offset
      const id = crypto.randomUUID()
      const padded = String(i).padStart(5, "0")
      const userId = userByIndex.get(i)
      if (!userId) throw new Error(`Missing seeded user for index ${i}`)
      const skillCount = 1 + Math.floor(Math.random() * 3)
      const chosen: string[] = []
      for (let k = 0; k < skillCount; k++) {
        const skillId = skillIds[Math.floor(Math.random() * skillIds.length)]
        if (!chosen.includes(skillId)) chosen.push(skillId)
      }
      profileRows.push({
        id,
        userId,
        fullName: `Load Test Person ${padded}`,
        studentId: `LT-${padded}`,
        batchNumber: Math.floor(Math.random() * CURRENT_BATCH) + 1,
        section: SECTIONS[Math.floor(Math.random() * SECTIONS.length)],
        status: "approved" as const,
      })
      for (const skillId of chosen) {
        joinRows.push({ profileId: id, skillId })
      }
    }

    await db.insert(profiles).values(profileRows)
    seededProfiles += profileRows.length
    if (joinRows.length > 0) {
      await db.insert(profileSkills).values(joinRows)
      seededJoins += joinRows.length
    }
  }

  console.log(`[load-test] seeded ${seededUsers} users, ${seededProfiles} profiles, ${seededJoins} skill joins`)
}

async function benchmark() {
  console.log(`\n[load-test] benchmarking searchDirectory as guest (limit ${MAX_LATENCY_MS}ms)...`)

  await time("full listing (limit 100)", () => searchDirectory({}, "guest"))
  await time("name substring 'Load Test' (matches all)", () =>
    searchDirectory({ query: "Load Test" }, "guest")
  )
  await time("name miss (no match)", () =>
    searchDirectory({ query: "zzqqxx nonexistent" }, "guest")
  )
  await time("skill search 'Web Development'", () =>
    searchDirectory({ query: "Web Development" }, "guest")
  )
  await time("batch filter 30", () => searchDirectory({ batchNumber: 30 }, "guest"))
  await time("combined query + batch 30", () =>
    searchDirectory({ query: "Load Test Person 0", batchNumber: 30 }, "guest")
  )
}

async function explainPlans() {
  console.log("\n[load-test] EXPLAIN ANALYZE (informational) + index presence...")
  const namePlan = await db.execute(sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT id, full_name, batch_number FROM profiles
    WHERE status = 'approved' AND full_name ILIKE '%Load Test%'
    ORDER BY full_name ASC LIMIT 100
  `)
  console.log("\n--- EXPLAIN ANALYZE: name search ---")
  for (const row of namePlan.rows as Array<{ "QUERY PLAN": string }>) {
    console.log(row["QUERY PLAN"])
  }

  const idxRows = await db.execute(sql`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'profiles' ORDER BY indexname
  `)
  const indexes = (idxRows.rows as Array<{ indexname: string }>).map((r) => r.indexname)
  console.log(`\n[load-test] profiles indexes: ${indexes.join(", ")}`)
  if (!indexes.includes("idx_profiles_fullname_trgm")) failures += 1

  const questions = await db.execute(sql`SELECT to_regclass('public.questions') AS t`)
  const questionsTable = (questions.rows as Array<{ t: string | null }>)[0]?.t
  if (questionsTable) {
    console.log("\n[load-test] questions table PRESENT — 10k benchmark deferred until Phase 2 schema is in src/lib/db/schema.")
  } else {
    console.log("\n[load-test] questions table ABSENT — SKIP 10k-question benchmark (Phase 2).")
  }
}

async function cleanup() {
  if (NO_CLEANUP) {
    console.log(`\n[load-test] --no-cleanup: leaving ${PROFILE_COUNT} test rows in the DB.`)
    return
  }
  const prefix = `${EMAIL_PREFIX}%`
  console.log("\n[load-test] cleaning up test data...")
  const joins = await db.execute(sql`
    DELETE FROM profile_skills
    WHERE profile_id IN (
      SELECT p.id FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE u.email LIKE ${prefix}
    )
  `)
  const profs = await db.execute(sql`
    DELETE FROM profiles
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE ${prefix})
  `)
  const usrs = await db.execute(sql`
    DELETE FROM users WHERE email LIKE ${prefix}
  `)
  console.log(
    `[load-test] removed ${joins.rowCount ?? 0} joins, ${profs.rowCount ?? 0} profiles, ${usrs.rowCount ?? 0} users`
  )
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL required. Run: tsx --env-file=.env scripts/load-test.ts")
    process.exit(1)
  }
  if (args.includes("--cleanup-only")) {
    await cleanup()
    process.exit(0)
  }
  await seed()
  await benchmark()
  await explainPlans()
  await cleanup()

  console.log(
    failures === 0
      ? "\nRESULT: PASS — all searches under 2s at SC-008 scale (profiles); questions deferred to Phase 2"
      : `\nRESULT: FAIL (${failures} check(s) failed)`
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error("[load-test] failed:", error)
  process.exit(1)
})
