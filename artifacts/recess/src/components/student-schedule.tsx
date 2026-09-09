import {
  useGetStudentScheduleWorkingDays,
  type ScheduleDay,
} from "@workspace/api-client-react";
import { CalendarDays, MapPin } from "lucide-react";
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
    <section>
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
              <div className="h-2.5 w-2.5 rounded-full ring-4 ring-background bg-primary" />
            </div>
            <div className="flex-1 rounded-2xl p-4 border bg-card border-card-border">
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
}: {
  studentId: number;
  title?: string;
}) {
  const {
    data: days,
    isLoading,
    isError,
  } = useGetStudentScheduleWorkingDays(studentId);
  const today = todayInKolkata();

  return (
    <section className="mb-10">
      <h2 className="text-xl font-display font-bold mb-5">{title}</h2>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="p-5 text-center border-2 border-dashed rounded-2xl bg-card">
          <p className="text-muted-foreground">Schedule could not be loaded.</p>
        </div>
      ) : days && days.length > 0 ? (
        <div className="space-y-8">
          {days.map((day) => (
            <DaySchedule key={day.date} day={day} isToday={day.date === today} />
          ))}
        </div>
      ) : (
        <div className="p-5 text-center border-2 border-dashed rounded-2xl bg-card">
          <p className="text-muted-foreground">No upcoming classes scheduled.</p>
        </div>
      )}
    </section>
  );
}