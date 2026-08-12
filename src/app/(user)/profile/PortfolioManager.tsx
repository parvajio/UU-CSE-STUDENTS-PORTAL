"use client"

import { useState, useTransition } from "react"
import {
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/lib/uploadthing"
import type {
  ProfilePortfolio,
  Achievement,
  Project,
  Certificate,
  Experience,
} from "@/types/portfolio"
import {
  addAchievement,
  updateAchievement,
  deleteAchievement,
  addProject,
  updateProject,
  deleteProject,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  addExperience,
  updateExperience,
  deleteExperience,
} from "./portfolio-actions"
import { cn } from "@/lib/utils"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

type ActiveModal =
  | { type: null; entity?: never; item?: never; id?: never; title?: never }
  | { type: "add" | "edit"; entity: "achievement" | "project" | "certificate" | "experience"; item?: Achievement | Project | Certificate | Experience; id?: never; title?: never }
  | { type: "delete"; entity: "achievement" | "project" | "certificate" | "experience"; id: string; title: string; item?: never }

export function PortfolioManager({ portfolio }: { portfolio: ProfilePortfolio }) {
  const [modal, setModal] = useState<ActiveModal>({ type: null })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [achievedDate, setAchievedDate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [demoUrl, setDemoUrl] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [techStackStr, setTechStackStr] = useState("")
  const [issuer, setIssuer] = useState("")
  const [credentialUrl, setCredentialUrl] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")

  function openAdd(entity: "achievement" | "project" | "certificate" | "experience") {
    setError(null)
    setTitle("")
    setDescription("")
    setAchievedDate("")
    setStartDate("")
    setEndDate("")
    setImageUrl("")
    setLinkUrl("")
    setDemoUrl("")
    setRepoUrl("")
    setTechStackStr("")
    setIssuer("")
    setCredentialUrl("")
    setCompany("")
    setRole("")
    setModal({ type: "add", entity })
  }

  function openEdit(
    entity: "achievement" | "project" | "certificate" | "experience",
    item: Achievement | Project | Certificate | Experience
  ) {
    setError(null)
    if (entity === "achievement") {
      const a = item as Achievement
      setTitle(a.title)
      setDescription(a.description ?? "")
      setAchievedDate(a.achievedDate ?? "")
      setImageUrl(a.imageUrl ?? "")
      setLinkUrl(a.linkUrl ?? "")
    } else if (entity === "project") {
      const p = item as Project
      setTitle(p.title)
      setDescription(p.description ?? "")
      setStartDate(p.startDate ?? "")
      setEndDate(p.endDate ?? "")
      setImageUrl(p.imageUrl ?? "")
      setDemoUrl(p.demoUrl ?? "")
      setRepoUrl(p.repoUrl ?? "")
      setTechStackStr(p.techStack?.join(", ") ?? "")
    } else if (entity === "certificate") {
      const c = item as Certificate
      setTitle(c.title)
      setIssuer(c.issuer)
      setIssueDate(c.issueDate ?? "")
      setImageUrl(c.imageUrl ?? "")
      setCredentialUrl(c.credentialUrl ?? "")
    } else if (entity === "experience") {
      const e = item as Experience
      setCompany(e.company)
      setRole(e.role)
      setStartDate(e.startDate ?? "")
      setEndDate(e.endDate ?? "")
      setDescription(e.description ?? "")
    }
    setModal({ type: "edit", entity, item } as any)
  }

  function openDelete(
    entity: "achievement" | "project" | "certificate" | "experience",
    id: string,
    titleText: string
  ) {
    setError(null)
    setModal({ type: "delete", entity, id, title: titleText })
  }

  function closeModal() {
    setModal({ type: null })
    setError(null)
  }

  // Certificate issue date state fix
  const [issueDate, setIssueDate] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      let res: { success: boolean; error?: string } = { success: false, error: "Unknown error" }

      if (modal.type === "add") {
        if (modal.entity === "achievement") {
          res = await addAchievement({
            title,
            achievedDate: achievedDate || null,
            description: description || null,
            imageUrl: imageUrl || null,
            linkUrl: linkUrl || null,
          })
        } else if (modal.entity === "project") {
          res = await addProject({
            title,
            description: description || null,
            techStack: techStackStr ? techStackStr.split(",").map((s) => s.trim()).filter(Boolean) : [],
            demoUrl: demoUrl || null,
            repoUrl: repoUrl || null,
            startDate: startDate || null,
            endDate: endDate || null,
            imageUrl: imageUrl || null,
          })
        } else if (modal.entity === "certificate") {
          res = await addCertificate({
            title,
            issuer,
            issueDate: issueDate || null,
            credentialUrl: credentialUrl || null,
            imageUrl: imageUrl || null,
          })
        } else if (modal.entity === "experience") {
          res = await addExperience({
            company,
            role,
            startDate: startDate || null,
            endDate: endDate || null,
            description: description || null,
          })
        }
      } else if (modal.type === "edit") {
        const id = (modal.item as any).id
        if (modal.entity === "achievement") {
          res = await updateAchievement(id, {
            title,
            achievedDate: achievedDate || null,
            description: description || null,
            imageUrl: imageUrl || null,
            linkUrl: linkUrl || null,
          })
        } else if (modal.entity === "project") {
          res = await updateProject(id, {
            title,
            description: description || null,
            techStack: techStackStr ? techStackStr.split(",").map((s) => s.trim()).filter(Boolean) : [],
            demoUrl: demoUrl || null,
            repoUrl: repoUrl || null,
            startDate: startDate || null,
            endDate: endDate || null,
            imageUrl: imageUrl || null,
          })
        } else if (modal.entity === "certificate") {
          res = await updateCertificate(id, {
            title,
            issuer,
            issueDate: issueDate || null,
            credentialUrl: credentialUrl || null,
            imageUrl: imageUrl || null,
          })
        } else if (modal.entity === "experience") {
          res = await updateExperience(id, {
            company,
            role,
            startDate: startDate || null,
            endDate: endDate || null,
            description: description || null,
          })
        }
      }

      if (res.success) {
        closeModal()
      } else {
        setError(res.error || "Operation failed.")
      }
    })
  }

  function handleDeleteConfirm() {
    if (modal.type !== "delete") return
    setError(null)

    startTransition(async () => {
      let res: { success: boolean; error?: string } = { success: false }
      if (modal.entity === "achievement") {
        res = await deleteAchievement(modal.id)
      } else if (modal.entity === "project") {
        res = await deleteProject(modal.id)
      } else if (modal.entity === "certificate") {
        res = await deleteCertificate(modal.id)
      } else if (modal.entity === "experience") {
        res = await deleteExperience(modal.id)
      }

      if (res.success) {
        closeModal()
      } else {
        setError(res.error || "Failed to delete item.")
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="border-t border-border pt-8">
        <h2 className="font-heading text-2xl font-bold text-foreground">Portfolio Showcase</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your achievements, projects, certificates, and work experience to showcase on your profile detail page.
        </p>
      </div>

      {/* 4 Section Cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* Achievements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="size-5 text-[#F97066]" strokeWidth={1.5} />
              Achievements & Honors
            </CardTitle>
            <Button size="sm" onClick={() => openAdd("achievement")}>
              <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
              Add Achievement
            </Button>
          </CardHeader>
          <CardContent>
            {portfolio.achievements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-xl bg-muted/20">
                <Award className="size-10 text-muted-foreground/60 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground">No achievements added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Highlight your awards, honors, and milestones.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => openAdd("achievement")}>
                  <Plus className="size-4 mr-1.5" strokeWidth={1.5} /> Add Achievement
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.achievements.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-heading font-semibold text-foreground">{item.title}</h4>
                      {item.achievedDate ? <p className="text-xs text-muted-foreground">{item.achievedDate}</p> : null}
                      {item.description ? <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p> : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit("achievement", item)}>
                        <Pencil className="size-4" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete("achievement", item.id, item.title)}>
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderGit2 className="size-5 text-primary" strokeWidth={1.5} />
              Projects
            </CardTitle>
            <Button size="sm" onClick={() => openAdd("project")}>
              <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
              Add Project
            </Button>
          </CardHeader>
          <CardContent>
            {portfolio.projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-xl bg-muted/20">
                <FolderGit2 className="size-10 text-muted-foreground/60 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground">No projects added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Showcase applications, research projects, and code repos.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => openAdd("project")}>
                  <Plus className="size-4 mr-1.5" strokeWidth={1.5} /> Add Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.projects.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-heading font-semibold text-foreground">{item.title}</h4>
                      {item.techStack && item.techStack.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.techStack.map((t) => (
                            <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {item.description ? <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p> : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit("project", item)}>
                        <Pencil className="size-4" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete("project", item.id, item.title)}>
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="size-5 text-primary" strokeWidth={1.5} />
              Certificates & Licenses
            </CardTitle>
            <Button size="sm" onClick={() => openAdd("certificate")}>
              <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
              Add Certificate
            </Button>
          </CardHeader>
          <CardContent>
            {portfolio.certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-xl bg-muted/20">
                <GraduationCap className="size-10 text-muted-foreground/60 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground">No certificates added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add professional certifications and course completions.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => openAdd("certificate")}>
                  <Plus className="size-4 mr-1.5" strokeWidth={1.5} /> Add Certificate
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.certificates.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-heading font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm font-medium text-primary">{item.issuer}</p>
                      {item.issueDate ? <p className="text-xs text-muted-foreground">Issued {item.issueDate}</p> : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit("certificate", item)}>
                        <Pencil className="size-4" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete("certificate", item.id, item.title)}>
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="size-5 text-primary" strokeWidth={1.5} />
              Work Experience
            </CardTitle>
            <Button size="sm" onClick={() => openAdd("experience")}>
              <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
              Add Experience
            </Button>
          </CardHeader>
          <CardContent>
            {portfolio.experiences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-xl bg-muted/20">
                <Briefcase className="size-10 text-muted-foreground/60 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground">No experience added yet</p>
                <p className="text-xs text-muted-foreground mt-1">List jobs, internships, and leadership roles.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => openAdd("experience")}>
                  <Plus className="size-4 mr-1.5" strokeWidth={1.5} /> Add Experience
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.experiences.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-heading font-semibold text-foreground">{item.role}</h4>
                      <p className="text-sm font-medium text-primary">{item.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.startDate ?? ""} – {item.endDate ? item.endDate : "Present"}
                      </p>
                      {item.description ? <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p> : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit("experience", item)}>
                        <Pencil className="size-4" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete("experience", item.id, item.role)}>
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={modal.type === "add" || modal.type === "edit"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modal.type === "add" ? `Add ${modal.entity}` : `Edit ${modal.entity}`}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for your portfolio entry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {modal.entity === "achievement" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} placeholder="e.g. Dean's List Award" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievedDate">Date Achieved</Label>
                  <Input id="achievedDate" type="date" value={achievedDate} onChange={(e) => setAchievedDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} placeholder="Brief details about the achievement" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">Optional Link URL</Label>
                  <Input id="linkUrl" type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Optional Image (Max 10MB)</Label>
                  {imageUrl ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border p-2 bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={imageUrl} alt="Preview" className="size-16 rounded object-cover shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground truncate">Image attached successfully</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => setImageUrl("")}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <UploadDropzone
                      endpoint="portfolioImage"
                      config={{ mode: "auto" }}
                      content={{
                        button: ({ isUploading, uploadProgress }) =>
                          isUploading ? `${Math.round(uploadProgress)}%` : "Choose image",
                        allowedContent: "Image up to 10MB",
                      }}
                      onUploadBegin={() => setError(null)}
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) setImageUrl(res[0].url)
                      }}
                      onUploadError={(err) => setError(err.message)}
                    />
                  )}
                </div>
              </>
            )}

            {modal.entity === "project" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} placeholder="e.g. AI Study Assistant" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="What does this project do?" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="techStack">Tech Stack (comma separated)</Label>
                  <Input id="techStack" value={techStackStr} onChange={(e) => setTechStackStr(e.target.value)} placeholder="React, Node.js, PostgreSQL" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date (leave blank if present)</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demoUrl">Demo URL</Label>
                  <Input id="demoUrl" type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repoUrl">Repository URL</Label>
                  <Input id="repoUrl" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Optional Project Image (Max 10MB)</Label>
                  {imageUrl ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border p-2 bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={imageUrl} alt="Preview" className="size-16 rounded object-cover shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground truncate">Image attached successfully</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => setImageUrl("")}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <UploadDropzone
                      endpoint="portfolioImage"
                      config={{ mode: "auto" }}
                      content={{
                        button: ({ isUploading, uploadProgress }) =>
                          isUploading ? `${Math.round(uploadProgress)}%` : "Choose image",
                        allowedContent: "Image up to 10MB",
                      }}
                      onUploadBegin={() => setError(null)}
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) setImageUrl(res[0].url)
                      }}
                      onUploadError={(err) => setError(err.message)}
                    />
                  )}
                </div>
              </>
            )}

            {modal.entity === "certificate" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Certificate Title *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} placeholder="e.g. AWS Certified Developer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuer">Issuer *</Label>
                  <Input id="issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} required maxLength={200} placeholder="e.g. Amazon Web Services" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credentialUrl">Credential URL</Label>
                  <Input id="credentialUrl" type="url" value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Optional Certificate Image (Max 10MB)</Label>
                  {imageUrl ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border p-2 bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={imageUrl} alt="Preview" className="size-16 rounded object-cover shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground truncate">Image attached successfully</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => setImageUrl("")}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <UploadDropzone
                      endpoint="portfolioImage"
                      config={{ mode: "auto" }}
                      content={{
                        button: ({ isUploading, uploadProgress }) =>
                          isUploading ? `${Math.round(uploadProgress)}%` : "Choose image",
                        allowedContent: "Image up to 10MB",
                      }}
                      onUploadBegin={() => setError(null)}
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) setImageUrl(res[0].url)
                      }}
                      onUploadError={(err) => setError(err.message)}
                    />
                  )}
                </div>
              </>
            )}

            {modal.entity === "experience" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company">Company / Organization *</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required maxLength={200} placeholder="e.g. Tech Corp" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Title *</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required maxLength={200} placeholder="e.g. Software Engineering Intern" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date (leave blank if present)</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="What did you do in this role?" rows={3} />
                </div>
              </>
            )}

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin mr-1.5" strokeWidth={1.5} />}
                Save Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={modal.type === "delete"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{modal.type === "delete" ? modal.title : ""}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin mr-1.5" strokeWidth={1.5} />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
