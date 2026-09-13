import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseSeatingFilename, getCampusForSection, type SeatingChartInfo } from "@/lib/seating";
import sessionsData from "@/data/sessions.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const seatingDir = path.join(process.cwd(), "public", "seating");

  if (!fs.existsSync(seatingDir)) {
    return NextResponse.json({ charts: [] });
  }

  try {
    const files = fs.readdirSync(seatingDir);
    const charts: SeatingChartInfo[] = [];

    // Map course codes to course names from sessions data
    const courseNames = new Map<string, string>();
    for (const session of sessionsData) {
      if (session.courseCode && session.courseName && !courseNames.has(session.courseCode)) {
        courseNames.set(session.courseCode, session.courseName);
      }
    }

    for (const file of files) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
        const parsed = parseSeatingFilename(file);
        const courseCode = parsed?.courseCode || file.replace(/\.[^/.]+$/, "");
        const section = parsed?.section || "All";
        const campus = parsed ? getCampusForSection(section) : undefined;
        const courseName = courseNames.get(courseCode);

        charts.push({
          filename: file,
          url: `/seating/${encodeURIComponent(file)}`,
          courseCode,
          courseName,
          section,
          campus,
        });
      }
    }

    // Sort by campus, section, courseCode
    charts.sort((a, b) => {
      if (a.campus !== b.campus) {
        return (a.campus || "").localeCompare(b.campus || "");
      }
      if (a.section !== b.section) {
        return a.section.localeCompare(b.section);
      }
      return a.courseCode.localeCompare(b.courseCode);
    });

    return NextResponse.json({ charts });
  } catch (error: any) {
    console.error("Error reading seating charts directory:", error);
    return NextResponse.json({ charts: [], error: error?.message }, { status: 500 });
  }
}
