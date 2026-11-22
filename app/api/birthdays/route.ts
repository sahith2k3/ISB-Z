import { NextRequest, NextResponse } from "next/server";
import { getStudentsWithBirthdayToday, getUpcomingBirthdays } from "@/lib/campus-data";
import type { Campus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "upcoming";
  const rawCampus = searchParams.get("campus");
  const campus = rawCampus === "hyderabad" || rawCampus === "mohali" ? (rawCampus as Campus) : undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

  if (type === "today") {
    let students = getStudentsWithBirthdayToday();
    if (campus) {
      students = students.filter((s) => s.campus === campus);
    }
    return NextResponse.json({ type: "today", count: students.length, students });
  }

  const upcoming = getUpcomingBirthdays(limit, campus);
  return NextResponse.json({ type: "upcoming", count: upcoming.length, students: upcoming });
}
