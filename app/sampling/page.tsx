"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  Trash2,
  Share2,
  Download,
  AlertCircle,
  ArrowRight,
  X,
  ChevronRight,
  BookOpen,
  LayoutGrid,
  ListOrdered,
  CalendarCheck,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStudent } from "@/hooks/use-local-student";
import {
  useGetStudent,
  useListFriends,
  useGetSamplingSessions,
  type SamplingSession,
  type SamplingVerdictStatus,
  type Campus,
  type FriendEntry,
} from "@/lib/api-client";
import {
  useSamplingPlan,
  downloadSamplingIcs,
  generateShareableText,
} from "@/hooks/use-sampling-plan";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

const DATES = [
  { id: "2026-10-19", label: "Day 1", dayName: "Mon, Oct 19" },
  { id: "2026-10-20", label: "Day 2", dayName: "Tue, Oct 20" },
];

const SLOTS = [
  { id: "08:00", start: "08:00", end: "10:00", label: "Slot 1" },
  { id: "10:15", start: "10:15", end: "12:15", label: "Slot 2" },
  { id: "12:30", start: "12:30", end: "14:30", label: "Slot 3" },
  { id: "14:45", start: "14:45", end: "16:45", label: "Slot 4" },
  { id: "17:00", start: "17:00", end: "19:00", label: "Slot 5" },
  { id: "19:15", start: "19:15", end: "21:15", label: "Slot 6" },
];

const ROOMS_BY_CAMPUS: Record<Campus, string[]> = {
  hyderabad: ["AC 2 LT", "AC 4 LT", "AC 8 LT"],
  mohali: ["AS 1 LT Nalanda", "AS 2 LT Pushpagiri", "AS 3 LT Vikramashila"],
};

