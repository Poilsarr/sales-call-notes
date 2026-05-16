import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = process.env.TEMP || "/tmp";
    const ext = audioFile.name.split(".").pop() || "wav";
    const audioPath = path.join(tempDir, `audio_${Date.now()}.${ext}`);
    tempFilePath = audioPath;
    await writeFile(audioPath, buffer);

    const transcript = await new Promise<string>((resolve, reject) => {
      const python = spawn("python3", ["-c", `
import sys
sys.path.insert(0, "")
try:
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(r"${audioPath.replace(/"/g, '\\"')}")
    print(result["text"])
except ImportError:
    print("WHISPER_NOT_INSTALLED")
    sys.exit(2)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`]);

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
