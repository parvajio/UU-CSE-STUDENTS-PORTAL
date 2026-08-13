import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkillTag } from "@/components/directory/SkillTag"
import type { MyProfile } from "@/app/(user)/profile/actions"

export function ProfileDetail({ profile }: { profile: MyProfile }) {
  const mainSkills = profile.skills.filter((s) => !s.parentSkillId && !s.isCustom)
  const subskills = profile.skills.filter((s) => s.parentSkillId || s.isCustom)

  if (profile.skills.length === 0 && !profile.bio) {
    return null
  }

  return (
    <div className="space-y-6">
      {profile.bio ? (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-heading text-base font-semibold text-foreground mb-2">About</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{profile.bio}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
