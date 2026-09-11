import { NextRequest, NextResponse } from "next/server";
import { db, profileViewsTable } from "@/db";
import { getStudentById } from "@/lib/campus-data";
import { sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const viewedId = parseInt(idStr, 10);

  if (isNaN(viewedId)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  const viewedStudent = getStudentById(viewedId);
  if (!viewedStudent) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  let body: { viewerId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const viewerId = body.viewerId;
  if (typeof viewerId !== "number" || isNaN(viewerId)) {
    return NextResponse.json({ error: "viewerId is required and must be a number" }, { status: 400 });
  }

  // Do not log self-views
  if (viewerId === viewedId) {
    return NextResponse.json({ message: "Self view not counted" }, { status: 200 });
  }

  const viewerStudent = getStudentById(viewerId);
  if (!viewerStudent) {
    return NextResponse.json({ error: "Viewer not found in roster" }, { status: 404 });
  }

  try {
    const result = await db.execute(sql`
      INSERT INTO profile_views (viewer_id, viewed_id, view_count, last_viewed_at)
      VALUES (${viewerId}, ${viewedId}, 1, NOW())
      ON CONFLICT (viewer_id, viewed_id)
      DO UPDATE SET
        view_count = profile_views.view_count + 1,
        last_viewed_at = NOW()
      RETURNING view_count, last_viewed_at;
    `);

    const row = result.rows[0];
    return NextResponse.json(
      {
        success: true,
        viewerId,
        viewedId,
        viewCount: row?.view_count,
        lastViewedAt: row?.last_viewed_at,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Failed to log profile view:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to log profile view" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const viewedId = parseInt(idStr, 10);

  if (isNaN(viewedId)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    const summaryResult = await db.execute(sql`
      SELECT 
        COALESCE(SUM(view_count), 0)::int as total_views,
        COUNT(*)::int as unique_viewers
      FROM profile_views
      WHERE viewed_id = ${viewedId};
    `);

    const viewsList = await db.execute(sql`
      SELECT viewer_id, view_count, last_viewed_at
      FROM profile_views
      WHERE viewed_id = ${viewedId}
      ORDER BY last_viewed_at DESC;
    `);

    const summary = summaryResult.rows[0] || { total_views: 0, unique_viewers: 0 };
    return NextResponse.json({
      viewedId,
      totalViews: summary.total_views,
      uniqueViewers: summary.unique_viewers,
      recentViews: viewsList.rows,
    });
  } catch (error: any) {
    console.error("Failed to fetch profile views:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch profile views" },
      { status: 500 },
    );
  }
}