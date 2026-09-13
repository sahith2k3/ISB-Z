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
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  ChevronDown,
  ChevronUp,
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
  type StudentEnrolledCourse,
} from "@/lib/api-client";
import { CAMPUS_SECTIONS, type SeatingChartInfo } from "@/lib/seating";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SeatingModal } from "@/components/seating-modal";
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

  // Browse all campus layouts (accordion / fallback)
  const [showAllSections, setShowAllSections] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<"hyderabad" | "mohali">("mohali");
  const [selectedSection, setSelectedSection] = useState<string>("G");

  // Active chart preview state
  const [activeChart, setActiveChart] = useState<SeatingChartInfo | null>(null);
  const [modalChart, setModalChart] = useState<{ courseCode: string; section: string; courseName?: string; url?: string } | null>(null);
  const [availableCharts, setAvailableCharts] = useState<SeatingChartInfo[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

  // Zoom & Pan state for inline preview
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

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
    fetch("/api/seating")
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

  // Reset zoom & image state when active chart changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setImgLoading(true);
    setImgError(false);
  }, [activeChart]);

  // Handler to select a student from search results
  const handleSelectStudent = (student: StudentSummary) => {
    setViewingStudentId(student.id);
    setSearchQuery("");
    setDebouncedSearch("");
    setIsSearchFocused(false);
    setActiveChart(null);
  };

  // Switch back to logged in user
  const handleResetToMyCourses = () => {
    if (me?.id) {
      setViewingStudentId(me.id);
      setActiveChart(null);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setScale((p) => Math.min(p + 0.3, 3.5));
  const handleZoomOut = () => setScale((p) => Math.max(p - 0.3, 0.8));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // When browsing all courses by section
  const sectionCourses = useMemo(() => {
    const courseMap = new Map<string, string>();
    for (const c of coursesData as Array<{ code: string; name: string }>) {
      courseMap.set(c.code, c.name);
    }

    const map = new Map<string, { courseCode: string; courseName: string }>();
    for (const s of sessionsData as Array<{ courseCode: string; section: string }>) {
      if (s.section.toUpperCase() === selectedSection.toUpperCase()) {
        if (!map.has(s.courseCode)) {
          map.set(s.courseCode, {
            courseCode: s.courseCode,
            courseName: courseMap.get(s.courseCode) || s.courseCode,
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
    setActiveChart(null);
  };

  const isViewingSelf = me?.id && viewingStudentId === me.id;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto overflow-x-hidden overflow-y-auto bg-background px-4 pb-32 pt-5">
      {/* Header */}
      <header className="mb-4 w-full min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 mb-1.5">
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
        <p className="text-xs text-muted-foreground leading-normal">
          Look up any student to view their exact classes and seating arrangements.
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
            placeholder="Search student name (e.g. Sahith, Aadarsh)..."
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

      {/* Active Student Banner / Status Card */}
      {viewingStudent ? (
        <div className="mb-5 rounded-2xl border border-card-border bg-card p-3.5 shadow-sm">
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

            {/* If viewing another student, show reset button */}
            {!isViewingSelf && me?.id && (
              <button
                type="button"
                onClick={handleResetToMyCourses}
                title="Return to your own courses"
                className="flex items-center gap-1 shrink-0 rounded-xl bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-secondary/80 border border-border/60 transition-all"
              >
                <RotateCcw className="h-3 w-3 text-primary" />
                <span>My Classes</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4 text-center">
          <Sparkles className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="font-semibold text-xs text-foreground">
            Search your name above
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Select any student to view their enrolled courses and classroom seating arrangements.
          </p>
        </div>
      )}

      {/* Active Chart Inline Preview (when a course is tapped) */}
      {activeChart && (
        <section className="mb-6 rounded-3xl border border-card-border bg-card p-3.5 sm:p-4 shadow-sm w-full min-w-0 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-border/70 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-base text-foreground leading-tight truncate">
                {activeChart.courseCode} · Section {activeChart.section}
              </h3>
              {activeChart.courseName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {activeChart.courseName}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setModalChart({
                    courseCode: activeChart.courseCode,
                    section: activeChart.section,
                    courseName: activeChart.courseName,
                    url: activeChart.url,
                  })
                }
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                title="Fullscreen modal"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                title="Reset zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveChart(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors ml-1"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            className="relative flex items-center justify-center min-h-[220px] max-h-[360px] overflow-hidden rounded-2xl bg-muted/40 border border-border/40 select-none cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imgLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/60 backdrop-blur-sm z-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs font-medium text-muted-foreground">Loading seating layout...</span>
              </div>
            )}

            {imgError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground z-10 max-w-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-2.5">
                  <Armchair className="h-6 w-6" />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  Seating Layout Pending
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The layout for {activeChart.courseCode} Section {activeChart.section} will be available soon.
                </p>
              </div>
            ) : (
              <div
                className="transition-transform duration-75 flex items-center justify-center p-2 w-full h-full"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                }}
              >
                <img
                  src={activeChart.url}
                  alt={`${activeChart.courseCode} Section ${activeChart.section}`}
                  onLoad={() => setImgLoading(false)}
                  onError={() => {
                    setImgLoading(false);
                    setImgError(true);
                  }}
                  className="max-h-64 sm:max-h-80 max-w-full object-contain rounded-lg shadow pointer-events-none"
                />
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground px-0.5">
            <span>Pinch / drag to zoom</span>
            <button
              type="button"
              onClick={() => setActiveChart(null)}
              className="font-semibold text-primary hover:underline"
            >
              Close preview
            </button>
          </div>
        </section>
      )}

      {/* Student Enrolled Courses Section */}
      {viewingStudent && (
        <section className="mb-6 w-full min-w-0">
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
                const isSelected =
                  activeChart?.courseCode.toUpperCase() === course.courseCode.toUpperCase() &&
                  activeChart?.section.toUpperCase() === course.section.toUpperCase();

                return (
                  <div
                    key={`${course.courseCode}-${course.section}`}
                    className={`flex items-center justify-between gap-3 rounded-2xl border bg-card p-3.5 transition-all ${
                      isSelected
                        ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20"
                        : "border-card-border hover:border-primary/40"
                    }`}
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
                      onClick={() => {
                        if (matchingChart) {
                          setActiveChart({
                            filename: matchingChart.filename,
                            url: matchingChart.url,
                            courseCode: course.courseCode,
                            courseName: course.courseName,
                            section: course.section,
                            campus: course.campus,
                          });
                        } else {
                          // Trigger modal with candidate resolution
                          setModalChart({
                            courseCode: course.courseCode,
                            section: course.section,
                            courseName: course.courseName,
                          });
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                        matchingChart
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:opacity-90"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/50"
                      }`}
                    >
                      <Armchair className="h-3.5 w-3.5" />
                      <span>{matchingChart ? "Seating" : "View"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Collapsible: Browse All Sections & Campus Layouts */}
      <section className="w-full min-w-0 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={() => setShowAllSections((prev) => !prev)}
          className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Browse All Campus Layouts</span>
          </span>
          {showAllSections ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showAllSections && (
          <div className="mt-3 space-y-4 animate-in fade-in duration-200">
            {/* Campus Switcher (Mohali first) */}
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

            {/* Section Selector Pills */}
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
                        onClick={() => {
                          setSelectedSection(sec);
                          setActiveChart(null);
                        }}
                        className={`flex h-8 shrink-0 whitespace-nowrap items-center justify-center rounded-xl px-3 text-xs font-bold transition-all ${
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

            {/* Section Course List */}
            <div className="space-y-2">
              {sectionCourses.map((course) => {
                const matchingChart = availableCharts.find(
                  (c) =>
                    c.courseCode.toUpperCase() === course.courseCode.toUpperCase() &&
                    (c.section.toUpperCase() === selectedSection.toUpperCase() || c.section === "All")
                );

                return (
                  <div
                    key={course.courseCode}
                    className="flex items-center justify-between gap-2.5 rounded-2xl border border-card-border bg-card p-3 transition-all hover:border-primary/40 w-full"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-sm text-foreground block">
                        {course.courseCode}
                      </span>
                      <p className="text-xs text-muted-foreground truncate">
                        {course.courseName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (matchingChart) {
                          setActiveChart(matchingChart);
                        } else {
                          setModalChart({
                            courseCode: course.courseCode,
                            section: selectedSection,
                            courseName: course.courseName,
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
                    >
                      <Armchair className="h-3 w-3" />
                      <span>{matchingChart ? "View" : "Open"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Fullscreen Seating Modal */}
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
