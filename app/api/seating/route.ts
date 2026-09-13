import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseSeatingFilename, getCampusForSection, type SeatingChartInfo } from "@/lib/seating";
import coursesData from "@/data/courses.json";
import { db, seatingChartsTable } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function ensureTableExists() {
  if (!process.env.DATABASE_URL) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS seating_charts (
        id SERIAL PRIMARY KEY,
        course_code VARCHAR(32) NOT NULL,
        section VARCHAR(16) NOT NULL,
        campus VARCHAR(16) NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        CONSTRAINT seating_charts_course_section_unique UNIQUE (course_code, section)
      );
    `);
  } catch (err) {
    console.warn("Could not auto-create seating_charts table:", err);
  }
}

export async function GET() {
  const chartMap = new Map<string, SeatingChartInfo>();

  // Map course codes to course names from courses data
  const courseNames = new Map<string, string>();
  for (const course of coursesData as Array<{ code: string; name: string }>) {
    if (course.code && course.name && !courseNames.has(course.code)) {
      courseNames.set(course.code, course.name);
    }
  }

  // 1. Fetch from Database if configured
  if (process.env.DATABASE_URL) {
    try {
      await ensureTableExists();
      const dbRows = await db.select().from(seatingChartsTable);
      for (const row of dbRows) {
        const key = `${row.courseCode.toUpperCase()}|${row.section.toUpperCase()}`;
        chartMap.set(key, {
          filename: `${row.courseCode}_${row.section}`,
          url: row.imageUrl,
          courseCode: row.courseCode.toUpperCase(),
          courseName: courseNames.get(row.courseCode.toUpperCase()) || row.courseCode,
          section: row.section.toUpperCase(),
          campus: row.campus as "hyderabad" | "mohali",
        });
      }
    } catch (dbErr) {
      console.warn("Error loading seating charts from DB:", dbErr);
    }
  }

  // 2. Scan local asset folders (public/seating, attached_assets, assets)
  const assetDirs = [
    { dir: path.join(process.cwd(), "public", "seating"), isPublic: true },
    { dir: path.join(process.cwd(), "attached_assets", "seatings"), isPublic: false },
    { dir: path.join(process.cwd(), "attached_assets"), isPublic: false },
    { dir: path.join(process.cwd(), "assets"), isPublic: false },
  ];

  for (const { dir, isPublic } of assetDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
            const parsed = parseSeatingFilename(file);
            const courseCode = (parsed?.courseCode || file.replace(/\.[^/.]+$/, "")).toUpperCase();
            const section = (parsed?.section || "All").toUpperCase();
            const campus = parsed ? getCampusForSection(section) : undefined;
            const courseName = courseNames.get(courseCode);

            const key = `${courseCode}|${section}`;
            if (!chartMap.has(key)) {
              chartMap.set(key, {
                filename: file,
                url: isPublic
                  ? `/seating/${encodeURIComponent(file)}`
                  : `/api/seating/image?file=${encodeURIComponent(file)}`,
                courseCode,
                courseName,
                section,
                campus,
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Error scanning ${dir}:`, err);
      }
    }
  }

  const result = Array.from(chartMap.values());
  result.sort((a, b) => {
    if (a.campus !== b.campus) {
      return (a.campus || "").localeCompare(b.campus || "");
    }
    if (a.section !== b.section) {
      return a.section.localeCompare(b.section);
    }
    return a.courseCode.localeCompare(b.courseCode);
  });

  return NextResponse.json({ charts: result });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode, section, campus, imageUrl } = body;

    if (!courseCode || !section || !imageUrl) {
      return NextResponse.json(
        { error: "courseCode, section, and imageUrl are required" },
        { status: 400 }
      );
    }

    const cCode = courseCode.toUpperCase().trim();
    const sec = section.toUpperCase().trim();
    const camp = campus || getCampusForSection(sec);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not configured to persist seating charts" },
        { status: 500 }
      );
    }

    await ensureTableExists();

    await db.execute(sql`
      INSERT INTO seating_charts (course_code, section, campus, image_url, created_at)
      VALUES (${cCode}, ${sec}, ${camp}, ${imageUrl}, NOW())
      ON CONFLICT (course_code, section)
      DO UPDATE SET
        image_url = EXCLUDED.image_url,
        campus = EXCLUDED.campus,
        created_at = NOW();
    `);

    return NextResponse.json({
      success: true,
      chart: {
        courseCode: cCode,
        section: sec,
        campus: camp,
        url: imageUrl,
      },
    });
  } catch (error: any) {
    console.error("Error saving seating chart:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save seating chart" },
      { status: 500 }
    );
  }
}
