import { db } from "@/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { type SGStatus, sectionKey } from "./term5-data";

export interface LocalStatusRecord {
  studentId: number;
  courseName: string;
  section: string;
  campus: string;
  status: SGStatus;
  updatedAt: string;
}

const LOCAL_STORE_PATH = path.join(process.cwd(), "data", "sg-statuses.json");

function readLocalStore(): Record<string, LocalStatusRecord> {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const content = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
      return JSON.parse(content) || {};
    }
  } catch (err) {
    console.warn("Could not read local sg-statuses.json:", err);
  }
  return {};
}

function writeLocalStore(data: Record<string, LocalStatusRecord>) {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write local sg-statuses.json:", err);
  }
}

const memoryCache: Record<string, LocalStatusRecord> = readLocalStore();

export function recordKey(studentId: number, courseName: string, section: string): string {
  return `${studentId}|${courseName.toLowerCase().trim()}|${section.toLowerCase().trim()}`;
}

let tableChecked = false;
async function ensureTableExists() {
  if (tableChecked || !process.env.DATABASE_URL) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS study_group_statuses (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        course_name VARCHAR(256) NOT NULL,
        section VARCHAR(32) NOT NULL,
        campus VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        CONSTRAINT study_group_statuses_unique UNIQUE (student_id, course_name, section)
      );
    `);
    tableChecked = true;
  } catch (err) {
    console.warn("Could not auto-create study_group_statuses table:", err);
  }
}

export async function getSectionStatuses(
  courseName: string,
  section: string
): Promise<Map<number, { status: SGStatus; updatedAt: string }>> {
  const result = new Map<number, { status: SGStatus; updatedAt: string }>();

  // 1. Load from memory / local store
  for (const item of Object.values(memoryCache)) {
    if (
      item.courseName.toLowerCase().trim() === courseName.toLowerCase().trim() &&
      item.section.toLowerCase().trim() === section.toLowerCase().trim()
    ) {
      result.set(item.studentId, { status: item.status, updatedAt: item.updatedAt });
    }
  }

  // 2. Fetch from database if available
  if (process.env.DATABASE_URL) {
    try {
      await ensureTableExists();
      const rows: any = await db.execute(sql`
        SELECT student_id, status, updated_at
        FROM study_group_statuses
        WHERE LOWER(TRIM(course_name)) = LOWER(TRIM(${courseName}))
          AND LOWER(TRIM(section)) = LOWER(TRIM(${section}))
      `);
      const rowList = rows.rows || rows;
      if (Array.isArray(rowList)) {
        for (const row of rowList) {
          result.set(row.student_id, {
            status: row.status as SGStatus,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          });
          const key = recordKey(row.student_id, courseName, section);
          memoryCache[key] = {
            studentId: row.student_id,
            courseName,
            section,
            campus: "",
            status: row.status as SGStatus,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          };
        }
      }
    } catch (dbErr) {
      console.warn("Error loading section statuses from DB:", dbErr);
    }
  }

  return result;
}

export async function getStudentStatuses(
  studentId: number
): Promise<Map<string, { status: SGStatus; updatedAt: string }>> {
  const result = new Map<string, { status: SGStatus; updatedAt: string }>();

  // 1. From memory
  for (const item of Object.values(memoryCache)) {
    if (item.studentId === studentId) {
      result.set(sectionKey(item.courseName, item.section), {
        status: item.status,
        updatedAt: item.updatedAt,
      });
    }
  }

  // 2. From DB
  if (process.env.DATABASE_URL) {
    try {
      await ensureTableExists();
      const rows: any = await db.execute(sql`
        SELECT course_name, section, status, updated_at
        FROM study_group_statuses
        WHERE student_id = ${studentId}
      `);
      const rowList = rows.rows || rows;
      if (Array.isArray(rowList)) {
        for (const row of rowList) {
          result.set(sectionKey(row.course_name, row.section), {
            status: row.status as SGStatus,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          });
          const key = recordKey(studentId, row.course_name, row.section);
          memoryCache[key] = {
            studentId,
            courseName: row.course_name,
            section: row.section,
            campus: "",
            status: row.status as SGStatus,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          };
        }
      }
    } catch (dbErr) {
      console.warn("Error loading student statuses from DB:", dbErr);
    }
  }

  return result;
}

export async function getAllStoredStatuses(): Promise<LocalStatusRecord[]> {
  if (process.env.DATABASE_URL) {
    try {
      await ensureTableExists();
      const rows: any = await db.execute(sql`
        SELECT student_id, course_name, section, campus, status, updated_at
        FROM study_group_statuses
      `);
      const rowList = rows.rows || rows;
      if (Array.isArray(rowList)) {
        for (const row of rowList) {
          const key = recordKey(row.student_id, row.course_name, row.section);
          memoryCache[key] = {
            studentId: row.student_id,
            courseName: row.course_name,
            section: row.section,
            campus: row.campus || "",
            status: row.status as SGStatus,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          };
        }
      }
    } catch (dbErr) {
      console.warn("Error loading all statuses from DB:", dbErr);
    }
  }

  return Object.values(memoryCache);
}

export async function upsertStudyGroupStatus(params: {
  studentId: number;
  courseName: string;
  section: string;
  campus: string;
  status: SGStatus;
}): Promise<{ success: boolean; updatedAt: string }> {
  const now = new Date().toISOString();
  const { studentId, courseName, section, campus, status } = params;

  // 1. Save to memory cache & local file
  const key = recordKey(studentId, courseName, section);
  memoryCache[key] = {
    studentId,
    courseName,
    section,
    campus,
    status,
    updatedAt: now,
  };
  writeLocalStore(memoryCache);

  // 2. Persist to Postgres
  if (process.env.DATABASE_URL) {
    try {
      await ensureTableExists();
      await db.execute(sql`
        INSERT INTO study_group_statuses (student_id, course_name, section, campus, status, updated_at)
        VALUES (${studentId}, ${courseName}, ${section}, ${campus}, ${status}, NOW())
        ON CONFLICT (student_id, course_name, section)
        DO UPDATE SET
          status = EXCLUDED.status,
          campus = EXCLUDED.campus,
          updated_at = NOW();
      `);
    } catch (dbErr) {
      console.warn("Error saving study group status to DB:", dbErr);
    }
  }

  return { success: true, updatedAt: now };
}
