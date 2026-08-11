import { searchQuestions, getQuestionDetail } from "../src/lib/db/queries/question-bank"

let failures = 0
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures += 1
    console.error(`FAIL: ${message}`)
  } else {
    console.log(`PASS: ${message}`)
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Run with: tsx --env-file=.env scripts/verify-guest-question-sql.ts")
    process.exit(1)
  }

  console.log("Running guest question bank payload verification...")

  // 1. Test searchQuestions as guest
  const result = await searchQuestions({}, "guest")
  const items = result.items

  if (items.length === 0) {
    console.log("No approved questions found in DB to verify guest payload. (Seed some approved questions first)")
  } else {
    for (const q of items) {
      const qAny = q as Record<string, unknown>
      assert(!("files" in qAny), `Guest question item (${q.id}) excludes 'files'`)
      assert(!("fileUrl" in qAny), `Guest question item (${q.id}) excludes 'fileUrl'`)
      assert(!("file_url" in qAny), `Guest question item (${q.id}) excludes 'file_url'`)
      assert(!("isLikedByViewer" in qAny), `Guest question item (${q.id}) excludes 'isLikedByViewer'`)

      // Check required guest metadata keys
      const requiredKeys = [
        "id",
        "title",
        "batchNumber",
        "programType",
        "season",
        "year",
        "examType",
        "courseCode",
        "courseTitle",
        "tags",
        "likeCount",
        "viewCount",
        "downloadCount",
      ]
      for (const key of requiredKeys) {
        assert(key in qAny, `Guest question item includes required key '${key}'`)
      }
    }

    // 2. Test getQuestionDetail as guest for the first approved question
    const firstId = items[0].id
    const detail = await getQuestionDetail(firstId, "guest")
    if (detail) {
      const dAny = detail as Record<string, unknown>
      assert(!("files" in dAny), `Guest question detail excludes 'files'`)
      assert(!("fileUrl" in dAny), `Guest question detail excludes 'fileUrl'`)
      assert(!("isLikedByViewer" in dAny), `Guest question detail excludes 'isLikedByViewer'`)
    }
  }

  console.log(failures === 0 ? "\nRESULT: PASS — guest question payload is clean and secure" : `\nRESULT: FAIL (${failures})`)
  process.exit(failures === 0 ? 0 : 1)
}

main()
