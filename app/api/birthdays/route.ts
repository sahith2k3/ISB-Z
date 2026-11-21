import { NextRequest, NextResponse } from "next/server";
import { getStudentsWithBirthdayToday, getUpcomingBirthdays } from "@/lib/campus-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "upcoming";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

  if (type === "today") {
    const students = getStudentsWithBirthdayToday();
    return NextResponse.json({ type: "today", count: students.length, students });
  }

  const upcoming = getUpcomingBirthdays(limit);
  return NextResponse.json({ type: "upcoming", count: upcoming.length, students: upcoming });
}
