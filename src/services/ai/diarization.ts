import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import path from "path";

export interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
}

export interface DiarizationResult {
  speakers: Array<{
    label: string;
    name?: string;
    segments: SpeakerSegment[];
    duration: number;
  }>;
  transcript: string;
}

export class DiarizationService {
  async diarize(audioPath: string): Promise<DiarizationResult> {
    const result = await new Promise<DiarizationResult>((resolve, reject) => {
      const python = spawn("python3", ["-c", `
import sys
try:
    from pyannote.audio import Pipeline
    import torch

    pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
    pipeline.to(torch.device("cpu"))

    diarization = pipeline("${audioPath}")

    speakers = {}
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        if speaker not in speakers:
            speakers[speaker] = []
        speakers[speaker].append({
            "speaker": speaker,
            "start": turn.start,
            "end": turn.end
        })

    import json
    print(json.dumps({"speakers": list(speakers.values())}))
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`]);

      let output = "";
      let error = "";

      python.stdout.on("data", (data) => { output += data.toString(); });
      python.stderr.on("data", (data) => { error += data.toString(); });
      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(error || "Diarization failed"));
        } else {
          try {
            const data = JSON.parse(output.trim());
            resolve({
              speakers: data.speakers.map((s: any) => ({
                label: s[0]?.speaker || "Unknown",
                segments: s,
                duration: s.reduce((acc: number, seg: any) => acc + (seg.end - seg.start), 0),
              })),
              transcript: "",
            });
          } catch (e) {
            reject(new Error("Failed to parse diarization output"));
          }
        }
      });
    });

    return result;
  }

  async detectLanguage(audioPath: string): Promise<string> {
    const result = await new Promise<string>((resolve, reject) => {
      const python = spawn("python3", ["-c", `
import sys
try:
    import whisper
    model = whisper.load_model("base")
    audio = whisper.load_audio("${audioPath}")
    result = model.transcribe(audio, language=None)
    print(result.get("language", "en"))
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`]);

      let output = "";
      let error = "";

      python.stdout.on("data", (data) => { output += data.toString(); });
      python.stderr.on("data", (data) => { error += data.toString(); });
      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(error || "Language detection failed"));
        } else {
          resolve(output.trim());
        }
      });
    });

    return result;
  }
}