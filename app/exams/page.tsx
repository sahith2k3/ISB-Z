"use client";

import Link from "next/link";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent, useGetExams } from "@/lib/api-client";
import type { Campus } from "@/lib/types";
import {
  ChevronLeft,
  GraduationCap,
  FileText,
  ExternalLink,
  Download,
  ArrowUpRight,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/bottom-nav";
import { ShareButton } from "@/components/share-button";

const PDF_INFO: Record<Campus, { filename: string; url: string; title: string; campusLabel: string }> = {
  hyderabad: {
    filename: "Term4_Endterm_Examdetails_Hyderabad.pdf",
    url: "/exams/Term_4_End_Term_Exam_Hyderabad_2026-27.pdf",
    title: "Hyderabad End-Term Exam Timetable",
    campusLabel: "Hyderabad Campus",
  },
  mohali: {
    filename: "Term 4_End_Term_Exam_Mohali_2026-27.pdf",
    url: "/exams/Term_4_End_Term_Exam_Mohali_2026-27.pdf",
    title: "Mohali End-Term Exam Timetable",
    campusLabel: "Mohali Campus",
  },
};

export default function ExamsPage() {
  const { studentId: loggedInId } = useLocalStudent();
  const { data: me } = useGetStudent(loggedInId || 0);

  // Strictly use logged-in student's campus (no option to view other campus)
  const campus: Campus = me?.campus || "hyderabad";
  const pdf = PDF_INFO[campus];

  const { data: examsData } = useGetExams(loggedInId, campus);
  const myExams = examsData?.myExams || [];
  const examCount = myExams.length;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto overflow-x-hidden overflow-y-auto bg-background px-4 sm:px-5 pb-32 pt-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            aria-label="Back to home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-5 w-5 text-primary shrink-0" />
              <h1 className="text-2xl font-display font-bold truncate">Exams</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Term 4 End-Term Timetable &bull; {pdf.campusLabel}
            </p>
          </div>
        </div>
        <ShareButton source="exams_header" />
      </header>

      {/* SECTION 1: YOUR EXAM SCHEDULE (Matching "You" card on Home) */}
      {me && (
        <section className="mb-6">
          <div className="mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Exam Schedule
            </p>
          </div>
          <Link
            href="/schedule?scrollTo=exam#first-exam-day"
            data-testid="link-user-exam-card"
            className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar
                  name={me.name}
                  className="h-14 w-14 ring-2 ring-primary/30"
                />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  📝
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {me.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary">
                      You
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] font-bold border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                  >
                    {examCount > 0 ? `${examCount} Exam${examCount > 1 ? "s" : ""}` : "End-Term"}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate text-foreground font-medium">
                    Open schedule &bull; Jump to first exam
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                  Sec {me.section} &bull; Oct 11 &ndash; Oct 13, 2026
                </p>
              </div>

              <ArrowUpRight className="h-4 w-4 shrink-0 text-primary/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </Link>
        </section>
      )}

      {/* SECTION 2: OFFICIAL END-TERM EXAM PDF */}
      <section className="mb-6 rounded-2xl border border-card-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Official Notification PDF
            </span>
            <h2 className="font-display font-bold text-base text-foreground truncate">
              {pdf.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {pdf.filename}
            </p>
          </div>
          <FileText className="h-6 w-6 text-primary shrink-0" />
        </div>

        {/* Action Buttons for PDF */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={pdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in New Tab</span>
          </a>

          <a
            href={pdf.url}
            download={pdf.filename}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-card-border bg-secondary/80 px-3 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </a>
        </div>
      </section>

      {/* SECTION 3: KEY EXAM GUIDELINES */}
      <section className="rounded-2xl border border-card-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-display font-bold text-sm text-foreground">
            Exam Day Rules & Guidelines
          </h2>
        </div>

        <ul className="space-y-2.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="rounded-full bg-red-500/15 p-0.5 text-red-600 dark:text-red-400 font-bold shrink-0 mt-0.5">
              ⚠️
            </span>
            <span>
              <strong className="text-foreground">Student ID Card Mandatory:</strong> You will not be allowed to take the exam without your physical Student ID card in the exam hall.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="rounded-full bg-amber-500/15 p-0.5 text-amber-600 dark:text-amber-400 font-bold shrink-0 mt-0.5">
              ⏱️
            </span>
            <span>
              <strong className="text-foreground">15-Minute Entry Cutoff:</strong> Students will not be allowed into the exam venue after 15 minutes from the commencement time.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="rounded-full bg-slate-500/15 p-0.5 text-slate-600 dark:text-slate-400 font-bold shrink-0 mt-0.5">
              📵
            </span>
            <span>
              <strong className="text-foreground">Electronic Gadgets Prohibited:</strong> Mobile phones, smart watches, smart glasses, or any electronic gadgets are strictly prohibited.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="rounded-full bg-blue-500/15 p-0.5 text-blue-600 dark:text-blue-400 font-bold shrink-0 mt-0.5">
              🚻
            </span>
            <span>
              <strong className="text-foreground">Bio-Break Policies:</strong> No bio-breaks during the first 30 minutes and last 30 minutes. No bio-breaks for exams of duration up to 1 hour.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="rounded-full bg-emerald-500/15 p-0.5 text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">
              📝
            </span>
            <span>
              <strong className="text-foreground">Cheat Sheets:</strong> Permitted cheat sheets must be submitted with the question paper before leaving the hall.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="rounded-full bg-primary/15 p-0.5 text-primary font-bold shrink-0 mt-0.5">
              ⚖️
            </span>
            <span>
              <strong className="text-foreground">ISB Honor Code:</strong> You are expected to strictly obey the ISB Honor Code throughout all examinations.
            </span>
          </li>
        </ul>
      </section>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
