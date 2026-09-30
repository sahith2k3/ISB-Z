import { NextRequest, NextResponse } from "next/server";
import {
  getTerm5EnrolledCoursesForStudent,
  getAllTerm5Courses,
  getTerm5Section,
  sectionKey,
  type SGStatus,
} from "@/lib/term5-data";
import {
  getSectionStatuses,
  getStudentStatuses,
  upsertStudyGroupStatus,
  getAllStoredStatuses,
} from "@/lib/sg-status-store";
import type { Campus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_WEIGHT: Record<SGStatus, number> = {
  available: 1,
  unknown: 2,
  dropping: 3,
  unavailable: 4,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseName = searchParams.get("courseName");
    const section = searchParams.get("section");
    const studentIdParam = searchParams.get("studentId");
    const campusParam = searchParams.get("campus") as Campus | null;

    // 1. If courseName and section are specified: return section roster with statuses
    if (courseName && section) {
      const sectionData = getTerm5Section(courseName, section);
      if (!sectionData) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }

      const statusMap = await getSectionStatuses(courseName, section);

      const studentsWithStatus = sectionData.students.map((student) => {
        const stored = statusMap.get(student.id);
        const status: SGStatus = stored?.status || "unknown";
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          status,
          updatedAt: stored?.updatedAt,
        };
      });

      // Strict Ordering: available -> unknown -> mostly gonna drop -> unavailable
      // Secondary: alphabetical by student name
      studentsWithStatus.sort((a, b) => {
        const wA = STATUS_WEIGHT[a.status] ?? 2;
        const wB = STATUS_WEIGHT[b.status] ?? 2;
        if (wA !== wB) return wA - wB;
        return a.name.localeCompare(b.name);
      });

      const counts = {
        total: studentsWithStatus.length,
        available: studentsWithStatus.filter((s) => s.status === "available").length,
        unknown: studentsWithStatus.filter((s) => s.status === "unknown").length,
        dropping: studentsWithStatus.filter((s) => s.status === "dropping").length,
        unavailable: studentsWithStatus.filter((s) => s.status === "unavailable").length,
      };

      return NextResponse.json({
        courseName: sectionData.courseName,
        section: sectionData.section,
        campus: sectionData.campus,
        counts,
        students: studentsWithStatus,
      });
    }

    // 2. If studentId is provided: return their enrolled courses with current statuses, plus all courses
    let myEnrolledCourses: any[] = [];
    let studentIdNum: number | null = null;

    if (studentIdParam) {
      studentIdNum = parseInt(studentIdParam, 10);
      if (!isNaN(studentIdNum) && studentIdNum > 0) {
        const enrollments = getTerm5EnrolledCoursesForStudent(studentIdNum);
        const studentStatusMap = await getStudentStatuses(studentIdNum);

        myEnrolledCourses = enrollments.map((e) => {
          const sec = getTerm5Section(e.courseName, e.section);
          const key = sectionKey(e.courseName, e.section);
          const statusInfo = studentStatusMap.get(key);
          return {
            courseName: e.courseName,
            section: e.section,
            campus: e.campus,
            studentCount: sec?.students.length || 0,
            myStatus: (statusInfo?.status || "unknown") as SGStatus,
            updatedAt: statusInfo?.updatedAt,
          };
        });
      }
    }

    // 3. Return summary of all courses (optionally filtered by campus)
    const allCourses = getAllTerm5Courses(campusParam || undefined);
    const storedList = await getAllStoredStatuses();

    // Map: sectionKey -> counts
    const statusCountsMap = new Map<string, { available: number; dropping: number; unavailable: number }>();
    for (const item of storedList) {
      const key = sectionKey(item.courseName, item.section);
      const curr = statusCountsMap.get(key) || { available: 0, dropping: 0, unavailable: 0 };
      if (item.status === "available") curr.available++;
      else if (item.status === "dropping") curr.dropping++;
      else if (item.status === "unavailable") curr.unavailable++;
      statusCountsMap.set(key, curr);
    }

    const coursesSummary = allCourses.map((c) => {
      const key = sectionKey(c.courseName, c.section);
      const counts = statusCountsMap.get(key) || { available: 0, dropping: 0, unavailable: 0 };
      return {
        courseName: c.courseName,
        section: c.section,
        campus: c.campus,
        studentCount: c.students.length,
        statusCounts: counts,
      };
    });

    return NextResponse.json({
      myEnrolledCourses,
      allCourses: coursesSummary,
    });
  } catch (error: any) {
    console.error("Error in SG planner API:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load SG planner data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, courseName, section, campus, status } = body;

    if (!studentId || typeof studentId !== "number") {
      return NextResponse.json({ error: "studentId is required and must be a number" }, { status: 400 });
    }
    if (!courseName || !section) {
      return NextResponse.json({ error: "courseName and section are required" }, { status: 400 });
    }

    const validStatuses: SGStatus[] = ["available", "unknown", "dropping", "unavailable"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await upsertStudyGroupStatus({
      studentId,
      courseName: courseName.trim(),
      section: section.trim(),
      campus: campus || "hyderabad",
      status,
    });

    return NextResponse.json({
      success: true,
      studentId,
      courseName,
      section,
      status,
      updatedAt: result.updatedAt,
    });
  } catch (error: any) {
    console.error("Error updating SG status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update study group status" },
      { status: 500 }
    );
  }
}
