/**
 * Birthday detection and formatting utility for ISBusy.
 * Evaluates whether a student's birthday is today in Asia/Kolkata timezone.
 */

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

export function getTodayKolkataMMDD(): string {
  // Check for test override in browser (URL param or localStorage)
  if (typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const testDate = urlParams.get("testDate") || window.localStorage.getItem("isbusy_test_date");
      if (testDate && /^\d{2}-\d{2}$/.test(testDate)) {
        return testDate;
      }
    } catch {}
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${month}-${day}`;
}

export function parseDobToMMDD(dob?: string | null): string | null {
  if (!dob) return null;
  const clean = dob.trim().toLowerCase();
  const m = clean.match(/^(\d{1,2})-([a-z]{3})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const monStr = m[2];
  const month = MONTH_MAP[monStr];
  if (!month) return null;
  return `${month}-${day.toString().padStart(2, "0")}`;
}

export function isStudentBirthdayToday(
  student?: { id?: number; birthDate?: string; dob?: string } | null,
  forceDate?: string
): boolean {
  if (!student) return false;

  // Check test override in browser
  if (typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      // If ?testBirthday=true or ?testBirthday=1 or localStorage, test user is always celebrating
      const testBday = urlParams.get("testBirthday") || window.localStorage.getItem("isbusy_test_birthday");
      if (testBday === "true" || testBday === "1") {
        return true;
      }
      const testStudentId = urlParams.get("testStudentId");
      if (testStudentId && String(student.id) === testStudentId) {
        return true;
      }
    } catch {}
  }

  const todayMMDD = forceDate || getTodayKolkataMMDD();

  if (student.birthDate) {
    return student.birthDate === todayMMDD;
  }

  if (student.dob) {
    const parsed = parseDobToMMDD(student.dob);
    return parsed === todayMMDD;
  }

  return false;
}

export function formatDobForDisplay(dob?: string | null): string {
  if (!dob) return "";
  const parts = dob.split("-");
  if (parts.length === 2) {
    // If "22-Nov" -> "Nov 22"
    if (isNaN(Number(parts[0]))) {
      return `${parts[0]} ${parts[1]}`;
    }
    return `${parts[1]} ${parts[0]}`;
  }
  return dob;
}
