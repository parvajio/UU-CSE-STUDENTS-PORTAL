"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, Clock, MapPin, User, BookOpen, Layers } from "lucide-react"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function RoutineClientView({
  initialSlots,
  batches,
  semesters,
  sections,
}: {
  initialSlots: any[]
  batches: string[]
  semesters: string[]
  sections: string[]
}) {
  const [selectedSemester, setSelectedSemester] = useState<string>(
    semesters.length > 0 ? semesters[0] : "Summer 2026"
  )
  const [selectedBatch, setSelectedBatch] = useState<string>(
    batches.length > 0 ? batches[0] : "60"
  )
  const [selectedSection, setSelectedSection] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Available sections list constrained to standard A-L or whatever is present
  const availableSections = useMemo(() => {
    if (sections.length > 0) return sections
    return ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  }, [sections])

  // Filter slots based on semester, batch, section, and search query
  const filteredSlots = useMemo(() => {
    return initialSlots.filter((slot) => {
      // Semester filter
      if (slot.semester && slot.semester !== selectedSemester) return false

      // Batch filter
      if (selectedBatch && slot.batch !== selectedBatch && slot.batch !== "All") return false

      // Section filter
      if (selectedSection !== "ALL" && slot.section && slot.section.toUpperCase() !== selectedSection.toUpperCase()) {
        return false
      }

      // Search query filter (matches classCode, courseTitle, teacherInitial, room)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesCode = slot.classCode?.toLowerCase().includes(q)
        const matchesTitle = slot.courseTitle?.toLowerCase().includes(q)
        const matchesTeacher = slot.teacherInitial?.toLowerCase().includes(q)
        const matchesRoom = slot.room?.toLowerCase().includes(q)
        if (!matchesCode && !matchesTitle && !matchesTeacher && !matchesRoom) {
          return false
        }
      }

      return true
    })
  }, [initialSlots, selectedSemester, selectedBatch, selectedSection, searchQuery])

  // Group filtered slots by day
  const slotsByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    DAYS.forEach((day) => {
      map[day] = []
    })

    filteredSlots.forEach((slot) => {
      const dayName = slot.day ? slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase() : "Sunday"
      if (!map[dayName]) {
        map[dayName] = []
      }
      map[dayName].push(slot)
    })

    // Sort slots within each day by startPeriod or startTime
    Object.keys(map).forEach((day) => {
      map[day].sort((a, b) => {
        if (a.startPeriod !== null && b.startPeriod !== null) {
          return a.startPeriod - b.startPeriod
        }
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime)
        }
        return 0
      })
    })

    return map
  }, [filteredSlots])

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Semester Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Semester</label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.length > 0 ? (
                  semesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      {sem}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="Summer 2026">Summer 2026</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Batch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Batch Number</label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.length > 0 ? (
                  batches.map((b) => (
                    <SelectItem key={b} value={b}>
                      Batch {b}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="60">Batch 60</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Section Selector (A-L) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sections</SelectItem>
                {availableSections.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    Section {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Search Routine</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Code, Teacher, Room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Routine Display Grid by Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS.map((day) => {
          const daySlots = slotsByDay[day] || []
          if (daySlots.length === 0) return null

          return (
            <Card key={day} className="flex flex-col h-full overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/50 py-3.5 px-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  {day}
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {daySlots.length} class{daySlots.length === 1 ? "" : "es"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 flex-1 space-y-3">
                {daySlots.map((slot: any, idx: number) => (
                  <div
                    key={`${day}-${idx}-${slot.classCode}`}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors space-y-2 relative overflow-hidden"
                  >
                    {slot.isLab && (
                      <div className="absolute top-0 right-0 bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold rounded-bl uppercase">
                        Lab
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                        <BookOpen className="size-3.5 text-primary shrink-0" />
                        <span>{slot.classCode}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          (Batch {slot.batch}-{slot.section})
                        </span>
                      </div>
                    </div>

                    {slot.courseTitle && (
                      <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                        {slot.courseTitle}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs pt-1 border-t border-border/40 text-muted-foreground">
                      {slot.startTime && slot.endTime ? (
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Clock className="size-3 text-primary" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                      ) : slot.startPeriod ? (
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Clock className="size-3 text-primary" />
                          <span>Period {slot.startPeriod}</span>
                        </div>
                      ) : null}

                      {slot.room && (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground" />
                          <span>{slot.room}</span>
                        </div>
                      )}

                      {slot.teacherInitial && (
                        <div className="flex items-center gap-1 ml-auto font-semibold text-primary">
                          <User className="size-3" />
                          <span>{slot.teacherInitial}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredSlots.length === 0 && (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Layers className="size-6" />
          </div>
          <h3 className="text-lg font-semibold">No routine slots found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No class schedule matches the selected filters for Semester &ldquo;{selectedSemester}&rdquo; and Batch {selectedBatch}. Try adjusting your filters or upload a new routine PDF from the admin panel.
          </p>
        </Card>
      )}
    </div>
  )
}
