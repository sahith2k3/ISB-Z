import term5DataRaw from "@/data/term5-classes.json";
import term6DataRaw from "@/data/term6-classes.json";
import type { Campus } from "./types";

export type SGStatus = "available" | "unknown" | "dropping" | "unavailable";

export interface SgStudent {
  id: number;
  name: string;
  email: string;
  dob?: string;
  birthDate?: string;
}

export interface SgCourseSection {
  term: number;
  courseName: string;
  section: string;
  campus: Campus;
  students: SgStudent[];
}

export interface SgEnrollment {
  term: number;
  courseName: string;
  section: string;
  campus: Campus;
}

export interface SgTermDataset {
  term: number;
  totalCourseSections: number;
  totalStudents: number;
  courses: SgCourseSection[];
  studentEnrollments: Record<string, SgEnrollment[]>;
}

const term5Data = term5DataRaw as any;
const term6Data = term6DataRaw as any;

export function sectionKey(courseName: string, section: string): string {
  return `${courseName.toLowerCase().trim()}|${section.toLowerCase().trim()}`;
}

// Build fast lookup maps
const term6SectionMap = new Map<string, SgCourseSection>();
for (const c of (term6Data?.courses || [])) {
  term6SectionMap.set(sectionKey(c.courseName, c.section), { ...c, term: 6 });
}

const term5SectionMap = new Map<string, SgCourseSection>();
for (const c of (term5Data?.courses || [])) {
  term5SectionMap.set(sectionKey(c.courseName, c.section), { ...c, term: 5 });
}

export function getEnrolledCoursesForStudent(studentId: number, term = 6): SgEnrollment[] {
  const sid = studentId.toString();
  if (term === 6) {
    const t6 = term6Data?.studentEnrollments?.[sid];
    if (t6 && t6.length > 0) return t6.map((e: any) => ({ ...e, term: 6 }));
    // If student has no term 6 enrollments yet (e.g. Hyderabad awaiting list), check term 5
    const t5 = term5Data?.studentEnrollments?.[sid];
    if (t5 && t5.length > 0) return t5.map((e: any) => ({ ...e, term: 5 }));
    return [];
  }
  const t5 = term5Data?.studentEnrollments?.[sid];
  return (t5 || []).map((e: any) => ({ ...e, term: 5 }));
}

export function getAllCoursesForTerm(term = 6, campus?: Campus): SgCourseSection[] {
  const dataset = term === 6 ? (term6Data?.courses || []) : (term5Data?.courses || []);
  const mapped = dataset.map((c: any) => ({ ...c, term }));
  if (!campus) return mapped;
  return mapped.filter((c: any) => c.campus?.toLowerCase() === campus.toLowerCase());
}

export function getCourseSection(courseName: string, section: string, preferredTerm = 6): SgCourseSection | null {
  const key = sectionKey(courseName, section);
  if (preferredTerm === 6) {
    const s6 = term6SectionMap.get(key);
    if (s6) return s6;
    return term5SectionMap.get(key) || null;
  }
  const s5 = term5SectionMap.get(key);
  if (s5) return s5;
  return term6SectionMap.get(key) || null;
}
