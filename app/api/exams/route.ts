import { NextRequest, NextResponse } from "next/server";
import { allExams, getExamsForCampus, getStudentExams, getStudentById } from "@/lib/campus-data";
import type { Campus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campus = searchParams.get("campus") as Campus | null;
  const studentIdParam = searchParams.get("studentId");

  if (studentIdParam) {
    const studentId = parseInt(studentIdParam, 10);
    if (!isNaN(studentId)) {
      const student = getStudentById(studentId);
      const studentExams = getStudentExams(studentId);
      const campusExams = student ? getExamsForCampus(student.campus) : allExams;
      return NextResponse.json({
        student,
        myExams: studentExams,
        allExams: campusExams,
      });
    }
  }

  const exams = campus ? getExamsForCampus(campus) : allExams;
  return NextResponse.json({ allExams: exams });
}
