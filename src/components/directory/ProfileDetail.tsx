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

      {/* Core Skills Card */}
      {/* {mainSkills.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-primary" />
              Core Skills & Expertise
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {mainSkills.map((skill) => (
                <SkillTag key={skill.id} skill={skill} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null} */}

      {/* Subskills & Specialized Tags Card */}
      {/* {subskills.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
              <Sparkles className="size-4" strokeWidth={1.75} />
              Subskills & Specialized Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {subskills.map((skill) => (
                <SkillTag key={skill.id} skill={skill} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null} */}
    </div>
  )
}
