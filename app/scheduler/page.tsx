"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  getGetStudentScheduleForDateQueryKey,
  getGetStudentScheduleForDateQueryOptions,
  useGetSchedulerDates,
  type ClassSession,
  type StudentSummary,
  useGetStudent,
  useListStudents,
} from "@/lib/api-client";
import {
  CalendarDays,
  Check,
  Clock3,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocalStudent } from "@/hooks/use-local-student";
import { formatTime } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import { ShareButton } from "@/components/share-button";
import Link from "next/link";

const MAX_GROUP_SIZE = 5;
const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const MIN_FREE_WINDOW_MINUTES = 30;
const GROUP_STORAGE_KEY = "recess-scheduler-group";

type FreeWindow = {
  start: number;
  end: number;
};

function loadSavedGroup(studentId: number | null): StudentSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(`${GROUP_STORAGE_KEY}:${studentId ?? "unknown"}`);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as StudentSummary[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_GROUP_SIZE) : [];
  } catch {
    return [];
  }
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function formatDay(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${date}T12:00:00+05:30`));
}

function getTodayInKolkata(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

const TERM4_FRIDAYS_WITH_CLASSES = new Set([
  "2026-09-11",
  "2026-09-18",
  "2026-09-25",
  "2026-10-09",
]);

function getClientFallbackDates(count = 7): string[] {
  const todayStr = getTodayInKolkata();
  const result: string[] = [];
  const start = new Date(`${todayStr}T12:00:00+05:30`);

  for (let i = 0; i < 60 && result.length < count; i++) {
    const cur = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(cur);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(cur);

    if (["Mon", "Tue", "Wed", "Thu"].includes(weekday)) {
      result.push(dateStr);
    } else if (weekday === "Fri" && TERM4_FRIDAYS_WITH_CLASSES.has(dateStr)) {
      result.push(dateStr);
    }
  }

  return result;
}

function getDateTag(dateStr: string, index: number, todayStr: string): string {
  if (dateStr === todayStr) return "Today";
  const todayDt = new Date(`${todayStr}T12:00:00+05:30`);
  const tomDt = new Date(todayDt.getTime() + 24 * 60 * 60 * 1000);
  const tomParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(tomDt);
  const get = (type: string) => tomParts.find((p) => p.type === type)?.value ?? "";
  const tomorrowStr = `${get("year")}-${get("month")}-${get("day")}`;
  if (dateStr === tomorrowStr) return "Tomorrow";
  if (index === 0) return "Soonest";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${dateStr}T12:00:00+05:30`));
}

function findFreeWindows(sessions: ClassSession[]): FreeWindow[] {
  const busy = sessions
    .filter((session) => !session.isCancelled)
    .map((session) => ({
      start: Math.max(DAY_START, toMinutes(session.startTime)),
      end: Math.min(DAY_END, toMinutes(session.endTime)),
    }))
    .filter((session) => session.end > session.start)
    .sort((a, b) => a.start - b.start);

  const mergedBusy: FreeWindow[] = [];
  for (const session of busy) {
    const previous = mergedBusy[mergedBusy.length - 1];
    if (previous && session.start <= previous.end) {
      previous.end = Math.max(previous.end, session.end);
    } else {
      mergedBusy.push({ ...session });
    }
  }

  const free: FreeWindow[] = [];
  let cursor = DAY_START;
  for (const session of mergedBusy) {
    if (session.start > cursor) free.push({ start: cursor, end: session.start });
    cursor = Math.max(cursor, session.end);
  }
  if (cursor < DAY_END) free.push({ start: cursor, end: DAY_END });
  return free.filter((window) => window.end - window.start >= MIN_FREE_WINDOW_MINUTES);
}

