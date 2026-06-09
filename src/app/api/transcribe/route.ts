import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { detectAudioType } from "@/lib/audio-types";
import { getSecret } from "@/lib/secrets";
import { captureApiError } from "@/lib/sentry";
import { isQuotaError, quotaErrorResponse, captureQuotaEvent } from "@/lib/quota-guard";
import {
  EXTENSION_MAX_TRANSCRIPT_CHARS,
  clampTranscriptText,
  isValidExtensionSource,
  sanitizeExtensionTitle,
  sanitizeSessionId,
} from "@/lib/extension-upload";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let tempFilePath: string | null = null;

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const transcriptField = formData.get("transcript");
    const sourceField = formData.get("source");
    const sessionIdField = formData.get("sessionId");
    const meetingTitleField = formData.get("meetingTitle");

    const providedTranscript = typeof transcriptField === "string"
      ? clampTranscriptText(transcriptField)
      : "";

    if (!audioFile && !providedTranscript) {
      return NextResponse.json(
        { error: "No audio file or transcript provided" },
        { status: 400 },
      );
    }

    if (!audioFile && providedTranscript) {
      const source = isValidExtensionSource(typeof sourceField === "string" ? sourceField : null)
        ? sourceField
        : "web";
      return NextResponse.json({
        transcript: providedTranscript,
        source,
        sessionId: sanitizeSessionId(typeof sessionIdField === "string" ? sessionIdField : ""),
        meetingTitle: sanitizeExtensionTitle(typeof meetingTitleField === "string" ? meetingTitleField : ""),
        length: providedTranscript.length,
        maxLength: EXTENSION_MAX_TRANSCRIPT_CHARS,
      });
    }

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const type = detectAudioType(buffer);
    const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/aac'];
    if (!type || !allowedMimeTypes.includes(type.mime)) {
      return NextResponse.json({ error: 'Invalid audio file format. Please upload a valid audio file.' }, { status: 400 });
    }

    const tempDir = getSecret("TEMP") || "/tmp";
    const origExt = audioFile.name.split(".").pop()?.toLowerCase() || '';
    const safeExt = ['wav', 'mp3', 'm4a', 'ogg', 'webm', 'flac'].includes(origExt) ? origExt : 'wav';
    const audioPath = path.join(tempDir, `audio_${Date.now()}.${safeExt}`);
    tempFilePath = audioPath;
    await writeFile(audioPath, buffer);

    const transcript = await new Promise<string>((resolve, reject) => {
      const python = spawn("python3", ["-c", `
import sys
sys.path.insert(0, "")
try:
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(sys.argv[1])
    print(result["text"])
except ImportError:
    print("WHISPER_NOT_INSTALLED")
    sys.exit(2)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`, audioPath]);

      let output = "";
      let error = "";

      python.stdout.on("data", (data: Buffer) => { output += data.toString(); });
      python.stderr.on("data", (data: Buffer) => { error += data.toString(); });
      python.on("close", (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else if (code === 2 || output.includes("WHISPER_NOT_INSTALLED")) {
          reject(new Error("Whisper not installed. Install with: pip install whisper openai-whisper"));
        } else {
          reject(new Error(error || "Whisper transcription failed"));
        }
      });
    });

    return NextResponse.json({ transcript });
  } catch (error) {
    if (isQuotaError(error)) {
      captureQuotaEvent(error, "transcribe");
      return quotaErrorResponse();
    }
    captureApiError("/api/transcribe", error, { method: "POST" });
    return NextResponse.json(
      { error: "Transcription failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (tempFilePath) {
      try { await unlink(tempFilePath); } catch { /* ignore */ }
    }
  }
}
