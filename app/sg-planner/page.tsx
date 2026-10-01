"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  ChevronLeft,
  Search,
  Mail,
  Copy,
  Check,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStudent } from "@/hooks/use-local-student";
import {
  useGetStudent,
  useGetSgPlannerSummary,
  useGetSgSectionRoster,
  useUpdateSgStatus,
  type SGStatus,
  type SgEnrolledCourse,
  type SgCourseSummary,
} from "@/lib/api-client";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/bottom-nav";
import { ShareButton } from "@/components/share-button";
import type { Campus } from "@/lib/types";

const STATUS_CONFIG: Record<
  SGStatus,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeClass: string;
    dotClass: string;
    icon: typeof CheckCircle2;
  }
> = {
  available: {
    label: "Available for SG",
    shortLabel: "Available",
    description: "Looking for a study group",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    dotClass: "bg-emerald-500",
    icon: CheckCircle2,
  },
  unknown: {
    label: "Not decided yet",
    shortLabel: "Not set",
    description: "Hasn't selected a preference",
    badgeClass: "bg-secondary text-muted-foreground border-border",
    dotClass: "bg-muted-foreground/40",
    icon: HelpCircle,
  },
  dropping: {
    label: "Likely dropping course",
    shortLabel: "Likely dropping",
    description: "Most likely gonna drop this course",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    dotClass: "bg-amber-500",
    icon: AlertCircle,
  },
  unavailable: {
    label: "SG formed / Unavailable",
    shortLabel: "SG formed",
    description: "Already in a group or not looking",
    badgeClass: "bg-muted/80 text-muted-foreground border-border/50",
    dotClass: "bg-muted-foreground/60",
    icon: XCircle,
  },
};

