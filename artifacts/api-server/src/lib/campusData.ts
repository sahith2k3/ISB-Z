import coursesJson from "../data/courses.json";
import studentsJson from "../data/students.json";
import enrollmentsJson from "../data/enrollments.json";
import sessionsJson from "../data/sessions.json";

export type Campus = "hyderabad" | "mohali";

export interface StudentSummary {
  id: number;
  name: string;
  email: string;
  campus: Campus;
  section: string;
}

export interface Student extends StudentSummary {
  studyGroup: string;
}

export interface ClassSession {
  courseCode: string;
  courseName: string;
  section: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  room: string | null;
}

export interface ScheduleDay {
  date: string;
  sessions: ClassSession[];
}

interface Course {
  code: string;
  name: string;
  category: string;
  campus: Campus;
  sections: string[];
  venue: string;
  faculty: string;
}

interface Enrollment {
  studentId: number;
  courseCode: string;
  section: string;
}

interface RawSession {
  campus: Campus;
  courseCode: string;
  section: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string | null;
}

const courses = coursesJson as Course[];
const students = studentsJson as Student[];
const enrollments = enrollmentsJson as Enrollment[];
const rawSessions = sessionsJson as RawSession[];

const courseByCode = new Map<string, Course>(courses.map((c) => [c.code, c]));
const studentById = new Map<number, Student>(students.map((s) => [s.id, s]));

// courseCode|section -> student ids enrolled in that section
const rosterByCourseSection = new Map<string, number[]>();
for (const e of enrollments) {
  const key = `${e.courseCode}|${e.section}`;
  const list = rosterByCourseSection.get(key);
  if (list) {
    list.push(e.studentId);
  } else {
    rosterByCourseSection.set(key, [e.studentId]);
  }
}

// studentId -> that student's enrollments (courseCode, section)
const enrollmentsByStudent = new Map<number, Enrollment[]>();
for (const e of enrollments) {
  const list = enrollmentsByStudent.get(e.studentId);
  if (list) {
    list.push(e);
  } else {
    enrollmentsByStudent.set(e.studentId, [e]);
  }
}

function toClassSession(s: RawSession): ClassSession {
  const course = courseByCode.get(s.courseCode);
  return {
    courseCode: s.courseCode,
    courseName: course?.name ?? s.courseCode,
    section: s.section,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
  };
}

// studentId -> all of that student's sessions across the whole term, sorted by date+start time
const sessionsByStudent = new Map<number, ClassSession[]>();
for (const [studentId, studentEnrollments] of enrollmentsByStudent) {
  const keys = new Set(
    studentEnrollments.map((e) => `${e.courseCode}|${e.section}`),
  );
  const sessions: ClassSession[] = [];
  for (const raw of rawSessions) {
    if (keys.has(`${raw.courseCode}|${raw.section}`)) {
      sessions.push(toClassSession(raw));
    }
  }
  sessions.sort((a, b) =>
    a.date === b.date
      ? a.startTime.localeCompare(b.startTime)
      : a.date.localeCompare(b.date),
  );
  sessionsByStudent.set(studentId, sessions);
}

export function getStudentById(id: number): Student | undefined {
  return studentById.get(id);
}

export function searchStudents(opts: {
  campus?: Campus;
  search?: string;
  limit: number;
}): StudentSummary[] {
  const term = opts.search?.trim().toLowerCase();
  const results: StudentSummary[] = [];
  for (const s of students) {
    if (opts.campus && s.campus !== opts.campus) continue;
    if (
      term &&
      !s.name.toLowerCase().includes(term) &&
      !s.email.toLowerCase().includes(term)
    ) {
      continue;
    }
    results.push({
      id: s.id,
      name: s.name,
      email: s.email,
      campus: s.campus,
      section: s.section,
    });
    if (results.length >= opts.limit) break;
  }
  return results;
}

export function getScheduleForDate(
  studentId: number,
  date: string,
): ClassSession[] {
  const sessions = sessionsByStudent.get(studentId) ?? [];
  return sessions.filter((s) => s.date === date);
}

export function getWorkingDaySchedules(studentId: number): ScheduleDay[] {
  const { date: today } = nowInKolkata();
  const sessions = sessionsByStudent.get(studentId) ?? [];
  const dates = [...new Set(sessions.map((session) => session.date))]
    .filter((date) => date >= today)
    .sort()
    .slice(0, 2);

  return dates.map((date) => ({
    date,
    sessions: sessions.filter((session) => session.date === date),
  }));
}

/** Asia/Kolkata "today" in YYYY-MM-DD form, and current HH:MM, independent of server timezone. */
export function nowInKolkata(): { date: string; time: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  let time = `${get("hour")}:${get("minute")}`;
  if (time === "24:00") time = "00:00"; // some locales format midnight as 24:00
  return { date, time };
}

export interface LiveStatus {
  isInClass: boolean;
  currentSession: ClassSession | null;
  nextSession: ClassSession | null;
}

export function getLiveStatus(studentId: number): LiveStatus {
  const { date, time } = nowInKolkata();
  const todaySessions = getScheduleForDate(studentId, date);

  let currentSession: ClassSession | null = null;
  let nextSession: ClassSession | null = null;

  for (const s of todaySessions) {
    if (s.startTime <= time && time < s.endTime) {
      currentSession = s;
    } else if (s.startTime > time && !nextSession) {
      nextSession = s;
    }
  }

  return {
    isInClass: currentSession !== null,
    currentSession,
    nextSession,
  };
}

export function toStudentSummary(s: Student): StudentSummary {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    campus: s.campus,
    section: s.section,
  };
}
