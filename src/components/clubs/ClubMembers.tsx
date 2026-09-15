import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface ClubMember {
  profileId: string
  avatarUrl: string | null
  fullName: string
  roleInClub: string
  position: string | null
  designation: string | null
}

export function ClubMembers({ members }: { members: ClubMember[] }) {
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2">
        <Users className="size-4" />
        No members yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.profileId}
          className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.avatarUrl ?? undefined} alt={member.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {member.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">{member.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {member.roleInClub}
              {member.designation ? ` · ${member.designation}` : ""}
              {member.position ? ` · ${member.position}` : ""}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {member.roleInClub}
          </Badge>
        </div>
      ))}
    </div>
  )
}
