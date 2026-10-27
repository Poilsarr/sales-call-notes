import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "gauge-extension-1.0.0.zip");
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Extension archive not found" }, { status: 404 });
  }
  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="gauge-extension-1.0.0.zip"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
