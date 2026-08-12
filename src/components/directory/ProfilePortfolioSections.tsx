import Link from "next/link"
import { ExternalLink, Code2, Globe, Briefcase, FolderGit2, GraduationCap, Sparkles } from "lucide-react"
import { SkillTag } from "./SkillTag"
import type { ProfileDetail } from "@/lib/db/queries/directory"

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  } catch {
    return dateStr
  }
}

export function ProfilePortfolioSections({ profile }: { profile: ProfileDetail }) {
  const hasBio = Boolean(profile.bio && profile.bio.trim().length > 0)
  const experiences = profile.experiences ?? []
  const projects = profile.projects ?? []
  const achievements = profile.achievements ?? []
  const certificates = profile.certificates ?? []
  const skills = profile.skills ?? []

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Left Column: About, Experience, Projects */}
      <div className="space-y-8">
        {/* About Section */}
        {hasBio ? (
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-primary" />
              About
            </h3>
            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {profile.bio}
            </p>
          </section>
        ) : null}

        {/* Experience Section */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="size-5 text-primary" strokeWidth={1.5} />
            Experience
          </h3>
          {experiences.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground italic">No work experience listed.</p>
          ) : (
            <div className="mt-4 space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative pl-4 border-l-2 border-border/60 space-y-1">
                  <h4 className="font-heading text-base font-medium text-foreground">{exp.role}</h4>
                  <p className="text-sm font-medium text-primary">{exp.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(exp.startDate)} – {exp.endDate ? formatDate(exp.endDate) : "Present"}
                  </p>
                  {exp.description ? (
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {exp.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Projects Section */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderGit2 className="size-5 text-primary" strokeWidth={1.5} />
            Projects
          </h3>
          {projects.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground italic">No projects listed.</p>
          ) : (
            <div className="mt-4 space-y-6">
              {projects.map((proj) => (
                <div key={proj.id} className="group rounded-xl border border-border/40 bg-accent/20 p-4 space-y-3 transition-colors hover:border-primary/40">
                  {proj.imageUrl ? (
                    <div className="overflow-hidden rounded-lg aspect-video bg-muted relative">
                      <img
                        src={proj.imageUrl}
                        alt={proj.title}
                        loading="lazy"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    </div>
                  ) : null}
                  <div>
                    <h4 className="font-heading text-base font-semibold text-foreground">{proj.title}</h4>
                    {proj.startDate || proj.endDate ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(proj.startDate)} {proj.endDate ? `– ${formatDate(proj.endDate)}` : ""}
                      </p>
                    ) : null}
                  </div>
                  {proj.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {proj.description}
                    </p>
                  ) : null}
                  {proj.techStack && proj.techStack.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.techStack.map((tech) => (
                        <span key={tech} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3 pt-2">
                    {proj.demoUrl ? (
                      <Link
                        href={proj.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Globe className="size-3.5" strokeWidth={1.5} />
                        Demo <ExternalLink className="size-3" strokeWidth={1.5} />
                      </Link>
                    ) : null}
                    {proj.repoUrl ? (
                      <Link
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Code2 className="size-3.5" strokeWidth={1.5} />
                        Source <ExternalLink className="size-3" strokeWidth={1.5} />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right Column: Skills, Achievements (SPARK ACCENT), Certificates */}
      <div className="space-y-8">
        {/* Skills Section */}
        {skills.length > 0 ? (
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-primary" />
              Skills & Expertise
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <SkillTag key={skill.id} skill={skill} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Achievements Section - SPARK ACCENT (FR-011) */}
        <section className="rounded-2xl border-2 border-[#F97066]/30 bg-card p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 size-24 rounded-full bg-[#F97066]/10 blur-xl pointer-events-none" />
          <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-[#F97066]" strokeWidth={1.5} />
            Achievements & Honors
          </h3>
          {achievements.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground italic">No achievements listed.</p>
          ) : (
            <div className="mt-4 space-y-6">
              {achievements.map((ach) => (
                <div key={ach.id} className="space-y-2 border-b border-border/40 pb-4 last:border-0 last:pb-0">
                  {ach.imageUrl ? (
                    <div className="overflow-hidden rounded-lg aspect-video bg-muted relative">
                      <img
                        src={ach.imageUrl}
                        alt={ach.title}
                        loading="lazy"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    </div>
                  ) : null}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-heading text-base font-semibold text-foreground">{ach.title}</h4>
                      {ach.achievedDate ? (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(ach.achievedDate)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {ach.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {ach.description}
                    </p>
                  ) : null}
                  {ach.linkUrl ? (
                    <Link
                      href={ach.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#F97066] hover:underline pt-1"
                    >
                      <ExternalLink className="size-3.5" strokeWidth={1.5} />
                      View Link
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Certificates Section */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" strokeWidth={1.5} />
            Certificates & Licenses
          </h3>
          {certificates.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground italic">No certificates listed.</p>
          ) : (
            <div className="mt-4 space-y-6">
              {certificates.map((cert) => (
                <div key={cert.id} className="space-y-2 border-b border-border/40 pb-4 last:border-0 last:pb-0">
                  {cert.imageUrl ? (
                    <div className="overflow-hidden rounded-lg aspect-video bg-muted relative">
                      <img
                        src={cert.imageUrl}
                        alt={cert.title}
                        loading="lazy"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    </div>
                  ) : null}
                  <div>
                    <h4 className="font-heading text-base font-semibold text-foreground">{cert.title}</h4>
                    <p className="text-sm font-medium text-primary">{cert.issuer}</p>
                    {cert.issueDate ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Issued {formatDate(cert.issueDate)}
                      </p>
                    ) : null}
                  </div>
                  {cert.credentialUrl ? (
                    <Link
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline pt-1"
                    >
                      <ExternalLink className="size-3.5" strokeWidth={1.5} />
                      Verify Credential
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
