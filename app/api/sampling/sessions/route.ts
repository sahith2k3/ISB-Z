import { NextResponse } from "next/server";
import { getAllSamplingSessions } from "@/lib/campus-data";
import type { Campus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campusParam = searchParams.get("campus");
  const campus = (campusParam === "hyderabad" || campusParam === "mohali") ? (campusParam as Campus) : undefined;

  const sessions = getAllSamplingSessions(campus);

  return NextResponse.json(
    { sessions },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    }
  );
}
