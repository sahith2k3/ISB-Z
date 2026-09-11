"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { StudentSchedule } from "@/components/student-schedule";
import { useLocalStudent } from "@/hooks/use-local-student";
import { BottomNav } from "@/components/bottom-nav";

export default function SchedulePage() {
  const { studentId } = useLocalStudent();

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
    <div className="min-h-[100dvh] max-w-md mx-auto overflow-y-auto bg-background px-6 pb-32 pt-7">
      <header className="mb-8 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to friends"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
            Your week, at a glance
          </p>
          <h1 className="text-3xl font-display font-bold">My schedule</h1>
        </div>
      </header>
      <StudentSchedule studentId={studentId} title="Upcoming classes" />
      <BottomNav />
    </div>
  );
}