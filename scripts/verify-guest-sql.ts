import { eq, sql } from "drizzle-orm"
import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import * as schema from "../src/lib/db/schema"
import { db } from "../src/lib/db"
import {
  users,
  profiles,
  profileSkills,
  profileAchievements,
  profileProjects,
  profileCertificates,
  profileExperiences,
} from "../src/lib/db/schema"
import { searchDirectory, getProfileDetail } from "../src/lib/db/queries/directory"

const FORBIDDEN_COLUMNS = [
  "whatsapp_number",
  "facebook_url",
  "linkedin_url",
  "portfolio_url",
  "github_url",
  "bio",
  "avatar_url",
  "section",
  "achievements",
  "projects",
  "certificates",
  "experiences",
  "profile_achievements",
  "profile_projects",
  "profile_certificates",
  "profile_experiences",
  "issuer",
  "issuing_organization",
  "credential_url",
  "company_name",
  "position",
  "achieved_date",
  "start_date",
  "end_date",
]

let failures = 0
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures += 1
    console.error(`FAIL: ${message}`)
  } else {
    console.log(`PASS: ${message}`)
  }
}

function runRawGuestQuery(sqlLog: string[]) {
  const client = drizzle(neon(process.env.DATABASE_URL ?? ""), {
    schema,
    logger: {
      logQuery: (query: string) => {
        sqlLog.push(query)
      },
    },
  }) as NeonHttpDatabase<typeof schema>

  const guestColumns = {
    id: true,
    fullName: true,
    batchNumber: true,
  } as const

  return client.query.profiles.findMany({
    columns: guestColumns,
    with: {
      profileSkills: {
        columns: {},
        with: {
          skill: { columns: { id: true, name: true, slug: true, colorKey: true } },
        },
      },
    },
    where: eq(profiles.status, "approved"),
    limit: 1,
  })
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Run with: tsx --env-file=.env scripts/verify-guest-sql.ts")
    process.exit(1)
  }

  const tmpEmail = "verify-guest-sql.tmp@example.test"
  const tmpProfileId = crypto.randomUUID()
  let tempUserId: string | undefined

  try {
    // ---- fixture: one APPROVED profile with every contact field and portfolio records populated ----
    const firstSkill = await db.query.skills.findFirst({ columns: { id: true } })
    const inserted = await db
      .insert(users)
      .values({
        email: tmpEmail,
        authProvider: "unclaimed",
        role: "user",
      })
      .returning({ id: users.id })
    tempUserId = inserted[0]?.id
    if (!tempUserId) throw new Error("Could not create fixture user.")

    await db.insert(profiles).values({
      id: tmpProfileId,
      userId: tempUserId,
      fullName: "Verify Guest SQL Temp",
      studentId: "VGSQL-TMP",
      batchNumber: 60,
      section: "F",
      avatarUrl: "https://example.com/avatar.png",
      bio: "secret bio must never leak to guests",
      facebookUrl: "https://facebook.com/vgsql",
      linkedinUrl: "https://linkedin.com/in/vgsql",
      whatsappNumber: "+8801999000111",
      portfolioUrl: "https://vgsql.example.com",
      githubUrl: "https://github.com/vgsql",
      status: "approved",
    })

    if (firstSkill?.id) {
      await db
        .insert(profileSkills)
        .values({ profileId: tmpProfileId, skillId: firstSkill.id })
    }

    // Insert portfolio records for fixture user to verify they never leak to guests
    await db.insert(profileAchievements).values({
      profileId: tmpProfileId,
      title: "Secret Achievement",
      description: "Should never leak to guest",
    })
    await db.insert(profileProjects).values({
      profileId: tmpProfileId,
      title: "Secret Project",
      description: "Should never leak to guest",
    })

    // ---- 1. Runtime shape: real searchDirectory as guest ----
    const rows = await searchDirectory({ query: "Verify Guest SQL" }, "guest")
    const mine = rows.find((r) => r.fullName === "Verify Guest SQL Temp")
    assert(Boolean(mine), "guest search returns the approved fixture profile")

    if (mine) {
      const keys = Object.keys(mine).sort()
      assert(
        JSON.stringify(keys) === JSON.stringify(["batchNumber", "fullName", "id", "skills"]),
        `guest row has exactly {id, fullName, batchNumber, skills} — got ${keys.join(", ")}`
      )
      const forbiddenPresent = Object.keys(mine).filter((k) =>
        FORBIDDEN_COLUMNS.includes(k)
      )
      assert(forbiddenPresent.length === 0, `no contact/portfolio fields leak at runtime — ${forbiddenPresent.join(", ") || "none"}`)
      const skillKeys = new Set(mine.skills.flatMap((s) => Object.keys(s)))
      const illegal = [...skillKeys].filter((k) => !["id", "name", "slug", "colorKey"].includes(k))
      assert(illegal.length === 0, `skill objects expose only {id,name,slug,colorKey} — got ${[...skillKeys].join(", ")}`)
      assert(!JSON.stringify(mine).includes("+8801999000111"), "whatsapp value is absent from the guest result")
      assert(!JSON.stringify(mine).includes("Secret Achievement"), "portfolio achievement is absent from the guest result")
    }

    // ---- 1b. Runtime shape: getProfileDetail as guest ----
    const detailGuest = await getProfileDetail(tmpProfileId, "guest")
    assert(Boolean(detailGuest), "getProfileDetail as guest returns the approved fixture profile")
    if (detailGuest) {
      const detailKeys = Object.keys(detailGuest).sort()
      assert(
        JSON.stringify(detailKeys) === JSON.stringify(["batchNumber", "fullName", "id", "skills"]),
        `guest getProfileDetail has exactly {id, fullName, batchNumber, skills} — got ${detailKeys.join(", ")}`
      )
      const forbiddenDetailPresent = Object.keys(detailGuest).filter((k) =>
        FORBIDDEN_COLUMNS.includes(k)
      )
      assert(forbiddenDetailPresent.length === 0, `no contact/portfolio fields leak in guest detail — ${forbiddenDetailPresent.join(", ") || "none"}`)
    }

    // ---- 2. Raw SQL: capture the exact guest SELECT clause and inspect it ----
    const sqlLog: string[] = []
    await runRawGuestQuery(sqlLog)

    const nameSql = sqlLog.find((q) => q.includes("from") || q.includes("FROM")) ?? ""
    assert(Boolean(nameSql), "captured at least one guest query from the logger")
    assert(nameSql.toLowerCase().includes("full_name"), "SELECT references full_name")
    assert(nameSql.toLowerCase().includes("batch_number"), "SELECT references batch_number")
    const leaked = FORBIDDEN_COLUMNS.filter((c) => nameSql.toLowerCase().includes(c.toLowerCase()))
    assert(leaked.length === 0, `SELECT clause contains no contact or portfolio columns — ${leaked.join(", ") || "none"}`)
    console.log("\n[raw guest SQL]\n" + nameSql.slice(0, 600) + "\n")

    // ---- 3. Raw SQL for the skill-name search path (EXISTS subquery) ----
    const skillLog: string[] = []
    const skillClient = drizzle(neon(process.env.DATABASE_URL ?? ""), {
      schema,
      logger: {
        logQuery: (q: string) => {
          skillLog.push(q)
        },
      },
    })
    await skillClient.query.profiles.findMany({
      columns: { id: true, fullName: true, batchNumber: true },
      with: {
        profileSkills: {
          columns: {},
          with: { skill: { columns: { id: true, name: true, slug: true, colorKey: true } } },
        },
      },
      where: sql`${profiles.status} = 'approved' AND (
        ${profiles.fullName} ILIKE '%Web Development%'
        OR EXISTS (
          SELECT 1 FROM ${profileSkills} ps
          JOIN ${schema.skills} s ON s.id = ps.skill_id
          WHERE ps.profile_id = ${profiles.id} AND s.name ILIKE '%Web Development%'
        )
      )`,
      limit: 1,
    })
    const skillSql = skillLog.join(" ")
    const leakedSkill = FORBIDDEN_COLUMNS.filter((c) => skillSql.toLowerCase().includes(c.toLowerCase()))
    assert(leakedSkill.length === 0, `skill-search SQL contains no contact or portfolio columns — ${leakedSkill.join(", ") || "none"}`)
    console.log("\n[skill-search SQL]\n" + skillSql.slice(0, 600) + "\n")

    console.log(failures === 0 ? "\nRESULT: PASS — guest query never returns contact or portfolio fields" : `\nRESULT: FAIL (${failures})`)
  } finally {
    // ---- cleanup fixture ----
    try {
      await db.delete(profileAchievements).where(eq(profileAchievements.profileId, tmpProfileId))
      await db.delete(profileProjects).where(eq(profileProjects.profileId, tmpProfileId))
      await db.delete(profileCertificates).where(eq(profileCertificates.profileId, tmpProfileId))
      await db.delete(profileExperiences).where(eq(profileExperiences.profileId, tmpProfileId))
      await db.delete(profileSkills).where(eq(profileSkills.profileId, tmpProfileId))
      await db.delete(profiles).where(eq(profiles.id, tmpProfileId))
      if (tempUserId) await db.delete(users).where(eq(users.id, tempUserId))
    } catch {
      /* cleanup best-effort */
    }
  }

  process.exit(failures === 0 ? 0 : 1)
}

main()
