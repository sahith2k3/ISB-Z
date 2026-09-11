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

export interface LiveStatus {
  isInClass: boolean;
  currentSession: ClassSession | null;
  nextSession: ClassSession | null;
}

export interface StudentStatus extends LiveStatus {
  student: StudentSummary;
}

export interface FriendEntry extends LiveStatus {
  student: StudentSummary;
}

export interface HealthStatus {
  status: string;
}
