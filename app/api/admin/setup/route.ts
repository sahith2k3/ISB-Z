import { NextRequest, NextResponse } from "next/server";
import { initDatabaseAndSeed } from "@/db/init";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      {
        success: false,
        error: "DATABASE_URL is not configured in this environment.",
        hasDbUrl: false,
        envKeys: Object.keys(process.env).filter(
          (k) => !k.includes("KEY") && !k.includes("SECRET") && !k.includes("TOKEN") && !k.includes("PASS")
        ),
      },
      { status: 503 },
    );
  }

  const result = await initDatabaseAndSeed();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const connectionString = body.databaseUrl || process.env.DATABASE_URL;

    if (!connectionString) {
      return NextResponse.json(
        {
          success: false,
          error: "No connection string provided in request body (databaseUrl) or environment (DATABASE_URL).",
        },
        { status: 400 },
      );
    }

    const result = await initDatabaseAndSeed(connectionString);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