export default function SamplingPage() {
  const { studentId } = useLocalStudent();
  const { data: me } = useGetStudent(studentId || 0);
  const { data: friends } = useListFriends(studentId || 0);

  // Campus selection
  const [selectedCampus, setSelectedCampus] = useState<Campus>("hyderabad");

  // Keep campus in sync with student's campus once loaded
  useEffect(() => {
    if (me?.campus) {
      setSelectedCampus(me.campus);
    }
  }, [me?.campus]);

  // Active date & view mode
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-19");
  const [activeView, setActiveView] = useState<"timeline" | "matrix" | "itinerary">("timeline");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "free-only" | "sampled-only">("all");

  // Modal detail sheet
  const [modalSession, setModalSession] = useState<SamplingSession | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Fetch all sampling sessions
  const { data: samplingData, isLoading } = useGetSamplingSessions(selectedCampus);
  const sessions = useMemo(() => samplingData?.sessions ?? [], [samplingData]);

  // Hook for user's personal sampling plan
  const {
    sampledIds,
    attendingChoices,
    verdicts,
    toggleSample,
    setChoice,
    saveVerdict,
    isSampled,
  } = useSamplingPlan(studentId);

  // Helper: check if user is officially enrolled in a session
  const isAllotted = (s: SamplingSession) => {
    if (!studentId) return false;
    return s.enrolledStudentIds.includes(studentId);
  };

  // Helper: list friends enrolled in this session
  const getEnrolledFriends = (s: SamplingSession): FriendEntry[] => {
    if (!friends) return [];
    return friends.filter((f) => s.enrolledStudentIds.includes(f.student.id));
  };

  // Group sessions by date and slot
  const sessionsBySlot = useMemo(() => {
    const map = new Map<string, SamplingSession[]>();
    for (const slot of SLOTS) {
      map.set(slot.id, []);
    }
    for (const s of sessions) {
      if (s.date === selectedDate) {
        const list = map.get(s.startTime);
        if (list) list.push(s);
      }
    }
    return map;
  }, [sessions, selectedDate]);

  // Calculate planned sessions across both days for Itinerary View & Export
  const plannedItems = useMemo(() => {
    const items: Array<{
      session: SamplingSession;
      type: "allotted" | "sample";
    }> = [];

    // For each date and each slot:
    for (const dateObj of DATES) {
      const date = dateObj.id;
      for (const slot of SLOTS) {
        const slotKey = `${date}_${slot.id}`;
        const slotSessions = sessions.filter(
          (s) => s.date === date && s.startTime === slot.start
        );
        const allotted = slotSessions.find((s) => isAllotted(s));
        const sampled = slotSessions.filter((s) => isSampled(s.id));

        if (allotted && sampled.length > 0) {
          const choice = attendingChoices[slotKey] ?? "sample";
          if (choice === "sample") {
            items.push({ session: sampled[0], type: "sample" });
          } else {
            items.push({ session: allotted, type: "allotted" });
          }
        } else if (allotted) {
          items.push({ session: allotted, type: "allotted" });
        } else if (sampled.length > 0) {
          for (const s of sampled) {
            items.push({ session: s, type: "sample" });
          }
        }
      }
    }
    return items;
  }, [sessions, studentId, sampledIds, attendingChoices]);

  // Current day's planned items count
  const day1PlannedCount = useMemo(
    () => plannedItems.filter((i) => i.session.date === "2026-10-19").length,
    [plannedItems]
  );
  const day2PlannedCount = useMemo(
    () => plannedItems.filter((i) => i.session.date === "2026-10-20").length,
    [plannedItems]
  );

  // Trigger share
  const handleShare = async () => {
    const text = generateShareableText(plannedItems, me?.name ?? "My");
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setShareToast("Sampling schedule copied to clipboard!");
      setTimeout(() => setShareToast(null), 3500);
    }
  };

  // Trigger calendar export
  const handleExportIcs = () => {
    downloadSamplingIcs(plannedItems, me?.name ?? "Student");
    setShareToast("Downloaded .ics calendar file!");
    setTimeout(() => setShareToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Sticky App Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-lg font-bold leading-none tracking-tight text-foreground">
                  Sampling Planner
                </h1>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold text-primary">
                  Term 5
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Audit any class • 19 & 20 Oct
              </p>
            </div>
          </div>

          {/* Campus Switcher Pill */}
          <div className="flex items-center rounded-xl border border-border/60 bg-muted/60 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setSelectedCampus("hyderabad")}
              className={cn(
                "rounded-lg px-2.5 py-1 transition-all",
                selectedCampus === "hyderabad"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Hyd
            </button>
            <button
              onClick={() => setSelectedCampus("mohali")}
              className={cn(
                "rounded-lg px-2.5 py-1 transition-all",
                selectedCampus === "mohali"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mohali
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-lg px-4 pt-3.5">
        {/* Toast Alert */}
        <AnimatePresence>
          {shareToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3.5 flex items-center justify-between rounded-xl bg-primary px-3.5 py-2.5 text-xs font-medium text-primary-foreground shadow-md"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{shareToast}</span>
              </div>
              <button onClick={() => setShareToast(null)} className="opacity-80 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day Selector Pill Tabs */}
        <div className="grid grid-cols-2 gap-2">
          {DATES.map((date) => {
            const isSelected = selectedDate === date.id;
            const count = date.id === "2026-10-19" ? day1PlannedCount : day2PlannedCount;
            return (
              <button
                key={date.id}
                onClick={() => setSelectedDate(date.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-2xl border px-3 py-2.5 transition-all text-center",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground shadow-sm"
                    : "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-xs font-semibold uppercase tracking-wider", isSelected ? "text-primary" : "")}>
                    {date.label}
                  </span>
                  {count > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold text-primary">
                      {count}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-foreground">{date.dayName}</span>
                {isSelected && (
                  <motion.div
                    layoutId="active-date-indicator"
                    className="absolute -bottom-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle Row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-1 text-xs">
            <button
              onClick={() => setActiveView("timeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all",
                activeView === "timeline"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setActiveView("matrix")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all",
                activeView === "matrix"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Room Grid</span>
            </button>
            <button
              onClick={() => setActiveView("itinerary")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all",
                activeView === "itinerary"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>My Plan ({plannedItems.length})</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportIcs}
              title="Download Calendar (.ics)"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleShare}
              title="Share Schedule text"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search course title, code, or faculty..."
            className="h-9 pl-9 pr-8 text-xs rounded-xl border-border/60 bg-card"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-xs font-medium">Loading Term 5 sampling schedules...</p>
          </div>
        )}

        {/* ----------------- VIEW 1: TIMELINE VIEW ----------------- */}
        {!isLoading && activeView === "timeline" && (
          <div className="mt-4 space-y-4">
            {SLOTS.map((slot) => {
              const slotSessions = (sessionsBySlot.get(slot.id) ?? []).filter((s) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                  s.courseName.toLowerCase().includes(q) ||
                  s.courseCode.toLowerCase().includes(q) ||
                  s.faculty.toLowerCase().includes(q) ||
                  s.room.toLowerCase().includes(q)
                );
              });

              if (slotSessions.length === 0) return null;

              const slotKey = `${selectedDate}_${slot.id}`;
              const allottedSession = slotSessions.find((s) => isAllotted(s));
              const sampledSessionsInSlot = slotSessions.filter((s) => isSampled(s.id));
              const hasConflict = allottedSession && sampledSessionsInSlot.length > 0;
              const attendingChoice = attendingChoices[slotKey] ?? (hasConflict ? "sample" : "allotted");

              // Other parallel options running in this slot
              const parallelSessions = slotSessions.filter(
                (s) => s !== allottedSession && !isSampled(s.id)
              );

              return (
                <div
                  key={slot.id}
                  className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm transition-all"
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="font-display text-xs font-bold text-foreground">
                        {slot.start} – {slot.end}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        • {slot.label}
                      </span>
                    </div>

                    {/* Slot Status Badge */}
                    {allottedSession ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 text-[10px] font-semibold",
                          hasConflict
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-primary/10 text-primary border border-primary/20"
                        )}
                      >
                        {hasConflict ? "Auditing Alternative" : "Allotted Class"}
                      </Badge>
                    ) : sampledSessionsInSlot.length > 0 ? (
                      <Badge
                        variant="secondary"
                        className="h-5 text-[10px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25"
                      >
                        ✨ Sampling Planned
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="h-5 text-[10px] font-semibold text-muted-foreground"
                      >
                        ✨ Free Slot
                      </Badge>
                    )}
                  </div>

                  {/* 1. If user has both Allotted & Sampled in this slot: Attending Decision Switch */}
                  {hasConflict && allottedSession && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Decide which class to sit in:</span>
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {/* Option A: Allotted */}
                        <button
                          onClick={() => setChoice(slotKey, "allotted")}
                          className={cn(
                            "flex flex-col items-start rounded-lg p-2 text-left text-xs transition-all border",
                            attendingChoice === "allotted"
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border/60 bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                            ★ Enrolled
                          </span>
                          <span className="font-semibold truncate max-w-full">
                            {allottedSession.courseCode} Sec {allottedSession.section}
                          </span>
                          <span className="text-[10px] opacity-80">{allottedSession.room}</span>
                        </button>

                        {/* Option B: Sampled */}
                        <button
                          onClick={() => setChoice(slotKey, "sample")}
                          className={cn(
                            "flex flex-col items-start rounded-lg p-2 text-left text-xs transition-all border",
                            attendingChoice === "sample"
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                              : "border-border/60 bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                            🔍 Auditing
                          </span>
                          <span className="font-semibold truncate max-w-full">
                            {sampledSessionsInSlot[0].courseCode} Sec {sampledSessionsInSlot[0].section}
                          </span>
                          <span className="text-[10px] opacity-80">
                            {sampledSessionsInSlot[0].room}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. Primary Card: Allotted Session (when no conflict) */}
                  {!hasConflict && allottedSession && (
                    <div className="mt-2.5">
                      <CourseSessionCard
                        session={allottedSession}
                        isEnrolled={true}
                        isSampled={false}
                        friends={getEnrolledFriends(allottedSession)}
                        verdict={verdicts[allottedSession.courseCode]}
                        onOpenModal={() => setModalSession(allottedSession)}
                        onToggleSample={() => toggleSample(allottedSession.id, slotKey)}
                      />
                    </div>
                  )}

                  {/* 3. Sampled sessions in this slot (if free slot or secondary) */}
                  {!hasConflict &&
                    sampledSessionsInSlot.map((s) => (
                      <div key={s.id} className="mt-2.5">
                        <CourseSessionCard
                          session={s}
                          isEnrolled={false}
                          isSampled={true}
                          friends={getEnrolledFriends(s)}
                          verdict={verdicts[s.courseCode]}
                          onOpenModal={() => setModalSession(s)}
                          onToggleSample={() => toggleSample(s.id, slotKey)}
                        />
                      </div>
                    ))}

                  {/* 4. Free slot notice if empty */}
                  {!allottedSession && sampledSessionsInSlot.length === 0 && (
                    <div className="mt-2.5 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-center">
                      <p className="text-xs font-semibold text-foreground">
                        ✨ Free Slot — No class allotted
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Pick an elective below to audit and explore during this window:
                      </p>
                    </div>
                  )}

                  {/* 5. Parallel / Other Running Classes in this slot */}
                  {parallelSessions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Other electives in this slot ({parallelSessions.length})
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {parallelSessions.map((s) => {
                          const friendsInSession = getEnrolledFriends(s);
                          return (
                            <div
                              key={s.id}
                              onClick={() => setModalSession(s)}
                              className="group flex items-center justify-between rounded-xl border border-border/50 bg-muted/25 px-3 py-2 text-xs transition-all hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-foreground">
                                    {s.courseCode}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    Sec {s.section}
                                  </span>
                                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {s.room}
                                  </span>
                                </div>
                                <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                                  {s.courseName}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {friendsInSession.length > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                    <Users className="h-3 w-3" />
                                    <span>{friendsInSession.length}</span>
                                  </span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSample(s.id, slotKey);
                                  }}
                                  className="flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2 py-1 text-[11px] font-semibold text-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Sample</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ----------------- VIEW 2: ROOM MATRIX VIEW ----------------- */}
        {!isLoading && activeView === "matrix" && (
          <div className="mt-4">
            <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm overflow-x-auto">
              <div className="min-w-[420px]">
                {/* Table Header: Rooms */}
                <div className="grid grid-cols-4 gap-2 border-b border-border/60 pb-2 text-center text-xs font-bold text-foreground">
                  <div className="text-left text-muted-foreground font-medium">Slot</div>
                  {ROOMS_BY_CAMPUS[selectedCampus].map((room) => (
                    <div key={room} className="rounded-lg bg-muted/60 py-1 px-1 truncate">
                      {room}
                    </div>
                  ))}
                </div>

                {/* Table Rows: Slots */}
                <div className="divide-y divide-border/40">
                  {SLOTS.map((slot) => {
                    const slotSessions = (sessionsBySlot.get(slot.id) ?? []).filter((s) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        s.courseName.toLowerCase().includes(q) ||
                        s.courseCode.toLowerCase().includes(q)
                      );
                    });

                    return (
                      <div key={slot.id} className="grid grid-cols-4 gap-2 py-2.5 items-center">
                        {/* Time slot column */}
                        <div className="text-left">
                          <span className="block font-bold text-xs text-foreground">
                            {slot.start}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {slot.end}
                          </span>
                        </div>

                        {/* Room columns */}
                        {ROOMS_BY_CAMPUS[selectedCampus].map((room) => {
                          const s = slotSessions.find((sess) => sess.room === room);
                          if (!s) {
                            return (
                              <div
                                key={room}
                                className="flex h-16 items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/10 text-[10px] text-muted-foreground/60"
                              >
                                Empty
                              </div>
                            );
                          }

                          const enrolled = isAllotted(s);
                          const sampled = isSampled(s.id);
                          const friendsInSession = getEnrolledFriends(s);

                          return (
                            <div
                              key={room}
                              onClick={() => setModalSession(s)}
                              className={cn(
                                "relative flex h-16 flex-col justify-between rounded-xl border p-1.5 text-left transition-all cursor-pointer",
                                enrolled
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : sampled
                                  ? "border-indigo-500 bg-indigo-500/10 shadow-sm"
                                  : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-foreground truncate">
                                    {s.courseCode}
                                  </span>
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {s.section}
                                  </span>
                                </div>
                                <p className="truncate text-[10px] text-muted-foreground">
                                  {s.courseName}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-[9px]">
                                {enrolled ? (
                                  <span className="font-bold text-primary">★ Allotted</span>
                                ) : sampled ? (
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    ✓ In Plan
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Available</span>
                                )}

                                {friendsInSession.length > 0 && (
                                  <span className="font-semibold text-primary">
                                    👥 {friendsInSession.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW 3: MY ITINERARY VIEW ----------------- */}
        {!isLoading && activeView === "itinerary" && (
          <div className="mt-4 space-y-4">
            {/* Summary Banner */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-foreground shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold">
                    Your Term 5 Sampling Plan
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {plannedItems.length} lectures planned across both days
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportIcs}
                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Calendar (.ics)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {plannedItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/80 bg-card p-8 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/60" />
                <h4 className="mt-2 text-sm font-semibold text-foreground">
                  No classes in your plan yet
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Explore running electives in the Timeline view and tap "+ Sample" to curate your schedule.
                </p>
                <button
                  onClick={() => setActiveView("timeline")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80"
                >
                  Go to Timeline <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Group by Day */}
            {DATES.map((dateObj) => {
              const dayItems = plannedItems.filter((i) => i.session.date === dateObj.id);
              if (dayItems.length === 0) return null;

              return (
                <div key={dateObj.id} className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {dateObj.dayName} ({dayItems.length} classes)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayItems.map(({ session: s, type }) => {
                      const isEnrolled = type === "allotted";
                      const verdict = verdicts[s.courseCode];

                      return (
                        <div
                          key={s.id}
                          onClick={() => setModalSession(s)}
                          className={cn(
                            "group flex items-center justify-between rounded-2xl border p-3.5 transition-all cursor-pointer bg-card shadow-sm hover:border-primary/50",
                            isEnrolled
                              ? "border-primary/30"
                              : "border-indigo-500/30"
                          )}
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm font-bold text-foreground">
                                {s.courseCode}
                              </span>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "h-4 px-1.5 text-[9px] font-semibold",
                                  isEnrolled
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                )}
                              >
                                {isEnrolled ? "Allotted" : "Sampling"}
                              </Badge>

                              {verdict?.status && verdict.status !== "undecided" && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "h-4 px-1.5 text-[9px] font-bold uppercase",
                                    verdict.status === "keep"
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : verdict.status === "backup"
                                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                  )}
                                >
                                  {verdict.status}
                                </Badge>
                              )}
                            </div>

                            <p className="mt-0.5 truncate text-xs text-foreground font-medium">
                              {s.courseName}
                            </p>

                            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {s.startTime} – {s.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {s.room}
                              </span>
                            </div>

                            {verdict?.notes && (
                              <p className="mt-1.5 line-clamp-1 text-[11px] italic text-muted-foreground/90 bg-muted/30 px-2 py-0.5 rounded-md">
                                "{verdict.notes}"
                              </p>
                            )}
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ----------------- COURSE DETAIL / VERDICT MODAL ----------------- */}
      <AnimatePresence>
        {modalSession && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setModalSession(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Course Title Header */}
              <div className="pr-8">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
                    {modalSession.courseCode}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Section {modalSession.section}
                  </span>
                  {isAllotted(modalSession) && (
                    <Badge className="bg-primary text-primary-foreground text-[10px]">
                      ★ Your Enrolled Class
                    </Badge>
                  )}
                  {isSampled(modalSession.id) && (
                    <Badge className="bg-indigo-600 text-white text-[10px]">
                      🔍 In Sampling Plan
                    </Badge>
                  )}
                </div>

                <h3 className="mt-1.5 font-display text-lg font-bold text-foreground">
                  {modalSession.courseName}
                </h3>
              </div>

              {/* Time & Venue Info Grid */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-2xl bg-muted/30 p-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Time & Slot
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {modalSession.startTime} – {modalSession.endTime}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {modalSession.date === "2026-10-19" ? "Mon, Oct 19" : "Tue, Oct 20"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Venue / Room
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">{modalSession.room}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {modalSession.campus} Campus
                  </p>
                </div>
              </div>

              {/* Toggle Sampling Button (if not allotted) */}
              {!isAllotted(modalSession) && (
                <div className="mt-3.5">
                  <button
                    onClick={() => {
                      toggleSample(modalSession.id, `${modalSession.date}_${modalSession.startTime}`);
                    }}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all shadow-sm",
                      isSampled(modalSession.id)
                        ? "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                        : "bg-primary text-primary-foreground hover:opacity-95"
                    )}
                  >
                    {isSampled(modalSession.id) ? (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Remove from Sampling Plan</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Add to My Sampling Plan</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Friends Enrolled in this Course */}
              {(() => {
                const enrolledFriends = getEnrolledFriends(modalSession);
                return (
                  <div className="mt-4 border-t border-border/50 pt-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>Friends in this Section ({enrolledFriends.length})</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {modalSession.enrolledCount} total enrolled
                      </span>
                    </div>

                    {enrolledFriends.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {enrolledFriends.map((f) => (
                          <div
                            key={f.student.id}
                            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 px-2 py-1 text-xs"
                          >
                            <Avatar
                              name={f.student.name}
                              className="h-5 w-5 text-[10px]"
                            />
                            <span className="font-medium text-foreground">{f.student.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        No friends from your friends list are enrolled in this section.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Sampling Verdict & Personal Notes */}
              <div className="mt-4 border-t border-border/50 pt-3.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span>Sampling Verdict (For Add/Drop Bidding)</span>
                </span>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Record your impressions to guide your course bidding choices:
                </p>

                {/* 3 Decision Badges */}
                {(() => {
                  const currentVerdict = verdicts[modalSession.courseCode] || {
                    status: "undecided",
                    notes: "",
                  };

                  return (
                    <div className="mt-2.5 space-y-2.5">
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() =>
                            saveVerdict(
                              modalSession.courseCode,
                              "keep",
                              currentVerdict.notes
                            )
                          }
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all",
                            currentVerdict.status === "keep"
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                              : "border-border/60 bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Must Bid</span>
                        </button>

                        <button
                          onClick={() =>
                            saveVerdict(
                              modalSession.courseCode,
                              "backup",
                              currentVerdict.notes
                            )
                          }
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all",
                            currentVerdict.status === "backup"
                              ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                              : "border-border/60 bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          <MinusCircle className="h-3.5 w-3.5" />
                          <span>Backup</span>
                        </button>

                        <button
                          onClick={() =>
                            saveVerdict(
                              modalSession.courseCode,
                              "drop",
                              currentVerdict.notes
                            )
                          }
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all",
                            currentVerdict.status === "drop"
                              ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                              : "border-border/60 bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>Drop / Pass</span>
                        </button>
                      </div>

                      {/* Personal Notes Textarea */}
                      <div>
                        <textarea
                          placeholder="Your personal review (e.g., Prof was interactive, heavy grading, great SG required...)"
                          value={currentVerdict.notes}
                          onChange={(e) =>
                            saveVerdict(
                              modalSession.courseCode,
                              currentVerdict.status,
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full rounded-xl border border-border/60 bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Close Button */}
              <div className="mt-4 pt-2 border-t border-border/50">
                <button
                  onClick={() => setModalSession(null)}
                  className="w-full rounded-xl border border-border/80 bg-muted/50 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

// Subcomponent: Course Session Card in Timeline View
function CourseSessionCard({
  session: s,
  isEnrolled,
  isSampled,
  friends,
  verdict,
  onOpenModal,
  onToggleSample,
}: {
  session: SamplingSession;
  isEnrolled: boolean;
  isSampled: boolean;
  friends: FriendEntry[];
  verdict?: { status: SamplingVerdictStatus; notes: string };
  onOpenModal: () => void;
  onToggleSample: () => void;
}) {
  return (
    <div
      onClick={onOpenModal}
      className={cn(
        "group relative flex items-center justify-between rounded-xl border p-3 transition-all cursor-pointer",
        isEnrolled
          ? "border-primary/40 bg-primary/5 hover:border-primary shadow-xs"
          : isSampled
          ? "border-indigo-500/40 bg-indigo-500/5 hover:border-indigo-500 shadow-xs"
          : "border-border/60 bg-card hover:border-border"
      )}
    >
      <div className="min-w-0 pr-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-display text-sm font-bold text-foreground">
            {s.courseCode}
          </span>
          <span className="text-xs text-muted-foreground font-semibold">
            Sec {s.section}
          </span>
          <Badge
            variant="outline"
            className="h-4 px-1 text-[9px] font-semibold text-muted-foreground"
          >
            {s.room}
          </Badge>

          {verdict?.status && verdict.status !== "undecided" && (
            <Badge
              variant="secondary"
              className={cn(
                "h-4 px-1.5 text-[9px] font-bold uppercase",
                verdict.status === "keep"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : verdict.status === "backup"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              )}
            >
              {verdict.status}
            </Badge>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
          {s.courseName}
        </p>

        {friends.length > 0 && (
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary">
            <Users className="h-3 w-3" />
            <span>
              {friends[0].student.name}
              {friends.length > 1 ? ` +${friends.length - 1} friend${friends.length > 2 ? "s" : ""}` : ""} enrolled
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isEnrolled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSample();
            }}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border",
              isSampled
                ? "border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                : "border-border/70 bg-card text-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            {isSampled ? (
              <>
                <Trash2 className="h-3 w-3" />
                <span>Remove</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                <span>Sample</span>
              </>
            )}
          </button>
        )}

        <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}