export default function SgPlannerPage() {
  const { studentId: loggedInId } = useLocalStudent();
  const { data: me } = useGetStudent(loggedInId || 0);

  // Active view: selected section to view roster, or null to view course lists
  const [selectedSection, setSelectedSection] = useState<{
    courseName: string;
    section: string;
    campus?: string;
  } | null>(null);

  // Tabs: 'my' (My Classes) or 'all' (Browse All)
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [selectedCampus, setSelectedCampus] = useState<Campus | "all">("all");
  const [courseSearch, setCourseSearch] = useState("");
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterFilter, setRosterFilter] = useState<SGStatus | "all">("all");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Data fetching
  const {
    data: plannerData,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = useGetSgPlannerSummary(
    loggedInId,
    selectedCampus === "all" ? undefined : selectedCampus
  );

  const {
    data: rosterData,
    isLoading: isLoadingRoster,
  } = useGetSgSectionRoster(
    selectedSection?.courseName || null,
    selectedSection?.section || null
  );

  const updateStatusMutation = useUpdateSgStatus();

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleUpdateStatus = (
    courseName: string,
    section: string,
    campus: string,
    status: SGStatus
  ) => {
    if (!loggedInId) return;
    updateStatusMutation.mutate({
      studentId: loggedInId,
      courseName,
      section,
      campus,
      status,
    });
  };

  // Filtered courses for "All Classes" tab
  const filteredAllCourses = useMemo(() => {
    if (!plannerData?.allCourses) return [];
    let list = plannerData.allCourses;

    if (selectedCampus !== "all") {
      list = list.filter((c) => c.campus.toLowerCase() === selectedCampus.toLowerCase());
    }

    if (courseSearch.trim()) {
      const q = courseSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.courseName.toLowerCase().includes(q) ||
          c.section.toLowerCase().includes(q)
      );
    }

    return list;
  }, [plannerData?.allCourses, selectedCampus, courseSearch]);

  // Filtered and sorted students for the Section Roster view
  const filteredRosterStudents = useMemo(() => {
    if (!rosterData?.students) return [];
    let list = rosterData.students;

    if (rosterFilter !== "all") {
      list = list.filter((s) => s.status === rosterFilter);
    }

    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [rosterData?.students, rosterFilter, rosterSearch]);

  // Find if logged-in user is enrolled in currently open section
  const isUserInCurrentSection = useMemo(() => {
    if (!loggedInId || !selectedSection || !plannerData?.myEnrolledCourses) return false;
    return plannerData.myEnrolledCourses.some(
      (c) =>
        c.courseName.toLowerCase().trim() === selectedSection.courseName.toLowerCase().trim() &&
        c.section.toLowerCase().trim() === selectedSection.section.toLowerCase().trim()
    );
  }, [loggedInId, selectedSection, plannerData?.myEnrolledCourses]);

  // Get logged-in user's status in currently open section
  const userCurrentStatusInSection = useMemo<SGStatus>(() => {
    if (!isUserInCurrentSection || !loggedInId || !rosterData?.students) return "unknown";
    const found = rosterData.students.find((s) => s.id === loggedInId);
    return found?.status || "unknown";
  }, [isUserInCurrentSection, loggedInId, rosterData?.students]);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto overflow-x-hidden overflow-y-auto bg-background px-4 sm:px-5 pb-32 pt-6">
      {/* SECTION ROSTER DRILLDOWN VIEW */}
      {selectedSection ? (
        <div className="w-full min-w-0">
          {/* Header with back button */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedSection(null);
                setRosterSearch("");
                setRosterFilter("all");
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
              aria-label="Back to course list"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Class Roster
              </span>
              <h2 className="text-xl font-display font-bold leading-tight truncate">
                {selectedSection.courseName}
              </h2>
            </div>
            <ShareButton source="sg_planner_section" />
          </div>

          {/* Section Info Card */}
          <div className="mb-5 rounded-2xl border border-card-border bg-card p-4 shadow-sm w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="font-semibold text-xs border-primary/30 text-primary shrink-0">
                  Section {selectedSection.section}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground capitalize truncate">
                  {rosterData?.campus || selectedSection.campus || ""} Campus
                </span>
              </div>
              <span className="text-xs font-semibold text-foreground shrink-0">
                {rosterData?.counts.total ?? "..."} Students
              </span>
            </div>

            {/* If logged-in user is in this section: Interactive SG Status Card */}
            {isUserInCurrentSection && (
              <div className="mt-4 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-foreground truncate">
                    Your SG Status for this class:
                  </span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] font-semibold border ${STATUS_CONFIG[userCurrentStatusInSection].badgeClass}`}
                  >
                    {STATUS_CONFIG[userCurrentStatusInSection].shortLabel}
                  </Badge>
                </div>

                {userCurrentStatusInSection === "unknown" && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Choose an option to let classmates know if you are open to teaming up:
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedSection.courseName,
                        selectedSection.section,
                        selectedSection.campus || "hyderabad",
                        "available"
                      )
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all text-xs font-medium ${
                      userCurrentStatusInSection === "available"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm"
                        : "border-card-border bg-secondary/50 text-muted-foreground hover:border-emerald-500/40 hover:text-foreground"
                    }`}
                  >
                    <CheckCircle2 className={`h-4 w-4 mb-1 shrink-0 ${userCurrentStatusInSection === "available" ? "text-emerald-500" : "text-muted-foreground"}`} />
                    <span className="text-[11px] truncate w-full text-center">Available</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedSection.courseName,
                        selectedSection.section,
                        selectedSection.campus || "hyderabad",
                        "dropping"
                      )
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all text-xs font-medium ${
                      userCurrentStatusInSection === "dropping"
                        ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold shadow-sm"
                        : "border-card-border bg-secondary/50 text-muted-foreground hover:border-amber-500/40 hover:text-foreground"
                    }`}
                  >
                    <AlertCircle className={`h-4 w-4 mb-1 shrink-0 ${userCurrentStatusInSection === "dropping" ? "text-amber-500" : "text-muted-foreground"}`} />
                    <span className="text-[11px] truncate w-full text-center">Drop class?</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedSection.courseName,
                        selectedSection.section,
                        selectedSection.campus || "hyderabad",
                        "unavailable"
                      )
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all text-xs font-medium ${
                      userCurrentStatusInSection === "unavailable"
                        ? "border-slate-500 bg-slate-500/15 text-slate-700 dark:text-slate-300 font-semibold shadow-sm"
                        : "border-card-border bg-secondary/50 text-muted-foreground hover:border-slate-500/40 hover:text-foreground"
                    }`}
                  >
                    <XCircle className={`h-4 w-4 mb-1 shrink-0 ${userCurrentStatusInSection === "unavailable" ? "text-slate-500" : "text-muted-foreground"}`} />
                    <span className="text-[11px] truncate w-full text-center">SG formed</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Roster Filter Pills */}
          {rosterData && (
            <div className="mb-4 w-full min-w-0 overflow-x-auto pb-1 pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setRosterFilter("all")}
                className={`shrink-0 rounded-full px-3 py-1 font-semibold transition-all ${
                  rosterFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "border border-card-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({rosterData.counts.total})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter("available")}
                className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition-all ${
                  rosterFilter === "available"
                    ? "bg-emerald-600 text-white"
                    : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available ({rosterData.counts.available})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter("unknown")}
                className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-all ${
                  rosterFilter === "unknown"
                    ? "bg-foreground text-background"
                    : "border border-card-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                Not set ({rosterData.counts.unknown})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter("dropping")}
                className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition-all ${
                  rosterFilter === "dropping"
                    ? "bg-amber-600 text-white"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Dropping ({rosterData.counts.dropping})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter("unavailable")}
                className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-all ${
                  rosterFilter === "unavailable"
                    ? "bg-slate-700 text-white"
                    : "border border-card-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Formed ({rosterData.counts.unavailable})
              </button>
            </div>
          )}

          {/* Roster Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search classmates in this section..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="pl-9 h-11 bg-card border-card-border rounded-xl text-sm"
            />
          </div>

          {/* Student List (Sorted: available -> unknown -> mostly gonna drop -> unavailable) */}
          {isLoadingRoster ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-3 rounded-2xl border border-card-border bg-card p-3.5"
                >
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-2/5" />
                    <div className="h-3 bg-muted rounded w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRosterStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-card-border bg-card p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No students match your filter.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRosterStudents.map((student) => {
                const config = STATUS_CONFIG[student.status];
                const isMe = student.id === loggedInId;

                return (
                  <div
                    key={student.id}
                    className={`w-full overflow-hidden flex items-center justify-between gap-2.5 rounded-2xl border p-3 transition-all ${
                      isMe
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-card-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <Avatar name={student.name} className="h-10 w-10 text-xs shrink-0" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${config.dotClass}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {student.name}
                          </h4>
                          {isMe && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary shrink-0">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold border px-2 py-0.5 whitespace-nowrap ${config.badgeClass}`}
                      >
                        {config.shortLabel}
                      </Badge>

                      {student.email && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(student.email)}
                            title="Copy email"
                            aria-label={`Copy email of ${student.name}`}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                          >
                            {copiedEmail === student.email ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <a
                            href={`mailto:${student.email}?subject=ISB%20Study%20Group%20-%20${encodeURIComponent(selectedSection.courseName)}`}
                            title="Send email"
                            aria-label={`Send email to ${student.name}`}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
                          >
                            <Mail className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* MAIN LIST VIEW (My Classes & All Classes) */
        <div>
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
                  <Users className="h-5 w-5 text-primary" />
                  <h1 className="text-2xl font-display font-bold truncate">SG Planner</h1>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Find Term 5 study group members
                </p>
              </div>
            </div>
            <ShareButton source="sg_planner_header" />
          </header>

          {/* Tab Switcher: My Classes vs All Classes */}
          <div className="mb-5 flex rounded-2xl bg-secondary/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                activeTab === "my"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>My Classes</span>
              {plannerData?.myEnrolledCourses && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary font-bold">
                  {plannerData.myEnrolledCourses.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                activeTab === "all"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>All Classes</span>
              {plannerData?.allCourses && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground font-semibold">
                  {plannerData.allCourses.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: MY CLASSES */}
          {activeTab === "my" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-foreground">
                    Your Term 5 Classes
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select your SG availability to share with classmates
                  </p>
                </div>
              </div>

              {isLoadingSummary ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-card-border bg-card p-4 space-y-3"
                    >
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-9 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : !plannerData?.myEnrolledCourses || plannerData.myEnrolledCourses.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-card-border bg-card p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-base font-bold">No enrolled classes found</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                    We couldn&apos;t find your Term 5 elective enrollments yet. You can browse all classes to view rosters.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <span>Browse All Classes</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                plannerData.myEnrolledCourses.map((c) => {
                  const statusConfig = STATUS_CONFIG[c.myStatus];

                  return (
                    <div
                      key={`${c.courseName}-${c.section}`}
                      className="w-full overflow-hidden rounded-2xl border border-card-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-foreground text-sm leading-tight">
                            {c.courseName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary shrink-0">
                              Sec {c.section}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground capitalize truncate">
                              {c.campus} • {c.studentCount} students
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] font-semibold border ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.shortLabel}
                        </Badge>
                      </div>

                      {/* SG Status Quick-Selector */}
                      <div className="mt-3 pt-3 border-t border-border/50">
                        {c.myStatus === "unknown" ? (
                          <div className="mb-2 rounded-xl bg-primary/10 border border-primary/20 p-2.5">
                            <p className="text-[11px] font-medium text-foreground">
                              👋 Choose your SG status so classmates can reach out:
                            </p>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(c.courseName, c.section, c.campus, "available")
                            }
                            className={`rounded-xl border py-2 px-1 text-center transition-all text-[11px] font-medium ${
                              c.myStatus === "available"
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm"
                                : "border-card-border bg-secondary/50 text-muted-foreground hover:border-emerald-500/40 hover:text-foreground"
                            }`}
                          >
                            <span className="truncate block">🟢 Available</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(c.courseName, c.section, c.campus, "dropping")
                            }
                            className={`rounded-xl border py-2 px-1 text-center transition-all text-[11px] font-medium ${
                              c.myStatus === "dropping"
                                ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold shadow-sm"
                                : "border-card-border bg-secondary/50 text-muted-foreground hover:border-amber-500/40 hover:text-foreground"
                            }`}
                          >
                            <span className="truncate block">🟠 Drop class?</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(c.courseName, c.section, c.campus, "unavailable")
                            }
                            className={`rounded-xl border py-2 px-1 text-center transition-all text-[11px] font-medium ${
                              c.myStatus === "unavailable"
                                ? "border-slate-500 bg-slate-500/15 text-slate-700 dark:text-slate-300 font-semibold shadow-sm"
                                : "border-card-border bg-secondary/50 text-muted-foreground hover:border-slate-500/40 hover:text-foreground"
                            }`}
                          >
                            <span className="truncate block">⚪ Formed</span>
                          </button>
                        </div>
                      </div>

                      {/* View Class Roster Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSection({
                            courseName: c.courseName,
                            section: c.section,
                            campus: c.campus,
                          });
                        }}
                        className="mt-3 w-full flex items-center justify-between rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
                      >
                        <span>View Class Roster & SG Statuses</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: ALL CLASSES */}
          {activeTab === "all" && (
            <div className="space-y-4">
              {/* Campus Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCampus("all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedCampus === "all"
                      ? "bg-primary text-primary-foreground"
                      : "border border-card-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Campuses
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCampus("hyderabad")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedCampus === "hyderabad"
                      ? "bg-primary text-primary-foreground"
                      : "border border-card-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Hyderabad
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCampus("mohali")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedCampus === "mohali"
                      ? "bg-primary text-primary-foreground"
                      : "border border-card-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mohali
                </button>
              </div>

              {/* Course Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search courses or section..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="pl-9 h-11 bg-card border-card-border rounded-xl text-sm"
                />
              </div>

              {/* Courses List */}
              {isLoadingSummary ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-card-border bg-card p-4 space-y-2"
                    >
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/4" />
                    </div>
                  ))}
                </div>
              ) : filteredAllCourses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-card-border bg-card p-8 text-center text-muted-foreground">
                  <p className="text-sm font-medium">No courses found matching &quot;{courseSearch}&quot;.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAllCourses.map((c) => (
                    <button
                      key={`${c.courseName}-${c.section}`}
                      type="button"
                      onClick={() =>
                        setSelectedSection({
                          courseName: c.courseName,
                          section: c.section,
                          campus: c.campus,
                        })
                      }
                      className="w-full overflow-hidden text-left rounded-2xl border border-card-border bg-card p-4 transition-all hover:border-primary/45 hover:shadow-sm active:scale-[0.99] flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground text-sm leading-tight truncate group-hover:text-primary transition-colors">
                          {c.courseName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                            Sec {c.section}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground capitalize">
                            {c.campus} • {c.studentCount} students
                          </span>
                          {c.statusCounts?.available > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {c.statusCounts.available} looking for SG
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
