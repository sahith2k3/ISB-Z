"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { StudentSchedule } from "@/components/student-schedule";
import { useLocalStudent } from "@/hooks/use-local-student";
import { BottomNav } from "@/components/bottom-nav";
import { ShareButton } from "@/components/share-button";

export default function SchedulePage() {
  const { studentId } = useLocalStudent();

  if (!studentId) {
    return (
      <div className="min-h-[100dvh] max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-4">Please select your student profile first.</p>
        <Link
          href="/"
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] max-w-md mx-auto overflow-y-auto bg-background px-6 pb-32 pt-7">
      <header className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            aria-label="Back to friends"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 truncate">
              Your week, at a glance
            </p>
            <h1 className="text-3xl font-display font-bold truncate">My schedule</h1>
          </div>
        </div>
        <ShareButton source="schedule_header" />
      </header>
      <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
        <span className="text-base leading-none shrink-0">ℹ️</span>
        <div>
          <span className="font-semibold text-foreground block mb-0.5">Term 4 Schedule Updates</span>
          Rescheduled classes (Mohali: CCMA, LPFW, LSCM; Hyderabad: CMGT) are updated. Strikethrough sessions indicate original slots with their new dates noted.
        </div>
      </div>
      <StudentSchedule studentId={studentId} title="Upcoming classes" />
      <BottomNav />
    </div>
  );
}