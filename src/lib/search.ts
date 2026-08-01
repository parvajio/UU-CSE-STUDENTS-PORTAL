import { sql, type AnyColumn, type SQL } from "drizzle-orm"

export function buildSearchQuery(term: string, columns: AnyColumn[]): SQL {
  const trimmed = term.trim()
  if (!trimmed) return sql`true`
  const tsvector = sql.join(columns, sql` || ' ' `)
  return sql`to_tsvector('english', ${tsvector}) @@ plainto_tsquery('english', ${trimmed})`
}
