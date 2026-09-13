"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Armchair,
  MapPin,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
  AlertCircle,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useLocalStudent } from "@/hooks/use-local-student";
import { useGetStudent } from "@/lib/api-client";
import { CAMPUS_SECTIONS, type SeatingChartInfo } from "@/lib/seating";
import { Badge } from "@/components/ui/badge";
import sessionsData from "@/data/sessions.json";
import coursesData from "@/data/courses.json";

export default function SeatingPage() {
  const { studentId, campus: localCampus } = useLocalStudent();
  const { data: me } = useGetStudent(studentId || 0);

  // Selected campus & section
  const [selectedCampus, setSelectedCampus] = useState<"hyderabad" | "mohali">("hyderabad");
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [activeChart, setActiveChart] = useState<SeatingChartInfo | null>(null);
  const [availableCharts, setAvailableCharts] = useState<SeatingChartInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active chart image loading / error states
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Zoom & Pan state
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

  // Load available charts
  const fetchCharts = () => {
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
  };

  useEffect(() => {
    fetchCharts();
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

  // Reset zoom & image state on active chart change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setImgLoading(true);
    setImgError(false);
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
    <div className="min-h-[100dvh] w-full max-w-md mx-auto overflow-x-hidden overflow-y-auto bg-background px-4 pb-32 pt-5">
      {/* Header */}
      <header className="mb-5 w-full min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 mb-1.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Armchair className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 truncate">
              Classroom layouts
            </p>
            <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
              Seating Charts
            </h1>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-normal break-words">
          Find your seat for upcoming classes across Hyderabad and Mohali.
        </p>
      </header>

      {/* Campus Switcher */}
      <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary p-1 border border-border w-full">
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
      <div className="mb-5 w-full min-w-0">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Select Section
          </p>
          <span className="text-[11px] text-muted-foreground">
            {selectedCampus === "hyderabad" ? "Sec A – F" : "Sec G – L"}
          </span>
        </div>
        <div className="w-full min-w-0 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
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
                  className={`relative flex h-9 shrink-0 whitespace-nowrap items-center justify-center rounded-xl px-3.5 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-card border border-card-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  Section {sec}
                  {isUserSection && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Chart Viewer (if selected) */}
      {activeChart ? (
        <section className="mb-6 rounded-3xl border border-card-border bg-card p-3.5 sm:p-4 shadow-sm w-full min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-border/70 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-base text-foreground leading-tight truncate">
                {activeChart.courseCode} · Section {activeChart.section}
              </h3>
              {activeChart.courseName && (
                <p className="text-xs text-muted-foreground truncate">{activeChart.courseName}</p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 bg-secondary/80 rounded-xl p-1">
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 text-[11px] font-semibold text-muted-foreground"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <a
                href={activeChart.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Full screen"
                className="p-1 rounded-lg hover:bg-background text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
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
            {imgLoading && !imgError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/60 backdrop-blur-[1px] z-10">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground font-medium">Loading layout...</p>
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
                  className="max-h-64 sm:max-h-88 max-w-full object-contain rounded-lg shadow pointer-events-none"
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
      ) : null}

      {/* Courses in Section */}
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

        {sectionCourses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-muted-foreground text-sm">
            No courses scheduled for Section {selectedSection}.
          </div>
        ) : (
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
                  className="flex items-center justify-between gap-2.5 rounded-2xl border border-card-border bg-card p-3 sm:p-3.5 transition-all hover:border-primary/40 w-full min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="font-bold text-base text-foreground">
                        {course.courseCode}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0">
                        Sec {selectedSection}
                      </Badge>
                      {matchingChart && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0">
                          Seating ready
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
                      className="flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                    >
                      <Armchair className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-1 text-muted-foreground">
                      Coming soon
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Uploaded Charts Quick Grid */}
      {availableCharts.length > 0 && (
        <section className="mt-8 pt-6 border-t border-border/70 w-full min-w-0">
          <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>All Seating Charts ({availableCharts.length})</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {availableCharts.map((chart) => (
              <button
                key={`${chart.courseCode}-${chart.section}`}
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
                <span className="text-xs text-muted-foreground truncate w-full">
                  Sec {chart.section} {chart.campus ? `• ${chart.campus}` : ""}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  );
}
