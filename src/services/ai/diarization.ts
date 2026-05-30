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
    const scriptPath = path.join(process.cwd(), 'src/services/ai/scripts/diarize.py');

    const result = await new Promise<DiarizationResult>((resolve, reject) => {
      const python = spawn("python3", [scriptPath, audioPath]);

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
                label: s.label,
                segments: s.segments,
                duration: s.segments.reduce((acc: number, seg: any) => acc + (seg.end - seg.start), 0),
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
    const scriptPath = path.join(process.cwd(), 'src/services/ai/scripts/detect_lang.py');

    const result = await new Promise<string>((resolve, reject) => {
      const python = spawn("python3", [scriptPath, audioPath]);

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
