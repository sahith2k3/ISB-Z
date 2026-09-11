import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, friendshipsTable, friendshipAuditLogsTable } from "@/db";
import { getStudentById, getLiveStatus, toStudentSummary } from "@/lib/campus-data";
import { SAHITH_STUDENT_ID } from "@/lib/local-friends";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const ownerId = parseInt(idStr, 10);

  if (isNaN(ownerId)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  const owner = getStudentById(ownerId);
  if (!owner) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const idsParam = _request.nextUrl.searchParams.get("ids");
  if (idsParam !== null) {
    const friendIds = idsParam
      ? idsParam
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n) && n > 0)
      : [];

    const entries = friendIds
      .map((fid) => {
        const friend = getStudentById(fid);
        if (!friend) return null;
        const status = getLiveStatus(friend.id);
        return { student: toStudentSummary(friend), ...status };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => {
        if (a.isInClass !== b.isInClass) return a.isInClass ? 1 : -1;
        return a.student.name.localeCompare(b.student.name);
      });

    return NextResponse.json(entries);
  }

  // Only Sahith is allowed to fetch/import friendships directly from the server DB without providing local ids
  if (ownerId !== SAHITH_STUDENT_ID) {
    return NextResponse.json([]);
  }

  try {
    const rows = await db
      .select()
      .from(friendshipsTable)
      .where(eq(friendshipsTable.ownerId, ownerId));

    const entries = rows
      .map((row) => {
        const friend = getStudentById(row.friendId);
        if (!friend) return null;
        const status = getLiveStatus(friend.id);
        return { student: toStudentSummary(friend), ...status };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      // free friends first, then alphabetical by name
      .sort((a, b) => {
        if (a.isInClass !== b.isInClass) return a.isInClass ? 1 : -1;
        return a.student.name.localeCompare(b.student.name);
      });

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error("Failed to fetch friends from database:", error);
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured. Please set DATABASE_URL in Vercel." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to load friends" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const ownerId = parseInt(idStr, 10);

  if (isNaN(ownerId)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  const owner = getStudentById(ownerId);
  if (!owner) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  let body: { friendId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const friendId = body.friendId;
  if (typeof friendId !== "number") {
    return NextResponse.json({ error: "friendId is required and must be a number" }, { status: 400 });
  }

  if (ownerId === friendId) {
    return NextResponse.json({ error: "You cannot add yourself as a friend" }, { status: 400 });
  }

  const friend = getStudentById(friendId);
  if (!friend) {
    return NextResponse.json({ error: "Friend not found in roster" }, { status: 404 });
  }

  try {
    const existing = await db
      .select()
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.ownerId, ownerId),
          eq(friendshipsTable.friendId, friendId),
        ),
      );

    if (existing.length === 0) {
      await db.insert(friendshipsTable).values({ ownerId, friendId });
    }

    // Record friendship activity in audit logs for analytics
    await db.insert(friendshipAuditLogsTable).values({
      ownerId,
      friendId,
      action: "add",
    });

    const status = getLiveStatus(friend.id);
    return NextResponse.json(
      { student: toStudentSummary(friend), ...status },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Failed to add friend in database:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add friend" },
      { status: 500 },
    );
  }
}