function formatDuration(window: FreeWindow): string {
  const minutes = window.end - window.start;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

export default function Scheduler() {
  const { studentId } = useLocalStudent();
  const { data: me } = useGetStudent(studentId!);
  const [group, setGroup] = useState<StudentSummary[]>(() => loadSavedGroup(studentId));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const hasInitializedGroup = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!hasInitializedGroup.current && group.length === 0 && me) {
      hasInitializedGroup.current = true;
      setGroup([me]);
    }
  }, [group.length, me]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${GROUP_STORAGE_KEY}:${studentId ?? "unknown"}`, JSON.stringify(group));
    }
  }, [group, studentId]);

  const { data: results, isLoading: searchLoading } = useListStudents(
    { search: debouncedSearch, limit: 12 },
    {
      query: {
        enabled: debouncedSearch.length > 1,
        queryKey: ["schedulerStudentSearch", debouncedSearch],
      },
    },
  );

  const { data: serverDatesData, isLoading: datesLoading } = useGetSchedulerDates();

  const dayOptions = useMemo(() => {
    if (serverDatesData?.dates && serverDatesData.dates.length > 0) {
      return serverDatesData.dates;
    }
    return getClientFallbackDates(7);
  }, [serverDatesData]);

  useEffect(() => {
    if (!selectedDate || !dayOptions.includes(selectedDate)) {
      if (dayOptions.length > 0) {
        setSelectedDate(dayOptions[0]);
      }
    }
  }, [dayOptions, selectedDate]);

  const dayQueries = useQueries({
    queries: selectedDate
      ? group.map((person) =>
          getGetStudentScheduleForDateQueryOptions(person.id, selectedDate, {
            query: {
              queryKey: getGetStudentScheduleForDateQueryKey(person.id, selectedDate),
              staleTime: 60_000,
            },
          }),
        )
      : [],
  });

  const isDayLoading = dayQueries.some((query) => query.isLoading);
  const hasDayError = dayQueries.some((query) => query.isError);
  const freeWindows = useMemo(() => {
    if (!selectedDate || group.length === 0 || hasDayError) return [];
    const sessions = dayQueries.flatMap((query) => query.data ?? []);
    return findFreeWindows(sessions);
  }, [dayQueries, group.length, hasDayError, selectedDate]);

  const addPerson = (person: StudentSummary) => {
    if (group.some((member) => member.id === person.id) || group.length >= MAX_GROUP_SIZE) return;
    setGroup((current) => [...current, person]);
    setSearch("");
    setDebouncedSearch("");
  };

  const removePerson = (id: number) => {
    setGroup((current) => current.filter((person) => person.id !== id));
  };

  if (!studentId) {
    return (
      <div className="min-h-[100dvh] max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-4">Please select your student profile first.</p>
        <Link
          href="/"
          className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto overflow-x-hidden overflow-y-auto bg-background px-4 sm:px-6 pb-32 pt-7">
      <header className="mb-7">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary min-w-0">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] truncate">Plan together</span>
          </div>
          <ShareButton source="scheduler_header" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Find a time for everyone</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Build a group of up to five and see when all of you are free on the same day.
        </p>
      </header>

      <section className="mb-6 rounded-3xl border border-primary/10 bg-card p-4 shadow-sm w-full min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">Your group</p>
            <p className="text-xs text-muted-foreground">{group.length} of {MAX_GROUP_SIZE} people</p>
          </div>
          <Badge variant={group.length === MAX_GROUP_SIZE ? "default" : "secondary"}>
            {group.length}/{MAX_GROUP_SIZE}
          </Badge>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {group.map((person) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-xs font-semibold text-primary"
              >
                <Avatar name={person.name} className="h-6 w-6 text-[10px]" />
                <span className="max-w-[130px] truncate">{person.name}</span>
                <button
                  type="button"
                  onClick={() => removePerson(person.id)}
                  aria-label={`Remove ${person.name}`}
                  className="rounded-full p-0.5 transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {group.length === 0 && (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4" />
              Add people below to start comparing.
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={group.length >= MAX_GROUP_SIZE ? "Group is full" : "Add someone by name..."}
            disabled={group.length >= MAX_GROUP_SIZE}
            className="h-11 rounded-2xl bg-background pl-9"
            aria-label="Search people to add"
          />
        </div>

        {debouncedSearch.length > 1 && group.length < MAX_GROUP_SIZE && (
          <div className="mt-3 space-y-2">
            {searchLoading ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">Searching...</p>
            ) : results?.length ? (
              results
                .filter((person) => !group.some((member) => member.id === person.id))
                .map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => addPerson(person)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-card-border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Avatar name={person.name} className="h-9 w-9" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{person.name}</span>
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                  </button>
                ))
            ) : (
              <p className="px-2 py-2 text-sm text-muted-foreground">No one found.</p>
            )}
          </div>
        )}
      </section>

      {group.length > 0 && (
        <>
          <section className="mb-6 w-full min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-[0.16em]">Choose a day</h2>
            </div>
            {dayOptions.length > 0 ? (
              <div className="w-full min-w-0 overflow-x-auto pb-2 pt-0.5 -mx-4 px-4 sm:-mx-6 sm:px-6 overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="inline-flex gap-2">
                  {dayOptions.map((date, index) => {
                    const active = date === selectedDate;
                    const todayStr = getTodayInKolkata();
                    const tag = getDateTag(date, index, todayStr);
                    return (
                      <button
                        type="button"
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`min-w-[95px] shrink-0 rounded-2xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-card-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        <span className="block text-[11px] font-bold uppercase tracking-wide opacity-70">
                          {tag}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold">{formatDay(date)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (isDayLoading || datesLoading) ? (
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            ) : (
              <div className="rounded-2xl border border-dashed border-primary/20 bg-card p-4 text-sm text-muted-foreground">
                No upcoming class days were found for this group.
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/15 w-full min-w-0">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/65">
                  Shared availability
                </p>
                <h2 className="mt-1 text-2xl font-display font-bold truncate">
                  {selectedDate ? formatDay(selectedDate) : "Pick a day"}
                </h2>
              </div>
              <Clock3 className="h-6 w-6 text-primary-foreground/70 shrink-0" />
            </div>

            {isDayLoading ? (
              <div className="space-y-3">
                <div className="h-16 animate-pulse rounded-2xl bg-white/15" />
                <div className="h-16 animate-pulse rounded-2xl bg-white/15" />
              </div>
            ) : hasDayError ? (
              <div className="rounded-2xl bg-white/10 p-4 text-sm text-primary-foreground/80">
                One person’s schedule could not be loaded. Try choosing the day again.
              </div>
            ) : freeWindows.length > 0 ? (
              <div className="space-y-2">
                {freeWindows.map((window) => (
                  <div
                    key={`${window.start}-${window.end}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-base sm:text-lg font-bold truncate">
                        {formatTime(toTime(window.start))} – {formatTime(toTime(window.end))}
                      </p>
                      <p className="text-xs text-primary-foreground/65">Everyone is free</p>
                    </div>
                    <Badge className="border-white/20 bg-white/15 text-primary-foreground shadow-none shrink-0 text-xs">
                      {formatDuration(window)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/10 p-4 text-sm text-primary-foreground/80">
                No shared free window found between 8:00 AM and 8:00 PM.
              </div>
            )}
          </section>

          <div className="mt-4 flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-free" />
            <span>Availability is calculated from everyone’s scheduled classes.</span>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}