import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList, ExternalLink, FileText, Pencil, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/approval/StatusBadge"
import { cn } from "@/lib/utils"
import { getMyProfile } from "../profile/actions"
import { getMyQuestions } from "@/lib/db/queries/questions-mine"
import { auth } from "@/lib/auth/auth"
import { EXAM_TYPE_LABELS } from "@/lib/question-bank/validation"
import {
  PROGRAM_TYPE_LABELS,
  SEASON_LABELS,
} from "@/lib/question-bank/constants"
import { formatDate } from "@/lib/utils"

export const metadata: Metadata = {
  title: "My Submissions",
}

export default async function MySubmissionsPage() {
  const [profile, session] = await Promise.all([
    getMyProfile(),
    auth(),
  ])

  const myQuestions = session?.user?.id ? await getMyQuestions(session.user.id) : []

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          My Submissions
        </h1>
        <p className="mt-2 text-muted-foreground">
          Track the review status of everything you&apos;ve submitted.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Profile Submission Section */}
        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
            Profile Submission
          </h2>
          {profile ? (
            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={profile.status} />
                  <span className="text-xs text-muted-foreground">
                    Submitted on {formatDate(profile.createdAt)}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {profile.fullName}
                  </h3>
                  {profile.studentId ? (
                    <p className="text-sm font-medium text-foreground">
                      Student ID: {profile.studentId}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Batch {profile.batchNumber} · Section {profile.section}
                    {profile.isAlumni ? " · Alumni" : ""}
                  </p>
                  {profile.isAlumni &&
                  (profile.currentCompany || profile.jobPosition) ? (
                    <p className="text-xs text-muted-foreground">
                      {profile.currentCompany}
                      {profile.currentCompany && profile.jobPosition ? " · " : ""}
                      {profile.jobPosition}
                    </p>
                  ) : null}
                </div>

                {profile.skills.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className={cn(
                          "soft-tag",
                          skill.colorKey
                            ? `soft-tag--${skill.colorKey}`
                            : "soft-tag--default",
                          "px-2 py-0.5 text-xs"
                        )}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                {profile.bio ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {profile.bio}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/profile">
                      <Pencil className="size-4" strokeWidth={1.5} />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No profile submission yet"
              description="Create your profile and it will show up here once it's submitted for review."
              icon={<ClipboardList className="size-8" strokeWidth={1.5} />}
              action={
                <Button asChild>
                  <Link href="/profile">Create your profile</Link>
                </Button>
              }
            />
          )}
        </section>

        {/* Question Submissions Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Question Submissions
            </h2>
            <Button asChild size="sm">
              <Link href="/upload-question">Upload Question</Link>
            </Button>
          </div>

          {myQuestions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {myQuestions.map((q) => {
                const seasonYear = q.season
                  ? `${SEASON_LABELS[q.season]}${q.year ? ` ${q.year}` : ""}`
                  : null

                return (
                  <Card key={q.id}>
                    <CardContent className="flex flex-col gap-3 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusBadge status={q.status} />
                        <span className="text-xs text-muted-foreground">
                          Submitted on {formatDate(q.createdAt)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{q.courseCode}</span>
                        </div>
                        <h3 className="font-heading text-base font-semibold text-foreground mt-1">
                          {q.title}
                        </h3>
                        <p className="text-sm font-medium text-foreground">
                          {q.courseTitle}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Batch {q.batchNumber} · {EXAM_TYPE_LABELS[q.examType]}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="soft-tag soft-tag--default px-2 py-0.5 text-xs">
                          {PROGRAM_TYPE_LABELS[q.programType]}
                        </span>
                        {seasonYear ? (
                          <span className="text-xs text-muted-foreground">
                            {seasonYear}
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {q.files.length} file(s) ({q.files[0]?.fileType ?? "file"})
                        </span>
                      </div>

                      {q.status === "rejected" && q.rejectionReason ? (
                        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                          <AlertCircle className="size-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                          <div>
                            <p className="font-semibold">Rejection Reason:</p>
                            <p className="mt-0.5 text-xs">{q.rejectionReason}</p>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        {q.status === "approved" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/question-bank/${q.id}`}>
                              View / Preview
                              <ExternalLink className="size-3.5 ml-1.5" strokeWidth={1.5} />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="No question submissions yet"
              description="Upload past exam question papers to share with the student community."
              icon={<FileText className="size-8" strokeWidth={1.5} />}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/upload-question">Upload a question</Link>
                </Button>
              }
            />
          )}
        </section>
      </div>
    </main>
  )
}
