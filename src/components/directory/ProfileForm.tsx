"use client"

import { useMemo, useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CURRENT_BATCH, SECTIONS } from "../../../config/site"
import { upsertProfile, type MyProfile, type UpsertProfileInput } from "@/app/(user)/profile/actions"
import type { FlatSkill } from "@/lib/db/queries/skills"

const batchOptions = Array.from({ length: CURRENT_BATCH }, (_, i) => i + 1)

function SkillPill({
  skill,
  selected,
  onToggle,
}: {
  skill: FlatSkill
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "soft-tag soft-tag--default cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        skill.colorKey && `soft-tag--${skill.colorKey}`,
        selected && "soft-tag--selected"
      )}
    >
      {skill.name}
    </button>
  )
}

export function ProfileForm({
  skills,
  initial,
  onSuccess,
}: {
  skills: FlatSkill[]
  initial?: MyProfile | null
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(initial?.fullName ?? "")
  const [studentId, setStudentId] = useState(initial?.studentId ?? "")
  const [batchNumber, setBatchNumber] = useState(initial?.batchNumber ?? CURRENT_BATCH)
  const [section, setSection] = useState(initial?.section ?? SECTIONS[0])
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? "")
  const [bio, setBio] = useState(initial?.bio ?? "")
  const [facebookUrl, setFacebookUrl] = useState(initial?.facebookUrl ?? "")
  const [linkedinUrl, setLinkedinUrl] = useState(initial?.linkedinUrl ?? "")
  const [whatsappNumber, setWhatsappNumber] = useState(initial?.whatsappNumber ?? "")
  const [portfolioUrl, setPortfolioUrl] = useState(initial?.portfolioUrl ?? "")
  const [githubUrl, setGithubUrl] = useState(initial?.githubUrl ?? "")
  const [isAlumni, setIsAlumni] = useState(initial?.isAlumni ?? false)
  const [currentCompany, setCurrentCompany] = useState(initial?.currentCompany ?? "")
  const [jobPosition, setJobPosition] = useState(initial?.jobPosition ?? "")
  const [skillIds, setSkillIds] = useState<string[]>(
    initial?.skills.map((skill) => skill.id) ?? []
  )

  const { topLevel, childrenByParent, orphanChildren } = useMemo(() => {
    const topLevel: FlatSkill[] = []
    const childrenByParent = new Map<string, FlatSkill[]>()
    const topLevelIds = new Set<string>()

    for (const skill of skills) {
      if (skill.parentSkillId === null) {
        topLevel.push(skill)
        topLevelIds.add(skill.id)
      }
    }

    const orphanChildren: FlatSkill[] = []
    for (const skill of skills) {
      if (skill.parentSkillId !== null) {
        if (topLevelIds.has(skill.parentSkillId)) {
          const arr = childrenByParent.get(skill.parentSkillId) ?? []
          arr.push(skill)
          childrenByParent.set(skill.parentSkillId, arr)
        } else {
          orphanChildren.push(skill)
        }
      }
    }

    for (const children of childrenByParent.values()) {
      children.sort((a, b) => a.name.localeCompare(b.name))
    }

    return { topLevel, childrenByParent, orphanChildren }
  }, [skills])

  function toggleSkill(id: string) {
    setSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const payload: UpsertProfileInput = {
      fullName,
      studentId,
      batchNumber,
      section,
      avatarUrl,
      bio,
      facebookUrl,
      linkedinUrl,
      whatsappNumber,
      portfolioUrl,
      githubUrl,
      skillIds,
      isAlumni,
      currentCompany,
      jobPosition,
    }

    startTransition(async () => {
      const result = await upsertProfile(payload)
      if (result.success) {
        onSuccess?.()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? "Edit Profile" : "Create Profile"}</CardTitle>
        <CardDescription>
          {initial
            ? "Your changes will be reviewedbank before they appear in the directory."
            : "Fill in your details. Your profile will appear in the directory after an admin approves it."}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. CSE-20-42"
              required={!isAlumni}
            />
          </div>

          <div className="grid gap-2">
            <Label>Section</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger aria-label="Section">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    Section {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Batch</Label>
            <Select
              value={String(batchNumber)}
              onValueChange={(value) => setBatchNumber(Number(value))}
            >
              <SelectTrigger aria-label="Batch">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {batchOptions.map((batch) => (
                  <SelectItem key={batch} value={String(batch)}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short intro about what you work on"
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/500</p>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label>Alumni status</Label>
            <Button
              type="button"
              variant="outline"
              aria-pressed={isAlumni}
              onClick={() => setIsAlumni((v) => !v)}
              className={cn(
                "justify-start",
                isAlumni && "border-primary bg-primary/10 text-primary"
              )}
            >
              <GraduationCap className="size-4" strokeWidth={1.5} />
              {isAlumni ? "I'm an alumnus" : "Mark as alumnus"}
            </Button>
          </div>

          {isAlumni ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="currentCompany">Current company</Label>
                <Input
                  id="currentCompany"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jobPosition">Job position</Label>
                <Input
                  id="jobPosition"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="Your role"
                />
              </div>
            </>
          ) : null}

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="linkedinUrl">LinkedIn</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="githubUrl">GitHub</Label>
            <Input
              id="githubUrl"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/…"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="portfolioUrl">Portfolio</Label>
            <Input
              id="portfolioUrl"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="facebookUrl">Facebook</Label>
            <Input
              id="facebookUrl"
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/…"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="whatsappNumber">WhatsApp number</Label>
            <Input
              id="whatsappNumber"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+8801XXXXXXXXX"
            />
          </div>

          <div className="grid gap-3 sm:col-span-2">
            <Label>Skills</Label>
            <div className="flex flex-col gap-4">
              {topLevel.map((skill) => (
                <div key={skill.id}>
                  <div className="flex flex-wrap gap-2">
                    <SkillPill
                      skill={skill}
                      selected={skillIds.includes(skill.id)}
                      onToggle={() => toggleSkill(skill.id)}
                    />
                  </div>
                  {(childrenByParent.get(skill.id) ?? []).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2 pl-4">
                      {(childrenByParent.get(skill.id) ?? []).map((child) => (
                        <SkillPill
                          key={child.id}
                          skill={child}
                          selected={skillIds.includes(child.id)}
                          onToggle={() => toggleSkill(child.id)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {orphanChildren.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {orphanChildren.map((skill) => (
                    <SkillPill
                      key={skill.id}
                      skill={skill}
                      selected={skillIds.includes(skill.id)}
                      onToggle={() => toggleSkill(skill.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2"
            >
              {error}
            </p>
          ) : null}
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : null}
            {isPending ? "Submitting…" : "Submit for review"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
