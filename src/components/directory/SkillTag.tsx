import { cn } from "@/lib/utils"
import type { SearchProfileSkill } from "@/lib/db/queries/directory"

export function SkillTag({ skill }: { skill: SearchProfileSkill }) {
  return (
    <span className={cn("soft-tag", skill.colorKey ? `soft-tag--${skill.colorKey}` : "soft-tag--default")}>
      {skill.name}
    </span>
  )
}
