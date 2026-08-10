import { db } from "../src/lib/db"
import { sql } from "drizzle-orm"

type Row = { count: string | number }

async function count(query: string): Promise<number> {
  const res = (await db.execute(sql.raw(query))) as unknown as { rows: Row[] }
  return Number(res.rows?.[0]?.count ?? 0)
}

async function main() {
  let failures = 0

  const qf = await count(`SELECT count(*) FROM question_files`)
  const qfBadType = await count(
    `SELECT count(*) FROM question_files WHERE file_type NOT IN ('image','pdf')`
  )
  const droppedQCols = await count(
    `SELECT count(*) FROM information_schema.columns WHERE table_name='questions' AND column_name IN ('file_url','custom_subject','custom_course','program','evening')`
  )
  const subjectsTables = await count(
    `SELECT count(*) FROM information_schema.tables WHERE table_name='subjects'`
  )
  const subjectIdCols = await count(
    `SELECT count(*) FROM information_schema.columns WHERE table_name='courses' AND column_name='subject_id'`
  )
  const courseNotNull = await count(
    `SELECT count(*) FROM information_schema.columns WHERE table_name='questions' AND column_name='course_id' AND is_nullable='NO'`
  )
  const newQCols = await count(
    `SELECT count(*) FROM information_schema.columns WHERE table_name='questions' AND column_name IN ('program_type','season','year','teacher_name','view_count','download_count')`
  )
  const newTables = await count(
    `SELECT count(*) FROM information_schema.tables WHERE table_name IN ('question_files','question_likes')`
  )
  const courseCount = await count(`SELECT count(*) FROM courses`)

  // The migration's two-step data move copied every pre-existing questions.file_url
  // row into question_files BEFORE dropping the column — so at least one backfilled
  // row must exist (the 0004 seed row), and the column is gone afterwards.
  const checks: Array<[string, boolean, string]> = [
    ["question_files backfilled from pre-existing rows", qf >= 1, `count=${qf}`],
    ["question_files types are image|pdf only", qfBadType === 0, `bad=${qfBadType}`],
    ["no old questions columns remain", droppedQCols === 0, `left=${droppedQCols}`],
    ["subjects table absent", subjectsTables === 0, `tables=${subjectsTables}`],
    ["courses.subject_id absent", subjectIdCols === 0, `cols=${subjectIdCols}`],
    ["questions.course_id NOT NULL", courseNotNull === 1, `count=${courseNotNull}`],
    ["6 new questions columns present", newQCols === 6, `cols=${newQCols}`],
    ["question_files + question_likes exist", newTables === 2, `tables=${newTables}`],
    ["courses has 70 seed rows", courseCount === 70, `rows=${courseCount}`],
  ]

  for (const [name, ok, detail] of checks) {
    if (ok) console.log(`[verify] ✓ ${name} (${detail})`)
    else {
      failures++
      console.error(`[verify] ✗ ${name} (${detail})`)
    }
  }

  if (failures > 0) {
    console.error(`[verify] FAILED with ${failures} failing check(s)`)
    process.exit(1)
  }
  console.log("[verify] ALL PASS")
}

main().catch((e) => {
  console.error("[verify] Error:", e)
  process.exit(1)
})