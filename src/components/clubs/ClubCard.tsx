import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Users, Calendar } from "lucide-react"
import { type clubs } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

export function ClubCard({ club }: { club: typeof clubs.$inferSelect }) {
  return (
    <Link href={`/clubs/${club.id}`}>
      <Card className="group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-indigo-500 to-violet-500 opacity-80 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-5 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {club.logoUrl ? (
                  <img
                    src={club.logoUrl}
                    alt={club.name}
                    className="w-10 h-10 rounded-lg object-cover bg-muted"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <ImageIcon className="size-5" strokeWidth={1.5} />
                  </div>
                )}
                <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {club.name}
                </h3>
              </div>
              {club.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {club.description}
                </p>
              )}
            </div>
            <Badge variant="default" className="shrink-0">
              Approved
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
