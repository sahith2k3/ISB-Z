import { NextRequest, NextResponse } from "next/server";
import { db, shareEventsTable } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function ensureTableExists() {
  if (!process.env.DATABASE_URL) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS share_events (
        id SERIAL PRIMARY KEY,
        student_id INTEGER,
        student_name VARCHAR(128),
        campus VARCHAR(32),
        source VARCHAR(64) NOT NULL,
        method VARCHAR(32) NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
  } catch (err) {
    console.warn("Could not auto-create share_events table:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { studentId, studentName, campus, source = "web_button", method = "unknown" } = body;
    const userAgent = request.headers.get("user-agent") || undefined;

    console.log(`[Share] ${studentName || studentId || "Anonymous"} shared via ${method} (source: ${source})`);

    if (process.env.DATABASE_URL) {
      await ensureTableExists();
      await db.insert(shareEventsTable).values({
        studentId: studentId ? Number(studentId) : null,
        studentName: studentName || null,
        campus: campus || null,
        source: String(source).slice(0, 64),
        method: String(method).slice(0, 32),
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
      });

      // Get updated count
      const countRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM share_events;`);
      const total = (countRes.rows[0] as any)?.count || 1;

      return NextResponse.json({ success: true, totalShares: total });
    }

    return NextResponse.json({ success: true, totalShares: 1 });
  } catch (error: any) {
    console.error("Error recording share event:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, totalShares: 0, recentShares: [] });
    }

    await ensureTableExists();
    const countRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM share_events;`);
    const total = (countRes.rows[0] as any)?.count || 0;

    const recentRes = await db.execute(
      sql`SELECT id, student_name, campus, source, method, created_at FROM share_events ORDER BY created_at DESC LIMIT 10;`
    );

    return NextResponse.json({
      success: true,
      totalShares: total,
      recentShares: recentRes.rows,
    });
  } catch (error: any) {
    console.error("Error fetching share stats:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
