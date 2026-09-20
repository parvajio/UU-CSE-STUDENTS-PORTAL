import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Crown, Users } from "lucide-react"

export interface ClubMember {
  id: string
  userId: string | null
  profileId: string | null
  avatarUrl: string | null
  fullName: string | null
  roleInClub: string
  position: string | null
  designation: string | null
}

export const NO_PROFILE_LABEL = "Profile not created yet"

function displayName(member: ClubMember): string {
  return member.fullName ?? NO_PROFILE_LABEL
}

function initials(member: ClubMember): string {
  const initial = (member.fullName ?? "?").trim().charAt(0).toUpperCase()
  return initial || "?"
}

function ExecutiveCard({ member }: { member: ClubMember }) {
  const body = (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-[var(--card-shadow)] hover:border-primary/30 hover:shadow-[var(--card-shadow-hover)] transition-all motion-reduce:transition-none">
      <Avatar className="h-10 w-10 ring-1 ring-border">
        <AvatarImage src={member.avatarUrl ?? undefined} alt={displayName(member)} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {initials(member)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">{displayName(member)}</p>
        <p className="text-xs text-muted-foreground truncate">
          {member.designation ? `${member.designation}` : ""}
          {member.designation && member.position ? ` · ${member.position}` : (member.position ?? "")}
        </p>
      </div>
      <Badge variant="secondary" className="text-xs shrink-0 rounded-full">
        {member.roleInClub}
      </Badge>
    </div>
  )

  // Executives are admin-curated and always have a profile — deep-link it.
  if (!member.profileId) return body
  return (
    <Link
      href={`/experts/${member.profileId}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {body}
    </Link>
  )
}

function MemberAvatar({ member }: { member: ClubMember }) {
  const avatar = (
    <Avatar
      title={displayName(member)}
      className="h-10 w-10 ring-2 ring-card hover:z-10 hover:scale-110 transition-transform motion-reduce:transition-none"
    >
      <AvatarImage src={member.avatarUrl ?? undefined} alt={displayName(member)} />
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
        {initials(member)}
      </AvatarFallback>
    </Avatar>
  )

  // Profile present → tapping the avatar opens their profile page.
  // No profile yet → plain avatar with a "not created" tooltip instead.
  if (!member.profileId) {
    return (
      <span title={NO_PROFILE_LABEL} className="cursor-default">
        {avatar}
      </span>
    )
  }
  return (
    <Link
      href={`/experts/${member.profileId}`}
      title={member.fullName ?? undefined}
      aria-label={`View ${member.fullName}'s profile`}
      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {avatar}
    </Link>
  )
}

function MemberAvatarWall({ members }: { members: ClubMember[] }) {
  const MAX_SHOWN = 20
  const shown = members.slice(0, MAX_SHOWN)
  const overflow = members.length - shown.length

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--card-shadow)]">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2.5 overflow-hidden py-1 pl-1">
          {shown.map((member) => (
            <MemberAvatar key={member.id} member={member} />
          ))}
          {overflow > 0 && (
            <span
              title={`${overflow} more members`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-card"
            >
              +{overflow}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-heading text-base font-bold text-foreground">{members.length}</span>{" "}
          {members.length === 1 ? "member" : "members"}
        </p>
      </div>
      {members.length === 0 && (
        <p className="text-sm text-muted-foreground">No members yet — be the first to join.</p>
      )}
    </div>
  )
}

export function ClubMembers({ members }: { members: ClubMember[] }) {
  const executives = members.filter(
    (m) => m.roleInClub === "executive" || m.roleInClub === "advisor"
  )
  const regulars = members.filter((m) => m.roleInClub === "member")

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
        <Users className="size-4" strokeWidth={1.5} />
        No members yet
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Crown className="size-4 text-primary" strokeWidth={1.5} />
          Executives
          <Badge variant="secondary" className="rounded-full text-xs">
            {executives.length}
          </Badge>
        </h3>
        {executives.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No executives listed yet.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {executives.map((member) => (
              <ExecutiveCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Users className="size-4 text-primary" strokeWidth={1.5} />
          Members
          <Badge variant="secondary" className="rounded-full text-xs">
            {regulars.length}
          </Badge>
        </h3>
        <MemberAvatarWall members={regulars} />
      </div>
    </div>
  )
}
