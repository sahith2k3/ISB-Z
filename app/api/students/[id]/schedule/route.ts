import { NextRequest, NextResponse } from "next/server";
import { getStudentById, getScheduleForDate, nowInKolkata } from "@/lib/campus-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  const student = getStudentById(id);
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const { date } = nowInKolkata();
  const schedule = getScheduleForDate(student.id, date);

  return NextResponse.json(schedule);
}
