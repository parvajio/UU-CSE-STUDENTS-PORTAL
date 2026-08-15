"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, Clock, MapPin, User, BookOpen, Layers } from "lucide-react"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function RoutineClientView({
  initialSlots,
  batches,
  sections,
}: {
  initialSlots: any[]
  batches: string[]
  sections: string[]
}) {
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL")
  const [selectedSection, setSelectedSection] = useState<string>("ALL")
  const [selectedDay, setSelectedDay] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const availableSections = useMemo(() => {
    if (sections.length > 0) return sections
    return ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  }, [sections])

  // Filter slots based on batch, section, day, and search query
  const filteredSlots = useMemo(() => {
    return initialSlots.filter((slot) => {
      // Batch filter ("ALL" means show all batches)
      if (selectedBatch !== "ALL" && slot.batch !== selectedBatch && slot.batch !== "All") {
        return false
      }

      // Section filter
      if (selectedSection !== "ALL" && slot.section && slot.section.toUpperCase() !== selectedSection.toUpperCase()) {
        return false
      }

      // Day filter
      if (selectedDay !== "ALL") {
        const slotDay = slot.day ? slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase() : ""
        if (slotDay !== selectedDay) return false
      }

      // Search query filter
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
  }, [initialSlots, selectedBatch, selectedSection, selectedDay, searchQuery])

  // Group slots by day first, then by section if "ALL" sections is selected
  const structuredRoutine = useMemo(() => {
    const daysToIterate = selectedDay !== "ALL" ? [selectedDay] : DAYS
    const map: Record<string, Record<string, any[]>> = {}

    daysToIterate.forEach((day) => {
      map[day] = {}
    })

    filteredSlots.forEach((slot) => {
      const dayName = slot.day ? slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase() : "Sunday"
      if (!map[dayName]) map[dayName] = {}

      const secName = slot.section ? `Section ${slot.section.toUpperCase()}` : "Section A"
      if (!map[dayName][secName]) map[dayName][secName] = []

      map[dayName][secName].push(slot)
    })

    // Sort slots within each section by startPeriod or startTime
    Object.keys(map).forEach((day) => {
      Object.keys(map[day]).forEach((sec) => {
        map[day][sec].sort((a: any, b: any) => {
          if (a.startPeriod !== null && b.startPeriod !== null) {
            return a.startPeriod - b.startPeriod
          }
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime)
          }
          return 0
        })
      })
    })

    return map
  }, [filteredSlots, selectedDay])

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Batch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Batch Number</label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Batches</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b} value={b}>
                    Batch {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sections (A-L)</SelectItem>
                {availableSections.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    Section {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Day of Week</label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger>
                <SelectValue placeholder="Select Day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Days</SelectItem>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Code, teacher, room..."
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
        {Object.keys(structuredRoutine).map((day) => {
          const sectionsMap = structuredRoutine[day]
          const sectionKeys = Object.keys(sectionsMap).sort()
          const totalDaySlots = sectionKeys.reduce((acc, sec) => acc + sectionsMap[sec].length, 0)

          if (totalDaySlots === 0) return null

          return (
            <Card key={day} className="flex flex-col h-full overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/60 py-3.5 px-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  {day}
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {totalDaySlots} class{totalDaySlots === 1 ? "" : "es"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 flex-1 space-y-5">
                {sectionKeys.map((secName) => {
                  const slots = sectionsMap[secName]
                  if (slots.length === 0) return null

                  return (
                    <div key={secName} className="space-y-2.5">
                      {selectedSection === "ALL" && (
                        <div className="py-1.5 px-3 rounded-md bg-primary/10 dark:bg-primary/15 border border-primary/20 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-primary tracking-wider uppercase">
                            ⭐ {secName}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {slots.length} slot{slots.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        {slots.map((slot: any, idx: number) => {
                          const classCode = slot.classCode || "N/A"
                          const teacherInitial = slot.teacherInitial || "N/A"
                          const room = slot.room || "N/A"
                          const periodText = slot.startTime && slot.endTime
                            ? `${slot.startTime} - ${slot.endTime}`
                            : slot.startPeriod
                            ? `Period ${slot.startPeriod}`
                            : "N/A"

                          return (
                            <div
                              key={`${day}-${secName}-${idx}-${classCode}`}
                              className="p-3.5 rounded-lg border bg-card hover:bg-accent/5 transition-colors space-y-3 relative overflow-hidden shadow-xs"
                            >
                              {slot.isLab && (
                                <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-600 to-indigo-600 text-white px-2 py-0.5 text-[10px] font-extrabold rounded-bl uppercase tracking-wider shadow-xs">
                                  Lab
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-2 pr-6">
                                <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                                  <BookOpen className="size-3.5 text-indigo-500 shrink-0" />
                                  <span>{classCode}</span>
                                  {/* Teacher Initial next to class code */}
                                  <span className="inline-flex items-center gap-1 bg-violet-500/15 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded text-[11px] font-bold ml-1.5">
                                    <User className="size-3 text-violet-600 dark:text-violet-400" />
                                    <span>{teacherInitial}</span>
                                  </span>
                                </div>
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  Batch {slot.batch}-{slot.section}
                                </span>
                              </div>

                              {slot.courseTitle && (
                                <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                                  {slot.courseTitle}
                                </p>
                              )}

                              {/* Period and Room at the bottom with high visibility & colorful styling */}
                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                                <div className="inline-flex items-center gap-1 bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs">
                                  <Clock className="size-3.5 text-sky-600 dark:text-sky-400" />
                                  <span>{periodText}</span>
                                </div>

                                <div className="inline-flex items-center gap-1 bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs">
                                  <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Room {room}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
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
            No class schedule matches the selected filters. Try adjusting your batch, section, day, or search filters.
          </p>
        </Card>
      )}
    </div>
  )
}
