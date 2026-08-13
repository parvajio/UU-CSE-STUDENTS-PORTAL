"use client"

import { useMemo, useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Loader2, UploadCloud, X } from "lucide-react"
import { generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/lib/uploadthing"
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
import { SECTIONS } from "../../../config/site"
import { upsertProfile, type MyProfile, type UpsertProfileInput } from "@/app/(user)/profile/actions"
import type { FlatSkill } from "@/lib/db/queries/skills"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

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
        "soft-tag cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background font-medium transition-all duration-150 text-xs sm:text-sm px-3 py-1.5",
        skill.colorKey && !selected && `soft-tag--${skill.colorKey}`,
        !skill.colorKey && !selected && "soft-tag--default",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-md font-semibold ring-2 ring-primary/40 scale-[1.02]"
          : "hover:scale-[1.01]"
      )}
    >
      {skill.name} {selected ? "✓" : ""}
    </button>
  )
}

export function ProfileForm({
  skills,
  initial,
  currentBatch,
  onSuccess,
}: {
  skills: FlatSkill[]
  initial?: MyProfile | null
  currentBatch: number
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const batchOptions = useMemo(
    () => Array.from({ length: currentBatch }, (_, i) => i + 1),
    [currentBatch]
  )

  const [fullName, setFullName] = useState(initial?.fullName ?? "")
  const [studentId, setStudentId] = useState(initial?.studentId ?? "")
  const [batchNumber, setBatchNumber] = useState(initial?.batchNumber ?? currentBatch)
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

  const topLevelSkills = useMemo(() => {
    return skills.filter(
      (skill) => skill.parentSkillId === null && !skill.isCustom && skill.colorKey !== null
    )
  }, [skills])

  const topLevelSkillIdsSet = useMemo(
    () => new Set(topLevelSkills.map((s) => s.id)),
    [topLevelSkills]
  )

  const [skillIds, setSkillIds] = useState<string[]>(
    initial?.skills.filter((skill) => topLevelSkillIdsSet.has(skill.id)).map((skill) => skill.id) ?? []
  )

  const [customSkills, setCustomSkills] = useState<string[]>(
    initial?.skills
      .filter((skill) => !topLevelSkillIdsSet.has(skill.id) || skill.isCustom)
      .map((skill) => skill.name) ?? []
  )
  const [customSkillInput, setCustomSkillInput] = useState("")

  function toggleSkill(id: string) {
    setSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function addCustomSkill() {
    const trimmed = customSkillInput.trim()
    if (!trimmed) return
    if (customSkills.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCustomSkillInput("")
      return
    }
    setCustomSkills((prev) => [...prev, trimmed])
    setCustomSkillInput("")
  }

  function removeCustomSkill(skillName: string) {
    setCustomSkills((prev) => prev.filter((s) => s !== skillName))
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
      customSkills,
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
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>{initial ? "Edit Profile" : "Create Profile"}</CardTitle>
        <CardDescription>
          {initial
            ? "Your changes will be reviewed before they appear in the directory."
            : "Fill in your details. Your profile will appear in the directory after an admin approves it."}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="grid gap-5 px-4 sm:px-6 sm:grid-cols-2 overflow-hidden">
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

          <div className="grid gap-5 sm:col-span-2 sm:grid-cols-3">
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
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label>Profile Avatar</Label>
            {avatarUrl ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30 w-full overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={avatarUrl} alt="Avatar preview" className="size-16 rounded-full object-cover shrink-0 border" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Avatar uploaded successfully</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 w-full sm:w-auto"
                  onClick={() => setAvatarUrl("")}
                >
                  Change / Remove
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 w-full overflow-hidden">
                <UploadDropzone
                  endpoint="portfolioImage"
                  config={{ mode: "auto" }}
                  content={{
                    uploadIcon: <UploadCloud className="mx-auto size-10 text-muted-foreground" strokeWidth={1.5} />,
                    button: ({ isUploading, uploadProgress }) =>
                      isUploading ? `${Math.round(uploadProgress)}%` : "Upload Avatar Image",
                    allowedContent: "Image (PNG, JPG, WebP) up to 10MB",
                  }}
                  onUploadBegin={() => setError(null)}
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.url) setAvatarUrl(res[0].url)
                  }}
                  onUploadError={(err) => setError(err.message)}
                />
              </div>
            )}
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
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
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
            </div>
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

          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
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
          </div>

          <div className="grid gap-3 sm:col-span-2">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2">
              {topLevelSkills.map((skill) => (
                <SkillPill
                  key={skill.id}
                  skill={skill}
                  selected={skillIds.includes(skill.id)}
                  onToggle={() => toggleSkill(skill.id)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:col-span-2">
            <Label htmlFor="customSkillInput">Add Custom Subskills / Tags (e.g. Next.js, Docker)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="customSkillInput"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "," || e.key === " ") {
                    e.preventDefault()
                    addCustomSkill()
                  }
                }}
                placeholder="Type skill and press Enter or comma"
              />
              <Button type="button" variant="secondary" onClick={addCustomSkill} className="shrink-0">
                Add Tag
              </Button>
            </div>
            {customSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {customSkills.map((cs) => (
                  <span
                    key={cs}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 px-3 py-1 text-xs sm:text-sm font-semibold shadow-xs"
                  >
                    {cs}
                    <button
                      type="button"
                      onClick={() => removeCustomSkill(cs)}
                      className="text-primary/70 hover:text-destructive ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                      aria-label={`Remove ${cs}`}
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
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

        <CardFooter className="px-4 sm:px-6 pb-6">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
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
