"use client";

import { useGetStudentScheduleWorkingDays } from "@/lib/api-client";
import type { ScheduleDay } from "@/lib/types";
import { CalendarDays, ChevronLeft, MapPin, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/utils";

function todayInKolkata(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatScheduleDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00+05:30`));
}

function DaySchedule({ day, isToday }: { day: ScheduleDay; isToday: boolean }) {
  return (
    <section data-testid={`schedule-day-${day.date}`}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {isToday ? "Today" : "Next class day"}
          </h3>
          <p className="text-xs text-muted-foreground">{formatScheduleDate(day.date)}</p>
        </div>
      </div>

      <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-border">
        {day.sessions.map((session, index) => (
          <div
            key={`${day.date}-${session.courseCode}-${session.section}-${session.startTime}-${index}`}
            className="relative flex gap-4"
          >
            <div className="w-8 shrink-0 flex justify-center z-10 pt-2">
              <div className="h-2.5 w-2.5 rounded-full ring-4 ring-background bg-primary transition-transform duration-200 group-hover:scale-125" />
            </div>
            <div className="group flex-1 rounded-2xl p-4 border bg-card border-card-border transition-colors duration-200 hover:border-primary/40">
              <span className="text-sm font-semibold text-primary">
                {formatTime(session.startTime)} - {formatTime(session.endTime)}
              </span>
              <h4 className="font-bold text-lg leading-tight mt-1 mb-1">
                {session.courseName}
              </h4>
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  {session.courseCode} · Section {session.section}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <MapPin className="h-3 w-3" /> {session.room || "TBA"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StudentSchedule({
  studentId,
  title = "Term 4 Schedule",
  onClose,
}: {
  studentId: number;
  title?: string;
  onClose?: () => void;
}) {
  const {
    data: days,
    isLoading,
    isError,
    refetch,
  } = useGetStudentScheduleWorkingDays(studentId);
  const today = todayInKolkata();

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary/70">
            Your week, at a glance
          </p>
          <h2 className="text-2xl font-display font-bold text-foreground sm:text-3xl" data-testid="text-schedule-title">
            {title}
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close schedule"
            data-testid="button-close-schedule"
            className="group mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-card-border bg-card text-muted-foreground transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border-2 border-dashed border-primary/15 bg-card p-8 text-center" data-testid="schedule-error">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <p className="font-semibold text-foreground">Schedule could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">Give it another try in a moment.</p>
          <button
            type="button"
            onClick={() => refetch()}
            data-testid="button-retry-schedule"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : days && days.length > 0 ? (
        <div className="space-y-8">
          {days.map((day) => (
            <DaySchedule key={day.date} day={day} isToday={day.date === today} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-primary/15 bg-card p-8 text-center" data-testid="schedule-empty">
          <CalendarDays className="mx-auto mb-3 h-7 w-7 text-primary/70" />
          <p className="font-semibold text-foreground">No upcoming classes scheduled.</p>
          <p className="mt-1 text-sm text-muted-foreground">Looks like a lighter week ahead.</p>
        </div>
      )}
    </section>
  );
}
