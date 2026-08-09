import { Search } from "lucide-react"
import { auth } from "@/lib/auth/auth"
import { searchDirectory } from "@/lib/db/queries/directory"
import { ProfileCard } from "@/components/directory/ProfileCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type DirectorySearchParams = {
  q?: string
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>
}) {
  const { q } = await searchParams
  const session = await auth()
  const viewerRole = session?.user?.role ?? "guest"
  const profiles = await searchDirectory({ query: q }, viewerRole)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Student Expert Directory
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse approved student profiles and find experts by name or skill.
        </p>
      </div>

      <form method="GET" className="mb-8 flex max-w-xl gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or skill…"
          aria-label="Search directory"
          className="flex-1"
        />
        <Button type="submit">
          <Search className="size-4" strokeWidth={1.5} />
          Search
        </Button>
      </form>

      {profiles.length === 0 ? (
        <EmptyState
          title="No profiles found"
          description="Try a different name or skill, or clear your search."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </main>
  )
}
