import { NextResponse } from "next/server";
import { getSchedulerWorkingDates } from "@/lib/campus-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const dates = getSchedulerWorkingDates(7);
  return NextResponse.json(
    { dates },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
