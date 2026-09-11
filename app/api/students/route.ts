import { NextRequest, NextResponse } from "next/server";
import { searchStudents } from "@/lib/campus-data";
import type { Campus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campus = searchParams.get("campus") as Campus | null;
  const search = searchParams.get("search") || undefined;
  const limitStr = searchParams.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 10;

  if (campus && campus !== "hyderabad" && campus !== "mohali") {
    return NextResponse.json({ error: "Invalid campus parameter" }, { status: 400 });
  }

  const results = searchStudents({
    campus: campus || undefined,
    search,
    limit: isNaN(limit) ? 10 : limit,
  });

  return NextResponse.json(results);
}
