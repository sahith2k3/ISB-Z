import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file");
  if (!file) {
    return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
  }

  // Prevent path traversal
  const sanitized = path.basename(file);
  const possibleDirs = [
    path.join(process.cwd(), "public", "seating"),
    path.join(process.cwd(), "attached_assets"),
    path.join(process.cwd(), "assets"),
  ];

  for (const dir of possibleDirs) {
    const filePath = path.join(dir, sanitized);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(sanitized).toLowerCase();
      let contentType = "image/jpeg";
      if (ext === ".png") contentType = "image/png";
      else if (ext === ".webp") contentType = "image/webp";

      const buffer = fs.readFileSync(filePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return NextResponse.json({ error: "File not found" }, { status: 404 });
}
