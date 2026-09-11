import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, friendshipsTable } from "@/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; friendId: string }> },
) {
  const { id: idStr, friendId: friendIdStr } = await params;
  const ownerId = parseInt(idStr, 10);
  const friendId = parseInt(friendIdStr, 10);

  if (isNaN(ownerId) || isNaN(friendId)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.ownerId, ownerId),
          eq(friendshipsTable.friendId, friendId),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Failed to delete friend from database:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove friend" },
      { status: 500 },
    );
  }
}
