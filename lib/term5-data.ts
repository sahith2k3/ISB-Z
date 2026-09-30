import term5DataRaw from "@/data/term5-classes.json";
import type { Campus } from "./types";

export type SGStatus = "available" | "unknown" | "dropping" | "unavailable";

export interface Term5Student {
  id: number;
  name: string;
  email: string;
}

export interface Term5CourseSection {
  courseName: string;
  section: string;
  campus: Campus;
  students: Term5Student[];
}

export interface Term5Enrollment {
  courseName: string;
  section: string;
  campus: Campus;
}

export interface Term5Data {
  term: number;
  totalCourseSections: number;
  totalStudents: number;
  courses: Term5CourseSection[];
  studentEnrollments: Record<string, Term5Enrollment[]>;
}

const term5Data = term5DataRaw as Term5Data;

export function sectionKey(courseName: string, section: string): string {
  return `${courseName.toLowerCase().trim()}|${section.toLowerCase().trim()}`;
}

const sectionMap = new Map<string, Term5CourseSection>();
for (const c of term5Data.courses) {
  sectionMap.set(sectionKey(c.courseName, c.section), c);
}

export function getTerm5EnrolledCoursesForStudent(studentId: number): Term5Enrollment[] {
  return term5Data.studentEnrollments[studentId.toString()] || [];
}

export function getAllTerm5Courses(campus?: Campus): Term5CourseSection[] {
  if (!campus) return term5Data.courses;
  return term5Data.courses.filter(
    (c) => c.campus.toLowerCase() === campus.toLowerCase()
  );
}

export function getTerm5Section(courseName: string, section: string): Term5CourseSection | null {
  return sectionMap.get(sectionKey(courseName, section)) || null;
}

export function searchTerm5Courses(query: string, campus?: Campus): Term5CourseSection[] {
  const q = query.toLowerCase().trim();
  const list = getAllTerm5Courses(campus);
  if (!q) return list;
  return list.filter(
    (c) =>
      c.courseName.toLowerCase().includes(q) ||
      c.section.toLowerCase().includes(q) ||
      c.students.some((s) => s.name.toLowerCase().includes(q))
  );
}
