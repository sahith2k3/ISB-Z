"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Armchair,
  MapPin,
  Search,
  X,
  UserRound,
  RotateCcw,
  Layers,
  Check,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useLocalStudent } from "@/hooks/use-local-student";
import {
  useGetStudent,
  useListStudents,
  useGetStudentCourses,
  type StudentSummary,
} from "@/lib/api-client";
import { CAMPUS_SECTIONS, type SeatingChartInfo } from "@/lib/seating";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SeatingModal } from "@/components/seating-modal";
import { ShareButton } from "@/components/share-button";
import sessionsData from "@/data/sessions.json";
import coursesData from "@/data/courses.json";

export default function SeatingPage() {
  const { studentId: loggedInId } = useLocalStudent();
  const { data: me } = useGetStudent(loggedInId || 0);

  // Active student whose courses we are viewing (defaults to logged-in student)
  const [viewingStudentId, setViewingStudentId] = useState<number | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Campus & Section selection for browsing
  const [selectedCampus, setSelectedCampus] = useState<"hyderabad" | "mohali">("mohali");
  const [selectedSection, setSelectedSection] = useState<string>("G");
  const [showSectionBrowser, setShowSectionBrowser] = useState(false);

  // Modal window for viewing seating arrangement (same window as everywhere else)
  const [modalChart, setModalChart] = useState<{
    courseCode: string;
    section: string;
    courseName?: string;
    url?: string;
  } | null>(null);

  const [availableCharts, setAvailableCharts] = useState<SeatingChartInfo[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

  // Automatically initialize viewing student to logged-in user
  useEffect(() => {
    if (me?.id && !viewingStudentId) {
      setViewingStudentId(me.id);
    }
  }, [me?.id, viewingStudentId]);

  // Debounce search query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to dismiss search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search students query
  const { data: searchResults, isLoading: isSearching } = useListStudents(
    { search: debouncedSearch, limit: 8 },
    {
      query: {
        enabled: debouncedSearch.length >= 1,
        queryKey: ["seatingStudentSearch", debouncedSearch],
      },
    }
  );

  // Load enrolled courses for the viewing student
  const { data: studentData, isLoading: isLoadingStudentCourses } = useGetStudentCourses(viewingStudentId);
  const viewingStudent = studentData?.student || (viewingStudentId === me?.id ? me : null);
  const enrolledCourses = studentData?.courses || [];

  // Load available seating charts from API
  useEffect(() => {
    setIsLoadingCharts(true);
    fetch("/api/seating", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.charts)) {
          setAvailableCharts(data.charts);
        }
      })
      .catch((err) => {
        console.warn("Could not load seating charts:", err);
      })
      .finally(() => {
        setIsLoadingCharts(false);
      });
  }, []);

  // Handler to select a student from search results
  const handleSelectStudent = (student: StudentSummary) => {
    setViewingStudentId(student.id);
    setSearchQuery("");
    setDebouncedSearch("");
    setIsSearchFocused(false);
    setShowSectionBrowser(false);
  };

  // Switch back to logged in user
  const handleResetToMyCourses = () => {
    if (me?.id) {
      setViewingStudentId(me.id);
      setShowSectionBrowser(false);
    }
  };

  // Open modal window for a course seating chart
  const handleOpenSeating = (courseCode: string, section: string, courseName?: string, url?: string) => {
    setModalChart({
      courseCode,
      section,
      courseName,
      url,
    });
  };

  // Courses in current section for browse view
  const sectionCourses = useMemo(() => {
    const courseMap = new Map<string, string>();
    for (const c of coursesData as Array<{ code: string; name: string }>) {
      courseMap.set(c.code, c.name);
    }

    const map = new Map<string, { courseCode: string; courseName: string; venue?: string }>();
    for (const s of sessionsData as Array<{ courseCode: string; section: string; room?: string }>) {
      if (s.section.toUpperCase() === selectedSection.toUpperCase()) {
        if (!map.has(s.courseCode)) {
          map.set(s.courseCode, {
            courseCode: s.courseCode,
            courseName: courseMap.get(s.courseCode) || s.courseCode,
            venue: s.room || undefined,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  }, [selectedSection]);

  const handleCampusChange = (campus: "hyderabad" | "mohali") => {
    setSelectedCampus(campus);
    const validSections = CAMPUS_SECTIONS[campus];
    if (!validSections.includes(selectedSection)) {
      setSelectedSection(validSections[0]);
    }
  };

  const isViewingSelf = me?.id && viewingStudentId === me.id;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto overflow-x-hidden overflow-y-auto bg-background px-4 pb-32 pt-5">
      {/* Header */}
      <header className="mb-4 w-full min-w-0">
        <div className="flex items-center justify-between gap-2.5 min-w-0 mb-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Armchair className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 truncate">
                Classroom Layouts
              </p>
              <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
                Seating Charts
              </h1>
            </div>
          </div>
          <ShareButton source="seating_header" />
        </div>
        <p className="text-xs text-muted-foreground leading-normal">
          Search any student or browse classes below to open high-resolution seating layouts.
        </p>
      </header>

      {/* Student Name Search Bar */}
      <div ref={searchContainerRef} className="relative mb-4 w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search student name..."
            className="h-11 w-full rounded-2xl border border-input bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setDebouncedSearch("");
              }}
              className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && debouncedSearch.length >= 1 && (
          <div className="absolute top-12 left-0 right-0 z-30 max-h-72 overflow-y-auto rounded-2xl border border-border bg-card shadow-xl p-1.5 space-y-1 backdrop-blur-md">
            {isSearching ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                Searching students...
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelectStudent(student)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-secondary/70"
                >
                  <Avatar name={student.name} className="h-8 w-8 text-xs shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {student.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Section {student.section} · {student.campus === "mohali" ? "Mohali" : "Hyderabad"}
                    </p>
                  </div>
                  {viewingStudentId === student.id && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      Active
                    </Badge>
                  )}
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No students found for &quot;{debouncedSearch}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Case 1: Student is Selected or User is Logged In */}
      {viewingStudent && !showSectionBrowser ? (
        <div className="space-y-4">
          {/* Active Student Info Banner */}
          <div className="rounded-2xl border border-card-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={viewingStudent.name} className="h-10 w-10 text-sm shrink-0 ring-2 ring-primary/20" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display font-bold text-sm text-foreground truncate">
                      {viewingStudent.name}
                    </h2>
                    {isViewingSelf && (
                      <Badge className="bg-primary/15 text-primary text-[10px] px-1.5 py-0 h-4 border-none">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Section {viewingStudent.section} · {viewingStudent.campus === "mohali" ? "Mohali Campus" : "Hyderabad Campus"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isViewingSelf && me?.id ? (
                  <button
                    type="button"
                    onClick={handleResetToMyCourses}
                    title="Return to your own courses"
                    className="flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-secondary/80 border border-border/60 transition-all"
                  >
                    <RotateCcw className="h-3 w-3 text-primary" />
                    <span>My Classes</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSectionBrowser(true)}
                    className="flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-border/60 transition-all"
                  >
                    <Layers className="h-3 w-3 text-primary" />
                    <span>All Sections</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Enrolled Courses List */}
          <section className="w-full min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{isViewingSelf ? "My Courses & Seatings" : `${viewingStudent.name}'s Courses`}</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                {enrolledCourses.length} courses
              </span>
            </div>

            {isLoadingStudentCourses ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading enrolled courses...
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-muted-foreground text-xs">
                No courses registered for Term 4.
              </div>
            ) : (
              <div className="space-y-2.5 w-full">
                {enrolledCourses.map((course) => {
                  const matchingChart = availableCharts.find(
                    (c) =>
                      c.courseCode.toUpperCase() === course.courseCode.toUpperCase() &&
                      (c.section.toUpperCase() === course.section.toUpperCase() || c.section === "All")
                  );

                  return (
                    <div
                      key={`${course.courseCode}-${course.section}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-card p-3.5 transition-all hover:border-primary/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-bold text-base text-foreground">
                            {course.courseCode}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md"
                          >
                            Sec {course.section}
                          </Badge>
                          {matchingChart && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" /> Ready
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate leading-tight">
                          {course.courseName}
                        </p>
                        {course.venue && (
                          <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{course.venue}</span>
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenSeating(
                            course.courseCode,
                            course.section,
                            course.courseName,
                            matchingChart?.url
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                          matchingChart
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:opacity-90"
                            : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/50"
                        }`}
                      >
                        <Armchair className="h-3.5 w-3.5" />
                        <span>Seating</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Case 2: Non Sign-in First Time User (or Section Browse Mode) */
        <div className="space-y-4">
          {/* Top helper banner for non sign in users */}
          {!viewingStudent && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground">
                    Direct Classroom Layouts
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Search your name above to see your personal class seating, or pick any section below. Tapping <strong>Seating</strong> opens the layout window instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* If switched to browse mode from a viewing student */}
          {viewingStudent && showSectionBrowser && (
            <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-card-border">
              <span className="text-xs text-muted-foreground">
                Browsing all campus sections
              </span>
              <button
                type="button"
                onClick={() => setShowSectionBrowser(false)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Back to {isViewingSelf ? "My Classes" : `${viewingStudent.name}'s Classes`}
              </button>
            </div>
          )}

          {/* Campus Switcher (Mohali first, auto-selected) */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary p-1 border border-border w-full">
            <button
              type="button"
              onClick={() => handleCampusChange("mohali")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                selectedCampus === "mohali"
                  ? "bg-card text-foreground shadow-sm border border-card-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Mohali</span>
            </button>
            <button
              type="button"
              onClick={() => handleCampusChange("hyderabad")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                selectedCampus === "hyderabad"
                  ? "bg-card text-foreground shadow-sm border border-card-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Hyderabad</span>
            </button>
          </div>

          {/* Section Selector Pills (Mohali Sec G-L first) */}
          <div className="w-full min-w-0">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <p className="text-[11px] font-semibold text-muted-foreground">
                Select Section
              </p>
              <span className="text-[11px] text-muted-foreground">
                {selectedCampus === "mohali" ? "Sec G – L" : "Sec A – F"}
              </span>
            </div>
            <div className="w-full min-w-0 overflow-hidden">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
                {CAMPUS_SECTIONS[selectedCampus].map((sec) => {
                  const isSelected = selectedSection === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec)}
                      className={`flex h-9 shrink-0 whitespace-nowrap items-center justify-center rounded-xl px-3.5 text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                          : "bg-card border border-card-border text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      Section {sec}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section Courses List */}
          <section className="w-full min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>Courses in Section {selectedSection}</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                {sectionCourses.length} courses
              </span>
            </div>

            <div className="space-y-2.5 w-full">
              {sectionCourses.map((course) => {
                const matchingChart = availableCharts.find(
                  (c) =>
                    c.courseCode.toUpperCase() === course.courseCode.toUpperCase() &&
                    (c.section.toUpperCase() === selectedSection.toUpperCase() || c.section === "All")
                );

                return (
                  <div
                    key={course.courseCode}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-card p-3.5 transition-all hover:border-primary/40 w-full"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-base text-foreground">
                          {course.courseCode}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md"
                        >
                          Sec {selectedSection}
                        </Badge>
                        {matchingChart && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> Ready
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {course.courseName}
                      </p>
                      {course.venue && (
                        <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{course.venue}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenSeating(
                          course.courseCode,
                          selectedSection,
                          course.courseName,
                          matchingChart?.url
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                        matchingChart
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:opacity-90"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/50"
                      }`}
                    >
                      <Armchair className="h-3.5 w-3.5" />
                      <span>Seating</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Fullscreen Popup Modal Window (Identical window across all pages) */}
      {modalChart && (
        <SeatingModal
          isOpen={true}
          onClose={() => setModalChart(null)}
          courseCode={modalChart.courseCode}
          section={modalChart.section}
          courseName={modalChart.courseName}
          initialImageUrl={modalChart.url}
        />
      )}

      <BottomNav />
    </div>
  );
}
