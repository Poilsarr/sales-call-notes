import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { canAccessCall } from "@/lib/call-access";
import { isTrustedBlobUrl } from "@/lib/blob-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIO_CONTENT_TYPES: Record<string, string> = {
  webm: "audio/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const viewer = await getUserByClerkId(clerkUserId);

    const call = await prisma.call.findUnique({
      where: { id },
      select: { userId: true, teamId: true, sharedWithTeam: true, audioUrl: true, filename: true },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (!canAccessCall(viewer, call)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!call.audioUrl) {
      return NextResponse.json({ error: "No audio on this call" }, { status: 404 });
    }

    if (!isTrustedBlobUrl(call.audioUrl)) {
      return NextResponse.json({ error: "Audio unavailable" }, { status: 403 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN not set" }, { status: 500 });
    }

    const blobRes = await fetch(call.audioUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!blobRes.ok) {
      return NextResponse.json({ error: `Failed to fetch audio: ${blobRes.status}` }, { status: 502 });
    }

    const ext = (call.filename || call.audioUrl).split(".").pop()?.toLowerCase() || "";
    const contentType =
      blobRes.headers.get("content-type") ||
      AUDIO_CONTENT_TYPES[ext] ||
      "application/octet-stream";

    const downloadName = call.filename || "recording." + ext;

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${downloadName}"`);
    headers.set("Cache-Control", "no-store");

    return new NextResponse(blobRes.body, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to fetch audio: ${message}` }, { status: 500 });
  }
}
