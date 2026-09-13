"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Armchair,
  Search,
  MapPin,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Info,
  Layers,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent } from "@/lib/api-client";
import { CAMPUS_SECTIONS, type SeatingChartInfo } from "@/lib/seating";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import sessionsData from "@/data/sessions.json";
import coursesData from "@/data/courses.json";

export default function SeatingPage() {
  const { studentId, campus: localCampus } = useLocalStudent();
  const { data: me } = useGetStudent(studentId || 0);

  // Default campus: from logged in user, or "hyderabad"
  const [selectedCampus, setSelectedCampus] = useState<"hyderabad" | "mohali">("hyderabad");
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChart, setActiveChart] = useState<SeatingChartInfo | null>(null);
  const [availableCharts, setAvailableCharts] = useState<SeatingChartInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Zoom and pan state for the selected seating chart
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Sync user's campus and section if logged in
  useEffect(() => {
    if (me) {
      if (me.campus === "hyderabad" || me.campus === "mohali") {
        setSelectedCampus(me.campus);
      }
      if (me.section) {
        setSelectedSection(me.section.toUpperCase());
      }
    } else if (localCampus) {
      setSelectedCampus(localCampus);
      setSelectedSection(localCampus === "hyderabad" ? "A" : "G");
    }
  }, [me, localCampus]);

  // Fetch available seating charts from /api/seating
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/seating")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.charts)) {
          setAvailableCharts(data.charts);
        }
      })
      .catch((err) => {
        console.warn("Could not load seating charts list:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // When selected campus changes, ensure section belongs to that campus
  const handleCampusChange = (campus: "hyderabad" | "mohali") => {
    setSelectedCampus(campus);
    const validSections = CAMPUS_SECTIONS[campus];
    if (!validSections.includes(selectedSection)) {
      setSelectedSection(validSections[0]);
    }
    setActiveChart(null);
  };

  // Build full list of courses for the selected section from sessionsData & coursesData
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

  // Filter available charts for current section
  const filteredCharts = useMemo(() => {
    return availableCharts.filter((c) => {
      const matchSection =
        c.section.toUpperCase() === selectedSection.toUpperCase() || c.section === "All";
      const matchSearch =
        !searchQuery ||
        c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.courseName && c.courseName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSection && matchSearch;
    });
  }, [availableCharts, selectedSection, searchQuery]);

  // Reset zoom on active chart change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [activeChart]);

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

  return (
    <div className="min-h-[100dvh] max-w-md mx-auto overflow-y-auto bg-background px-5 pb-32 pt-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Armchair className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
                Classroom layouts
              </p>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Seating Charts
              </h1>
            </div>
          </div>

          {!studentId && (
            <Link
              href="/"
              className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              Sign up
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Find your seat for upcoming classes across Hyderabad and Mohali.
        </p>
      </header>

      {/* Campus Switcher */}
      <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary p-1 border border-border">
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
      </div>

      {/* Section Selector Pills */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-muted-foreground mb-2 px-1">
          Select Section
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CAMPUS_SECTIONS[selectedCampus].map((sec) => {
            const isSelected = selectedSection === sec;
            const isUserSection = me?.section?.toUpperCase() === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setSelectedSection(sec);
                  setActiveChart(null);
                }}
                className={`relative flex h-10 min-w-12 items-center justify-center rounded-2xl px-3 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "bg-card border border-card-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                }`}
              >
                Section {sec}
                {isUserSection && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Chart Viewer (if selected) */}
      {activeChart ? (
        <section className="mb-6 rounded-3xl border border-card-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-border/70">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base text-foreground leading-tight truncate">
                {activeChart.courseCode} · Section {activeChart.section}
              </h3>
              {activeChart.courseName && (
                <p className="text-xs text-muted-foreground truncate">{activeChart.courseName}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 text-xs font-semibold text-muted-foreground"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <a
                href={activeChart.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Full screen"
                className="p-1.5 rounded-full hover:bg-secondary text-primary ml-1"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Interactive Image Box */}
          <div
            className="relative h-72 sm:h-96 w-full overflow-hidden rounded-2xl bg-muted/40 flex items-center justify-center select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          >
            <div
              className="transition-transform duration-75 flex items-center justify-center p-2"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={activeChart.url}
                alt={`${activeChart.courseCode} Section ${activeChart.section}`}
                className="max-h-64 sm:max-h-88 max-w-full object-contain rounded-lg shadow pointer-events-none"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Pinch or click + to zoom in</span>
            <button
              type="button"
              onClick={() => setActiveChart(null)}
              className="font-semibold text-primary hover:underline"
            >
              Close preview
            </button>
          </div>
        </section>
      ) : null}

      {/* Courses in Section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Courses in Section {selectedSection}</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            {sectionCourses.length} courses
          </span>
        </div>

        {sectionCourses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-muted-foreground text-sm">
            No courses found for Section {selectedSection}.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sectionCourses.map((course) => {
              // Check if chart file exists for this course
              const matchingChart = availableCharts.find(
                (c) =>
                  c.courseCode.toUpperCase() === course.courseCode.toUpperCase() &&
                  (c.section.toUpperCase() === selectedSection.toUpperCase() || c.section === "All")
              );

              return (
                <div
                  key={course.courseCode}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-card p-3.5 transition-all hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-base text-foreground">
                        {course.courseCode}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0">
                        Sec {selectedSection}
                      </Badge>
                      {matchingChart && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0">
                          Photo ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {course.courseName}
                    </p>
                  </div>

                  {matchingChart ? (
                    <button
                      type="button"
                      onClick={() => setActiveChart(matchingChart)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                    >
                      <Armchair className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveChart({
                          filename: `${course.courseCode}_${selectedSection}.jpg`,
                          url: `/seating/${course.courseCode}_${selectedSection}.jpg`,
                          courseCode: course.courseCode,
                          courseName: course.courseName,
                          section: selectedSection,
                          campus: selectedCampus,
                        })
                      }
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <Armchair className="h-3.5 w-3.5" />
                      <span>Check</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Available Seating Files Discovery List */}
      {availableCharts.length > 0 && (
        <section className="mt-8 pt-6 border-t border-border/70">
          <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>All Uploaded Seating Charts ({availableCharts.length})</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {availableCharts.map((chart) => (
              <button
                key={chart.filename}
                type="button"
                onClick={() => {
                  setSelectedSection(chart.section);
                  if (chart.campus) setSelectedCampus(chart.campus);
                  setActiveChart(chart);
                }}
                className="flex flex-col items-start rounded-2xl border border-card-border bg-card p-3 text-left hover:border-primary/50 transition-all group"
              >
                <span className="font-bold text-sm group-hover:text-primary transition-colors">
                  {chart.courseCode}
                </span>
                <span className="text-xs text-muted-foreground">
                  Section {chart.section} {chart.campus ? `• ${chart.campus}` : ""}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Empty State Help Card */}
      {availableCharts.length === 0 && !isLoading && (
        <div className="mt-8 rounded-3xl border border-dashed border-primary/20 bg-primary/5 p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Info className="h-5 w-5" />
          </div>
          <h4 className="font-display font-bold text-sm mb-1">
            Seating Photos Ready for Upload
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seating photos placed in <code className="bg-background px-1 py-0.5 rounded text-[11px]">public/seating/</code> as <code className="bg-background px-1 py-0.5 rounded text-[11px]">COURSE_SECTION.jpg</code> (e.g. <code className="bg-background px-1 py-0.5 rounded text-[11px]">LSCM_G.jpg</code>) will appear here automatically.
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
