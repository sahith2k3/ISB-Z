import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getStudentById } from "@/lib/campus-data";

export const dynamic = "force-dynamic";

async function ensureTableExists() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS birthday_wishes (
      id SERIAL PRIMARY KEY,
      recipient_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT birthday_wishes_unique_per_year UNIQUE (recipient_id, sender_id, year)
    );
    CREATE INDEX IF NOT EXISTS idx_birthday_wishes_recipient_year ON birthday_wishes(recipient_id, year);
    CREATE INDEX IF NOT EXISTS idx_birthday_wishes_sender ON birthday_wishes(sender_id);
  `);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const recipientId = parseInt(idStr, 10);
  if (isNaN(recipientId)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const viewerIdParam = searchParams.get("viewerId");
  const viewerId = viewerIdParam ? parseInt(viewerIdParam, 10) : undefined;
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);

  try {
    await ensureTableExists();

    const isOwner = viewerId === recipientId;

    if (!isOwner) {
      // For friends: only check if this viewer has wished the recipient
      let hasWished = false;
      if (viewerId) {
        const check = await db.execute(
          sql`SELECT 1 FROM birthday_wishes WHERE recipient_id = ${recipientId} AND sender_id = ${viewerId} AND year = ${year} LIMIT 1;`
        );
        hasWished = (check.rows?.length ?? 0) > 0;
      }
      // Keep wish count private to the user!
      return NextResponse.json({
        recipientId,
        hasWished,
      });
    }

    // For the birthday student themselves: return full wishes and list of who wished them
    const result = await db.execute(
      sql`SELECT id, sender_id, message, created_at FROM birthday_wishes WHERE recipient_id = ${recipientId} AND year = ${year} ORDER BY created_at DESC;`
    );

    const wishes = (result.rows || []).map((row: any) => {
      const sender = getStudentById(row.sender_id);
      return {
        id: row.id,
        senderId: row.sender_id,
        senderName: sender?.name ?? `Student ${row.sender_id}`,
        senderCampus: sender?.campus ?? "hyderabad",
        senderSection: sender?.section ?? "",
        message: row.message,
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({
      recipientId,
      count: wishes.length,
      wishes,
    });
  } catch (err: any) {
    console.error("Error fetching birthday wishes:", err);
    return NextResponse.json({ error: "Failed to load birthday wishes" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const recipientId = parseInt(idStr, 10);
  if (isNaN(recipientId)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const senderId = parseInt(body.senderId, 10);
    const message = typeof body.message === "string" ? body.message.trim() : null;
    const year = parseInt(body.year || new Date().getFullYear().toString(), 10);

    if (isNaN(senderId)) {
      return NextResponse.json({ error: "Missing or invalid senderId" }, { status: 400 });
    }

    if (senderId === recipientId) {
      return NextResponse.json({ error: "You cannot wish yourself Happy Birthday" }, { status: 400 });
    }

    await ensureTableExists();

    const insertRes = await db.execute(
      sql`
        INSERT INTO birthday_wishes (recipient_id, sender_id, year, message, created_at)
        VALUES (${recipientId}, ${senderId}, ${year}, ${message}, NOW())
        ON CONFLICT (recipient_id, sender_id, year) DO NOTHING
        RETURNING id;
      `
    );

    const newlyInserted = (insertRes.rows?.length ?? 0) > 0;

    return NextResponse.json({
      success: true,
      newlyWished: newlyInserted,
      message: newlyInserted ? "Birthday wish sent!" : "You already wished this person!",
    });
  } catch (err: any) {
    console.error("Error sending birthday wish:", err);
    return NextResponse.json({ error: "Failed to send birthday wish" }, { status: 500 });
  }
}
