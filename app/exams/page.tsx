"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent, useGetExams } from "@/lib/api-client";
import { formatTime } from "@/lib/utils";
import type { Campus, ExamInfo, ClassSession } from "@/lib/types";
import {
  ChevronLeft,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  FileText,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/bottom-nav";
import { ShareButton } from "@/components/share-button";

const PDF_URLS: Record<Campus, { filename: string; url: string; title: string }> = {
  hyderabad: {
    filename: "Term4_Endterm_Examdetails_Hyderabad.pdf",
    url: "/exams/Term_4_End_Term_Exam_Hyderabad_2026-27.pdf",
    title: "Hyderabad Term 4 End-Term Exam Details",
  },
  mohali: {
    filename: "Term 4_End_Term_Exam_Mohali_2026-27.pdf",
    url: "/exams/Term_4_End_Term_Exam_Mohali_2026-27.pdf",
    title: "Mohali Term 4 End-Term Exam Details",
  },
};

function formatExamDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${dateStr}T00:00:00+05:30`));
  } catch {
    return dateStr;
  }
}

export default function ExamsPage() {
  const { studentId: loggedInId } = useLocalStudent();
  const { data: me } = useGetStudent(loggedInId || 0);

  const [selectedCampus, setSelectedCampus] = useState<Campus>("hyderabad");
  const [showEmbeddedPdf, setShowEmbeddedPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync selected campus with user's campus when loaded
  useEffect(() => {
    if (me?.campus) {
      setSelectedCampus(me.campus);
    }
  }, [me?.campus]);

  const { data: examsData, isLoading } = useGetExams(loggedInId, selectedCampus);

  const currentPdf = PDF_URLS[selectedCampus];

  const filteredExams = (examsData?.allExams || []).filter((ex: ExamInfo) => {
    if (ex.campus !== selectedCampus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ex.courseCode.toLowerCase().includes(q) ||
      ex.courseName.toLowerCase().includes(q) ||
      ex.typeOfExam.toLowerCase().includes(q)
    );
  });

  const myExams = examsData?.myExams || [];

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto overflow-x-hidden overflow-y-auto bg-background px-4 sm:px-5 pb-32 pt-6">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between gap-3">
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
              Term 4 End-Term Timetable & Guidelines
            </p>
          </div>
        </div>
        <ShareButton source="exams_header" />
      </header>

      {/* Campus Selector */}
      <div className="mb-5 flex rounded-2xl bg-secondary/80 p-1">
        <button
          type="button"
          onClick={() => setSelectedCampus("hyderabad")}
          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
            selectedCampus === "hyderabad"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Hyderabad Campus
        </button>
        <button
          type="button"
          onClick={() => setSelectedCampus("mohali")}
          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
            selectedCampus === "mohali"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Mohali Campus
        </button>
      </div>

      {/* SECTION 1: PERSONALIZED EXAM SCHEDULE */}
      {loggedInId && (
        <section className="mb-6 rounded-2xl border border-primary/25 bg-primary/[0.03] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display font-bold text-sm text-foreground">
                Your Exam Schedule
              </h2>
            </div>
            {me && (
              <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                {me.name.split(" ")[0]} ({me.section})
              </Badge>
            )}
          </div>

          {myExams.length > 0 ? (
            <div className="space-y-3">
              {myExams.map((session: ClassSession, idx: number) => (
                <div
                  key={`${session.courseCode}-${session.date}-${idx}`}
                  className="rounded-xl border border-card-border bg-card p-3.5 shadow-xs transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-primary">
                        {session.courseCode} · Section {session.section}
                      </span>
                      <h3 className="font-semibold text-sm leading-tight text-foreground">
                        {session.courseName}
                      </h3>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] font-bold border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
                      Exam
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {formatExamDate(session.date)}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {session.room || "Exam Hall"}
                    </span>
                  </div>

                  {session.examType && (
                    <div className="rounded-lg bg-secondary/50 p-2 text-xs border border-border/40">
                      <p className="font-semibold text-foreground text-[11px]">
                        📋 {session.examType}
                      </p>
                      {session.examComments && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {session.examComments}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-center text-xs text-muted-foreground">
              <p className="font-medium text-foreground">No end-term exams for your enrolled courses</p>
              <p className="mt-1">
                Your courses may use project evaluations or assignments instead of sit-in exams.
              </p>
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: OFFICIAL END-TERM EXAM PDF VIEWER & DOWNLOAD */}
      <section className="mb-6 rounded-2xl border border-card-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Official Notification PDF
            </span>
            <h2 className="font-display font-bold text-base text-foreground truncate">
              {currentPdf.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {currentPdf.filename}
            </p>
          </div>
          <FileText className="h-6 w-6 text-primary shrink-0" />
        </div>

        {/* Action Buttons for PDF */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <a
            href={currentPdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open PDF in Tab</span>
          </a>

          <a
            href={currentPdf.url}
            download={currentPdf.filename}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-card-border bg-secondary/80 px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-secondary active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </a>
        </div>

        {/* Toggle Embedded PDF Preview */}
        <button
          type="button"
          onClick={() => setShowEmbeddedPdf(!showEmbeddedPdf)}
          className="w-full text-center py-1.5 text-xs font-semibold text-primary hover:underline transition-all"
        >
          {showEmbeddedPdf ? "▲ Hide Embedded PDF Viewer" : "▼ Preview PDF inside app"}
        </button>

        {showEmbeddedPdf && (
          <div className="mt-3 rounded-xl border border-card-border overflow-hidden bg-muted/20">
            <iframe
              src={currentPdf.url}
              title={currentPdf.title}
              className="w-full h-[460px] border-none"
            />
          </div>
        )}
      </section>

      {/* SECTION 3: COMPLETE TIMETABLE FOR SELECTED CAMPUS */}
      <section className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-display font-bold text-base text-foreground capitalize">
              {selectedCampus} Exam Schedule
            </h2>
            <p className="text-xs text-muted-foreground">
              Oct 11 – Oct 13, 2026 timetable
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {filteredExams.length} Courses
          </span>
        </div>

        {/* Course Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${selectedCampus} exams...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-card border-card-border rounded-xl text-sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-card-border bg-card p-4 space-y-2"
              >
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-card-border bg-card p-6 text-center text-xs text-muted-foreground">
            No exams found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExams.map((exam: ExamInfo) => (
              <div
                key={`${exam.courseCode}-${exam.date}`}
                className="rounded-2xl border border-card-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">
                        {exam.courseCode}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Sec {exam.sections.join(", ")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight text-foreground mt-0.5">
                      {exam.courseName}
                    </h3>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px] font-semibold border-border">
                    {exam.duration}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {exam.displayDate}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {exam.room}
                  </span>
                </div>

                {/* Exam Format & Rules */}
                <div className="rounded-xl bg-secondary/50 p-2.5 border border-border/50 text-xs space-y-1.5">
                  <div className="flex items-start gap-1.5">
                    <span className="font-semibold text-foreground shrink-0">Type:</span>
                    <span className="text-foreground">{exam.typeOfExam}</span>
                  </div>

                  {exam.allowedItems && exam.allowedItems.length > 0 && (
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        Allowed:
                      </span>
                      <span className="text-muted-foreground">
                        {exam.allowedItems.join(" · ")}
                      </span>
                    </div>
                  )}

                  {exam.prohibitedItems && exam.prohibitedItems.length > 0 && (
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                        Not Allowed:
                      </span>
                      <span className="text-muted-foreground">
                        {exam.prohibitedItems.join(" · ")}
                      </span>
                    </div>
                  )}

                  {exam.comments && (
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      ℹ️ {exam.comments}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4: MANDATORY EXAM GUIDELINES */}
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
