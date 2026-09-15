"use client"

import { useState, useEffect, useRef } from "react"
import { Search, UserPlus, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  fullName: string
  avatarUrl: string | null
}

interface ManageClubMembersClientProps {
  clubId: string
  initialMembers: Array<{
    profileId: string
    avatarUrl: string | null
    fullName: string
    roleInClub: string
    position: string | null
    designation: string | null
  }>
}

export function ManageClubMembersClient({
  clubId,
  initialMembers,
}: ManageClubMembersClientProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [roleInClub, setRoleInClub] = useState<"member" | "executive" | "advisor">("member")
  const [designation, setDesignation] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [members, setMembers] = useState(initialMembers)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null!)

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (searchQuery.length < 2) {
      setResults([])
      return
    }
    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/club-members?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setResults(data.members || [])
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [searchQuery])

  async function handleAddMember() {
    if (!selectedProfile) return
    setIsAdding(true)
    try {
      const res = await fetch(`/api/club-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          profileId: selectedProfile,
          roleInClub,
          designation: designation || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add member")
      const profile = results.find((r) => r.id === selectedProfile)
      setMembers((prev) => [
        ...prev,
        {
          profileId: selectedProfile,
          avatarUrl: profile?.avatarUrl ?? null,
          fullName: profile?.fullName ?? "",
          roleInClub,
          position: null,
          designation: designation || null,
        },
      ])
      setSelectedProfile(null)
      setDesignation("")
      setSearchOpen(false)
      setSearchQuery("")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === "object" && err !== null && "error" in err ? (err as { error: string }).error : "Failed to add member"
      alert(message)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleRemoveMember(profileId: string) {
    try {
      await fetch(`/api/club-members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, profileId }),
      })
      setMembers((prev) => prev.filter((m) => m.profileId !== profileId))
    } catch {
      alert("Failed to remove member")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Members</h2>
        <Badge variant="secondary">{members.length}</Badge>
      </div>

      <div className="space-y-4">
        <DropdownMenu open={searchOpen} onOpenChange={setSearchOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={searchOpen}
              className="w-full justify-between"
            >
              <span className={cn(!selectedProfile && "text-muted-foreground")}>
                {selectedProfile
                  ? results.find((r) => r.id === selectedProfile)?.fullName ?? "Select profile..."
                  : "Search approved profiles..."}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full" align="start">
            <div className="p-2">
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedProfile(null)
                }}
                autoFocus
              />
            </div>
            {isSearching && (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching...
              </div>
            )}
            {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground text-center">No approved profiles found.</div>
            )}
            <div className="max-h-60 overflow-auto">
              {results.map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  onSelect={() => {
                    setSelectedProfile(profile.id)
                    setSearchOpen(false)
                    setSearchQuery(profile.fullName)
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{profile.fullName}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedProfile && (
          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g., Group Admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleInClub">Role</Label>
              <select
                id="roleInClub"
                value={roleInClub}
                onChange={(e) => setRoleInClub(e.target.value as "member" | "executive" | "advisor")}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="member">Member</option>
                <option value="executive">Executive</option>
                <option value="advisor">Advisor</option>
              </select>
            </div>
            <Button onClick={handleAddMember} disabled={isAdding || !selectedProfile}>
              {isAdding ? <Loader2 className="size-4 animate-spin mr-2" /> : <UserPlus className="size-4 mr-2" />}
              Add Member
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No members yet</p>
        ) : (
          members.map((member) => (
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMember(member.profileId)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
