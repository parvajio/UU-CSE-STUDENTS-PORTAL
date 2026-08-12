import { Search } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { searchDirectory } from "@/lib/db/queries/directory"
import { getAllSkills } from "@/lib/db/queries/skills"
import { ProfileCard } from "@/components/directory/ProfileCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ExpertsSearchParams = {
  q?: string
  skillId?: string
}

export default async function ExpertsPage({
  searchParams,
}: {
  searchParams: Promise<ExpertsSearchParams>
}) {
  const { q, skillId } = await searchParams
  const session = await auth()
  const viewerRole = session?.user?.role ?? "guest"

  const [profiles, allSkills] = await Promise.all([
    searchDirectory({ query: q, skillIds: skillId ? [skillId] : undefined }, viewerRole),
    getAllSkills(),
  ])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Student Experts Directory
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Discover skilled student developers and alumni by name, expertise, or specific skill tags.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <form method="GET" className="flex max-w-xl gap-2">
          {skillId ? <input type="hidden" name="skillId" value={skillId} /> : null}
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name or keyword…"
            aria-label="Search experts"
            className="flex-1"
          />
          <Button type="submit">
            <Search className="size-4" strokeWidth={1.5} />
            Search
          </Button>
        </form>

        {/* Skill Filter Chips */}
        {allSkills.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Link
              href={q ? `/experts?q=${encodeURIComponent(q)}` : "/experts"}
              className={cn(
                "soft-tag cursor-pointer shrink-0 text-xs font-medium transition-colors",
                !skillId
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "soft-tag--default hover:border-primary/50"
              )}
            >
              All Skills
            </Link>
            {allSkills.map((skill) => {
              const isSelected = skillId === skill.id
              const href = q
                ? `/experts?skillId=${skill.id}&q=${encodeURIComponent(q)}`
                : `/experts?skillId=${skill.id}`

              return (
                <Link
                  key={skill.id}
                  href={href}
                  className={cn(
                    "soft-tag cursor-pointer shrink-0 text-xs font-medium transition-colors",
                    skill.colorKey && !isSelected && `soft-tag--${skill.colorKey}`,
                    !skill.colorKey && !isSelected && "soft-tag--default",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "hover:border-primary/50"
                  )}
                >
                  {skill.name}
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          title="No expert profiles found"
          description="Try a different search term or skill filter, or clear your filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} viewerRole={viewerRole} />
          ))}
        </div>
      )}
    </main>
  )
}
